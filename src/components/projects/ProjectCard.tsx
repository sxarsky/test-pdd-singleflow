import { useState, useRef, useEffect } from 'react';
import { Calendar, User, MoreVertical, Folder, GripVertical, ListTodo, Eye } from 'lucide-react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Project, Task } from '../../lib/database.types';
import { ProjectDragData, TaskDragData } from '../../utils/dragAndDrop';
import { EditProjectModal } from './EditProjectModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { ViewTaskModal } from '../tasks/ViewTaskModal';
import { EditTaskModal } from '../tasks/EditTaskModal';
import { AbbreviatedTaskCard } from '../tasks/AbbreviatedTaskCard';
import { projectsApi, tasksApi } from '../../lib/api';

interface ProjectCardProps {
  project: Project;
  index: number;
  tasks: Task[];
  projects: Project[];
  onView: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onTaskUpdate: () => void;
}

export function ProjectCard({ project, index, tasks, projects, onView, onUpdate, onDelete, onTaskUpdate }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleteTaskLoading, setDeleteTaskLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const cleanupDraggable = draggable({
      element,
      getInitialData: (): ProjectDragData => ({
        type: 'project',
        id: project.id,
        index,
        project,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDropTarget = dropTargetForElements({
      element,
      getData: ({ source }) => {
        const sourceData = source.data as ProjectDragData | TaskDragData;

        if (sourceData.type === 'task') {
          return {
            type: 'project-task-zone',
            projectId: project.id,
          };
        }

        return {
          type: 'project',
          id: project.id,
          index,
          project,
        };
      },
      canDrop: ({ source }) => {
        const sourceData = source.data as ProjectDragData | TaskDragData;

        if (sourceData.type === 'project') {
          return sourceData.id !== project.id;
        }

        if (sourceData.type === 'task') {
          return project.status !== 'archived';
        }

        return false;
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [project, index]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleView = () => {
    setShowMenu(false);
    onView();
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await projectsApi.delete(project.id);

      if (response.error) {
        throw new Error(response.error);
      }

      onDelete();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const confirmTaskDelete = async () => {
    if (!deletingTask) return;
    setDeleteTaskLoading(true);
    try {
      const response = await tasksApi.delete(deletingTask.id);

      if (response.error) {
        throw new Error(response.error);
      }

      onTaskUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setDeleteTaskLoading(false);
      setDeletingTask(null);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    onUpdate();
  };

  return (
    <div
      ref={cardRef}
      data-testid={`projects-card-${project.id}`}
      className={`bg-white rounded-lg border transition-all p-6 relative cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        isOver ? 'border-blue-500 border-2 shadow-xl' : 'border-gray-200 hover:shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing" data-testid="projects-card-drag-handle">
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Folder className="w-5 h-5 text-blue-600" />
          </div>
          <div className="bg-blue-600 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center" data-testid={`projects-card-order-${project.id}`}>
            {index + 1}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900" data-testid="projects-card-title">{project.name}</h3>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(
                project.status
              )}`}
              data-testid="projects-card-status-badge"
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          data-testid={`projects-card-menu-button-${project.id}`}
        >
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>

        {showMenu && (
          <div className="absolute right-6 top-14 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-10 min-w-[120px]" data-testid={`projects-card-menu-${project.id}`}>
            <button
              onClick={handleView}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
              data-testid={`projects-card-menu-view-${project.id}`}
            >
              <Eye className="w-3 h-3" />
              View
            </button>
            <button
              onClick={handleEdit}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
              data-testid={`projects-card-menu-edit-${project.id}`}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600"
              data-testid={`projects-card-menu-delete-${project.id}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2" data-testid="projects-card-description">
        {project.description || 'No description provided'}
      </p>

      <div className="mb-4 border-t pt-4 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <ListTodo className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-medium text-gray-700">Tasks</h4>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded">
              <p className="text-xs text-gray-400">No tasks yet</p>
            </div>
          ) : (
            tasks.map((task, taskIndex) => (
              <AbbreviatedTaskCard
                key={task.id}
                task={task}
                index={taskIndex}
                onView={setViewingTask}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1" data-testid="projects-card-created-date">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(project.created_at)}</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span>Owner</span>
        </div>
      </div>

      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Project"
          message={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will also delete all tasks associated with this project.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
          variant="danger"
        />
      )}

      {viewingTask && (
        <ViewTaskModal
          task={viewingTask}
          projects={projects}
          onClose={() => setViewingTask(null)}
          onEdit={() => {
            setEditingTask(viewingTask);
            setViewingTask(null);
          }}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          projects={projects}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            onTaskUpdate();
          }}
        />
      )}

      {deletingTask && (
        <ConfirmationModal
          title="Delete Task"
          message={`Are you sure you want to delete "${deletingTask.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmTaskDelete}
          onCancel={() => setDeletingTask(null)}
          loading={deleteTaskLoading}
          variant="danger"
        />
      )}
    </div>
  );
}
