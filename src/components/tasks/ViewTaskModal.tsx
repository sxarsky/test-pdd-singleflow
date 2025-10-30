import { X, Calendar, AlertCircle, Folder, Edit2 } from 'lucide-react';
import { Task, Project } from '../../lib/database.types';

interface ViewTaskModalProps {
  task: Task;
  projects: Project[];
  onClose: () => void;
  onEdit: () => void;
}

export function ViewTaskModal({ task, projects, onClose, onEdit }: ViewTaskModalProps) {
  const project = projects.find((p) => p.id === task.project_id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="tasks-view-modal">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="tasks-view-modal-title">Task Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              data-testid="tasks-view-modal-edit-button"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              data-testid="tasks-view-modal-close-button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4" data-testid="tasks-view-modal-task-title">
              {task.title}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${getPriorityColor(
                  task.priority
                )}`}
                data-testid="tasks-view-modal-priority-badge"
              >
                {task.priority === 'urgent' && <AlertCircle className="w-4 h-4" />}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </span>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(
                  task.status
                )}`}
                data-testid="tasks-view-modal-status-badge"
              >
                {getStatusLabel(task.status)}
              </span>
            </div>
          </div>

          {task.description && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed" data-testid="tasks-view-modal-description">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Project</h4>
              </div>
              <p className="text-gray-900 font-medium" data-testid="tasks-view-modal-project">
                {project ? project.name : 'Unknown Project'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Due Date</h4>
              </div>
              <p className="text-gray-900 font-medium" data-testid="tasks-view-modal-due-date">
                {formatDate(task.due_date)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Created</span>
              <span className="text-gray-900" data-testid="tasks-view-modal-created-date">
                {formatDateTime(task.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Last Updated</span>
              <span className="text-gray-900" data-testid="tasks-view-modal-updated-date">
                {formatDateTime(task.updated_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
            data-testid="tasks-view-modal-close-footer-button"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            data-testid="tasks-view-modal-edit-footer-button"
          >
            <Edit2 className="w-4 h-4" />
            Edit Task
          </button>
        </div>
      </div>
    </div>
  );
}
