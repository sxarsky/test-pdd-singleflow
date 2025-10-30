import { Task } from '../../lib/database.types';
import { CalendarDayCell } from './CalendarDayCell';
import { getCalendarDays, isSameDay, parseISODate, WEEKDAY_NAMES } from '../../utils/dateUtils';

interface CalendarGridProps {
  currentMonth: Date;
  tasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function CalendarGrid({
  currentMonth,
  tasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
}: CalendarGridProps) {
  const calendarDays = getCalendarDays(currentMonth);

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = parseISODate(task.due_date);
      return isSameDay(taskDate, date);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAY_NAMES.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-semibold text-gray-700 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => (
          <CalendarDayCell
            key={index}
            date={date}
            currentMonth={currentMonth}
            tasks={getTasksForDate(date)}
            onViewTask={onViewTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
}
