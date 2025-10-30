import { X, Calendar, User, Edit2, ListTodo } from 'lucide-react';
import { Project, Task } from '../../lib/database.types';

interface ViewProjectModalProps {
  project: Project;
  tasks?: Task[];
  onClose: () => void;
  onEdit: () => void;
  onTaskClick?: (task: Task) => void;
}

export function ViewProjectModal({ project, tasks = [], onClose, onEdit, onTaskClick }: ViewProjectModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'review':
        return 'bg-purple-100 text-purple-700';
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'blocked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (date: string) => {
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

  const tasksByStatus = {
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="projects-view-modal">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="projects-view-modal-title">Project Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              data-testid="projects-view-modal-edit-button"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              data-testid="projects-view-modal-close-button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4" data-testid="projects-view-modal-project-name">
              {project.name}
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(
                project.status
              )}`}
              data-testid="projects-view-modal-status-badge"
            >
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>

          {project.description && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed" data-testid="projects-view-modal-description">
                {project.description}
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Tasks ({tasks.length})
              </h4>
            </div>

            {tasks.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  <div className="bg-gray-50 rounded p-2 text-center border border-gray-200">
                    <div className="text-2xl font-bold text-gray-700">{tasksByStatus.open}</div>
                    <div className="text-xs text-gray-600">Open</div>
                  </div>
                  <div className="bg-blue-50 rounded p-2 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{tasksByStatus.in_progress}</div>
                    <div className="text-xs text-blue-600">In Progress</div>
                  </div>
                  <div className="bg-purple-50 rounded p-2 text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">{tasksByStatus.review}</div>
                    <div className="text-xs text-purple-600">Review</div>
                  </div>
                  <div className="bg-green-50 rounded p-2 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{tasksByStatus.done}</div>
                    <div className="text-xs text-green-600">Done</div>
                  </div>
                  <div className="bg-red-50 rounded p-2 text-center border border-red-200">
                    <div className="text-2xl font-bold text-red-700">{tasksByStatus.blocked}</div>
                    <div className="text-xs text-red-600">Blocked</div>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className={`p-3 border border-gray-200 rounded-lg transition-all ${
                        onTaskClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
                      }`}
                      data-testid={`projects-view-modal-task-${task.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate">{task.title}</h5>
                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{task.description}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getTaskStatusColor(task.status)}`}>
                          {getTaskStatusLabel(task.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded">
                <p className="text-sm text-gray-500">No tasks in this project yet</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Created</h4>
              </div>
              <p className="text-gray-900 font-medium" data-testid="projects-view-modal-created-date">
                {formatDate(project.created_at)}
              </p>
              <p className="text-sm text-gray-600 mt-1">{formatDateTime(project.created_at)}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Owner</h4>
              </div>
              <p className="text-gray-900 font-medium">Project Owner</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Last Updated</span>
              <span className="text-gray-900" data-testid="projects-view-modal-updated-date">
                {formatDateTime(project.updated_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
            data-testid="projects-view-modal-close-footer-button"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            data-testid="projects-view-modal-edit-footer-button"
          >
            <Edit2 className="w-4 h-4" />
            Edit Project
          </button>
        </div>
      </div>
    </div>
  );
}
