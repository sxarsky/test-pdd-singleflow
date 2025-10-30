import { useEffect, useRef, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Task, Project } from '../../lib/database.types';
import { TaskCard } from './TaskCard';
import { TaskDragData } from '../../utils/dragAndDrop';

interface KanbanColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  count: number;
  color: string;
  projects: Project[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function KanbanColumn({ title, status, tasks, count, color, projects, onViewTask, onEditTask, onDeleteTask }: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ status }),
      canDrop: ({ source }) => {
        const sourceData = source.data as TaskDragData;
        return sourceData.type === 'task';
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });
  }, [status]);

  return (
    <div
      ref={columnRef}
      data-testid={`tasks-column-${status}`}
      className={`flex flex-col bg-gray-50 rounded-lg p-4 min-h-[600px] transition-all ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h3 className="font-semibold text-gray-900" data-testid={`tasks-column-title-${status}`}>{title}</h3>
          <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full" data-testid={`tasks-column-count-${status}`}>
            {count}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-3" data-testid={`tasks-column-tasks-${status}`}>
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg" data-testid={`tasks-column-empty-state-${status}`}>
            <p className="text-sm text-gray-400">No tasks</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              projects={projects}
              onView={onViewTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
