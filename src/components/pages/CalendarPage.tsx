import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { tasksApi, projectsApi } from '../../lib/api';
import { Task, Project } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarGrid } from '../calendar/CalendarGrid';
import { TaskDragData } from '../../utils/dragAndDrop';
import { formatMonthYear, addMonths, startOfMonth, endOfMonth, formatDateISO } from '../../utils/dateUtils';
import { ViewTaskModal } from '../tasks/ViewTaskModal';
import { EditTaskModal } from '../tasks/EditTaskModal';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

export function CalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
        console.error('Error fetching projects:', response.error);
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
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const startDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() - 7);
      const endDate = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);

      const response = await tasksApi.getAll();
      if (response.error) {
        console.error('Error fetching tasks:', response.error);
        setTasks([]);
        return;
      }

      // Filter tasks by date range
      const filteredTasks = (response.data || []).filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= startDate && dueDate <= endDate;
      });

      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [user, currentMonth]);

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceData = source.data as TaskDragData;
        if (sourceData.type !== 'task') return;

        const destinationData = destination.data as { date?: string };
        if (!destinationData.date) return;

        const newDueDate = new Date(destinationData.date).toISOString();

        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === sourceData.id ? { ...task, due_date: newDueDate } : task
          )
        );

        (async () => {
          try {
            const response = await tasksApi.update(sourceData.id, { due_date: newDueDate });
            if (response.error) throw new Error(response.error);
          } catch (error) {
            console.error('Error updating task due date:', error);
            fetchTasks();
          }
        })();
      },
    });
  }, []);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
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

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    fetchTasks();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <select
            value={currentMonth.getMonth()}
            onChange={(e) => {
              const newMonth = new Date(currentMonth);
              newMonth.setMonth(parseInt(e.target.value));
              setCurrentMonth(newMonth);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900"
            data-testid="calendar-month-select"
          >
            {['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
              <option key={i} value={i}>{month}</option>
            ))}
          </select>

          <select
            value={currentMonth.getFullYear()}
            onChange={(e) => {
              const newMonth = new Date(currentMonth);
              newMonth.setFullYear(parseInt(e.target.value));
              setCurrentMonth(newMonth);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900"
            data-testid="calendar-year-select"
          >
            {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <CalendarGrid
        currentMonth={currentMonth}
        tasks={tasks}
        onViewTask={handleViewTask}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
      />

      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
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
