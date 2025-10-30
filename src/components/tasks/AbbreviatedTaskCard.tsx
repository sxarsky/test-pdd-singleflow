import { useEffect, useRef, useState } from 'react';
import { GripVertical, Calendar, AlertCircle, MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Task } from '../../lib/database.types';
import { TaskDragData } from '../../utils/dragAndDrop';

interface AbbreviatedTaskCardProps {
  task: Task;
  index: number;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function AbbreviatedTaskCard({ task, index, onView, onEdit, onDelete }: AbbreviatedTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
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

    return () => {
      cleanupDraggable();
    };
  }, [task.id, index]);

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
      data-testid={`abbreviated-task-card-${task.id}`}
      className={`bg-gray-50 rounded border border-gray-200 p-2 transition-all cursor-grab active:cursor-grabbing hover:bg-white hover:shadow-sm relative ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div data-testid={`abbreviated-task-card-drag-handle-${task.id}`} className="text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing mt-0.5">
          <GripVertical className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h5 className="font-medium text-sm text-gray-900 truncate flex-1">{task.title}</h5>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors cursor-pointer flex-shrink-0"
              data-testid={`abbreviated-task-card-menu-button-${task.id}`}
            >
              <MoreVertical className="w-3 h-3 text-gray-400" />
            </button>
          </div>
          {showMenu && (
            <div className="absolute right-2 top-8 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-20 min-w-[100px]" data-testid={`abbreviated-task-card-menu-${task.id}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onView(task);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"
                data-testid={`abbreviated-task-card-menu-view-${task.id}`}
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
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"
                data-testid={`abbreviated-task-card-menu-edit-${task.id}`}
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
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs text-red-600 flex items-center gap-2"
                data-testid={`abbreviated-task-card-menu-delete-${task.id}`}
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority === 'urgent' && <AlertCircle className="w-2.5 h-2.5" />}
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-2.5 h-2.5" />
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
