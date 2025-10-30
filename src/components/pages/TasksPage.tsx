import { useEffect, useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { tasksApi, projectsApi } from '../../lib/api';
import { Task, Project } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { KanbanColumn } from '../tasks/KanbanColumn';
import { TaskDragData, calculateNewOrder, reorderItemsAcrossColumns, getItemIndex, getReorderDestinationIndex } from '../../utils/dragAndDrop';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { ViewTaskModal } from '../tasks/ViewTaskModal';
import { EditTaskModal } from '../tasks/EditTaskModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

const TASK_STATUSES = [
  { id: 'open', label: 'Open', color: 'bg-gray-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', label: 'Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-500' },
] as const;

export function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const response = await projectsApi.getAll();
      if (response.error) {
        console.error('Error:', response.error);
        return;
      }
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const projectId = selectedProject !== 'all' ? selectedProject : undefined;
      const response = await tasksApi.getAll(projectId);

      if (response.error) {
        console.error('Error:', response.error);
        return;
      }
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [user, selectedProject]);

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        console.log('Drop event:', { source: source.data, dropTargets: location.current.dropTargets.map(t => t.data) });

        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceData = source.data as TaskDragData;
        if (sourceData.type !== 'task') return;

        const destinationTask = destination.data as TaskDragData;
        const destinationColumn = location.current.dropTargets.find(
          target => (target.data as any).status && !(target.data as TaskDragData).task
        );

        const sourceStatus = sourceData.status;
        const destinationStatus = destinationTask.type === 'task'
          ? destinationTask.status
          : (destinationColumn?.data as { status?: Task['status'] })?.status;

        console.log('Status check:', { sourceStatus, destinationStatus });
        if (!destinationStatus) return;

        const sourceTasks = tasks
          .filter((t) => t.status === sourceStatus)
          .sort((a, b) => a.display_order - b.display_order);
        const destinationTasks = tasks
          .filter((t) => t.status === destinationStatus)
          .sort((a, b) => a.display_order - b.display_order);

        const sourceIndex = getItemIndex(sourceTasks, sourceData.id);
        if (sourceIndex === -1) return;

        if (sourceStatus === destinationStatus) {
          if (destinationTask.type !== 'task') return;

          const targetIndex = getItemIndex(destinationTasks, destinationTask.id);
          if (targetIndex === -1) return;

          const closestEdge = extractClosestEdge(destinationTask);
          console.log('Reordering within same column:', {
            sourceIndex,
            targetIndex,
            closestEdge,
            sourceTask: sourceData.task.title,
            targetTask: destinationTask.task.title
          });

          const destinationIndex = getReorderDestinationIndex(
            sourceIndex,
            targetIndex,
            closestEdge
          );

          console.log('Calculated destinationIndex:', destinationIndex);

          if (sourceIndex === destinationIndex) {
            console.log('Source and destination are the same, returning');
            return;
          }

          const reorderedTasks = calculateNewOrder(sourceTasks, sourceIndex, destinationIndex);
          console.log('Reordered tasks:', reorderedTasks.map(t => ({ title: t.title, display_order: t.display_order })));

          const updatedTasks = tasks.map((task) => {
            const reordered = reorderedTasks.find((t) => t.id === task.id);
            return reordered || task;
          });

          setTasks(updatedTasks);

          (async () => {
            await tasksApi.reorder(
              reorderedTasks.map(t => ({
                id: t.id,
                display_order: t.display_order,
                status: t.status
              }))
            );
          })();
        } else {
          let destinationIndex = destinationTasks.length;

          if (destinationTask.type === 'task') {
            const targetIndex = getItemIndex(destinationTasks, destinationTask.id);
            if (targetIndex !== -1) {
              const closestEdge = extractClosestEdge(destinationTask);
              destinationIndex = getReorderDestinationIndex(
                sourceIndex,
                targetIndex,
                closestEdge
              );
            }
          }

          const movedTask = { ...sourceData.task, status: destinationStatus };
          const { updatedSource, updatedDestination } = reorderItemsAcrossColumns(
            sourceTasks,
            destinationTasks,
            sourceIndex,
            destinationIndex,
            movedTask
          );

          const updatedTasks = tasks.map((task) => {
            if (task.status === sourceStatus) {
              const updated = updatedSource.find((t) => t.id === task.id);
              return updated || task;
            }
            if (task.status === destinationStatus) {
              const updated = updatedDestination.find((t) => t.id === task.id);
              return updated || task;
            }
            return task;
          });

          const taskMovedToNewStatus = updatedDestination.find((t) => t.id === sourceData.id);
          if (taskMovedToNewStatus) {
            const finalTasks = updatedTasks.filter((t) => t.id !== sourceData.id);
            finalTasks.push(taskMovedToNewStatus);
            setTasks(finalTasks);
          } else {
            setTasks(updatedTasks);
          }

          (async () => {
            const allUpdates = [
              { id: sourceData.id, display_order: movedTask.display_order, status: destinationStatus },
              ...updatedSource.map(task => ({
                id: task.id,
                display_order: task.display_order,
                status: task.status
              })),
              ...updatedDestination
                .filter((t) => t.id !== sourceData.id)
                .map(task => ({
                  id: task.id,
                  display_order: task.display_order,
                  status: task.status
                }))
            ];
            await tasksApi.reorder(allUpdates);
          })();
        }
      },
    });
  }, [tasks]);

  const getTasksByStatus = (status: Task['status']) => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    fetchTasks();
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleEditFromView = () => {
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleDeleteTask = (task: Task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask) return;

    setDeleteLoading(true);
    try {
      const response = await tasksApi.delete(selectedTask.id);

      if (response.error) throw new Error(response.error);

      setShowDeleteModal(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    fetchTasks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tasks-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900" data-testid="tasks-page-title">Tasks</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          data-testid="tasks-page-create-button"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      <div className="flex items-center gap-4">
        <label htmlFor="project-filter" className="text-sm font-medium text-gray-700" data-testid="tasks-page-project-filter-label">
          Filter by project:
        </label>
        <select
          id="project-filter"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          data-testid="tasks-page-project-filter"
        >
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300" data-testid="tasks-page-empty-state">
          <ListChecks className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-4">
            {selectedProject === 'all'
              ? 'Create your first task to get started'
              : 'No tasks in this project yet'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            data-testid="tasks-page-empty-create-button"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="tasks-page-board">
          {TASK_STATUSES.map((status) => {
            const statusTasks = getTasksByStatus(status.id as Task['status']);
            return (
              <KanbanColumn
                key={status.id}
                title={status.label}
                status={status.id as Task['status']}
                tasks={statusTasks}
                count={statusTasks.length}
                color={status.color}
                projects={projects}
                onViewTask={handleViewTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          defaultProjectId={selectedProject !== 'all' ? selectedProject : undefined}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTaskCreated}
        />
      )}

      {showViewModal && selectedTask && (
        <ViewTaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTask(null);
          }}
          onEdit={handleEditFromView}
        />
      )}

      {showEditModal && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {showDeleteModal && selectedTask && (
        <ConfirmationModal
          title="Delete Task"
          message={`Are you sure you want to delete "${selectedTask.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedTask(null);
          }}
          loading={deleteLoading}
          variant="danger"
        />
      )}
    </div>
  );
}
