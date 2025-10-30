import { useEffect, useRef, useState } from 'react';
import { GripVertical, Calendar, AlertCircle, MoreVertical, CreditCard as Edit2, Trash2, Eye } from 'lucide-react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge, type Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import { Task, Project } from '../../lib/database.types';
import { TaskDragData } from '../../utils/dragAndDrop';

interface TaskCardProps {
  task: Task;
  index: number;
  projects: Project[];
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, index, projects, onView, onEdit, onDelete }: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const cleanupDraggable = draggable({
      element,
      getInitialData: (): TaskDragData => ({
        type: 'task',
        id: task.id,
        index,
        task,
        status: task.status,
        projectId: task.project_id,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDropTarget = dropTargetForElements({
      element,
      getData: ({ input }) => {
        const data: TaskDragData = {
          type: 'task',
          id: task.id,
          index,
          task,
          status: task.status,
          projectId: task.project_id,
        };
        return attachClosestEdge(data, {
          element,
          input,
          allowedEdges: ['top', 'bottom'],
        });
      },
      canDrop: ({ source }) => {
        const sourceData = source.data as TaskDragData;
        return sourceData.type === 'task' && sourceData.id !== task.id;
      },
      onDragEnter: ({ self }) => {
        const edge = extractClosestEdge(self.data);
        setClosestEdge(edge);
      },
      onDrag: ({ self }) => {
        const edge = extractClosestEdge(self.data);
        setClosestEdge(edge);
      },
      onDragLeave: () => setClosestEdge(null),
      onDrop: () => setClosestEdge(null),
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [task, index]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      ref={cardRef}
      data-testid={`tasks-card-${task.id}`}
      className={`bg-white rounded-lg border p-4 transition-all cursor-grab active:cursor-grabbing relative ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${closestEdge ? 'shadow-lg' : 'border-gray-200 hover:shadow-md'}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing mt-1" data-testid={`tasks-card-drag-handle-${task.id}`}>
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="bg-slate-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-1" data-testid={`tasks-card-order-${task.id}`}>
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex-1" data-testid={`tasks-card-title-${task.id}`}>{task.title}</h4>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                data-testid={`tasks-card-menu-button-${task.id}`}
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-6 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-20 min-w-[120px]" data-testid={`tasks-card-menu-${task.id}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onView(task);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                    data-testid={`tasks-card-menu-view-${task.id}`}
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                    data-testid={`tasks-card-menu-edit-${task.id}`}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(task);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600 flex items-center gap-2"
                    data-testid={`tasks-card-menu-delete-${task.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2" data-testid={`tasks-card-description-${task.id}`}>{task.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                task.priority
              )}`}
              data-testid={`tasks-card-priority-badge-${task.id}`}
            >
              {task.priority === 'urgent' && <AlertCircle className="w-3 h-3" />}
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500" data-testid={`tasks-card-due-date-${task.id}`}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
      {closestEdge && <DropIndicator edge={closestEdge} gap="8px" />}
    </div>
  );
}
