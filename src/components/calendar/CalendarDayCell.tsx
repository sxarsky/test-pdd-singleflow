import { useEffect, useRef, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Task } from '../../lib/database.types';
import { AbbreviatedTaskCard } from '../tasks/AbbreviatedTaskCard';
import { isToday, isSameMonth, isWeekend, formatDateISO } from '../../utils/dateUtils';
import { TaskDragData } from '../../utils/dragAndDrop';

interface CalendarDayCellProps {
  date: Date;
  currentMonth: Date;
  tasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function CalendarDayCell({
  date,
  currentMonth,
  tasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
}: CalendarDayCellProps) {
  const [isOver, setIsOver] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const isWeekendDay = isWeekend(date);

  const dateISO = date.toISOString();

  useEffect(() => {
    const element = cellRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ date: dateISO }),
      canDrop: ({ source }) => {
        const sourceData = source.data as TaskDragData;
        return sourceData.type === 'task';
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });
  }, [dateISO]);

  return (
    <div
      ref={cellRef}
      data-testid={`calendar-cell-${formatDateISO(date)}`}
      className={`min-h-[120px] border border-gray-200 p-2 transition-colors ${
        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
      } ${isWeekendDay && isCurrentMonth ? 'bg-blue-50/30' : ''} ${
        isOver ? 'bg-blue-100 border-blue-400' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-medium ${
            isTodayDate
              ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
              : isCurrentMonth
              ? 'text-gray-900'
              : 'text-gray-400'
          }`}
        >
          {date.getDate()}
        </span>
        {tasks.length > 3 && (
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            +{tasks.length - 3}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {tasks.slice(0, 3).map((task, index) => (
          <AbbreviatedTaskCard
            key={task.id}
            task={task}
            index={index}
            onView={onViewTask}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
}
