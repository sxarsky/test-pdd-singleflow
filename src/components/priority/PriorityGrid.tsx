import { useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, Calendar, AlertCircle } from 'lucide-react';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Task, Project } from '../../lib/database.types';
import { getInstanceId, getPriorityBorderColor } from '../../utils/priorityGridUtils';

interface PriorityGridProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tasks: Task[];
  projects: Project[];
}

interface PriorityGridTaskData {
  type: 'priority-grid-task';
  taskId: string;
  instanceId: symbol;
}

interface DragState {
  draggingTaskId: string | null;
  hoveringTaskId: string | null;
}

type SetDragState = (state: DragState | ((prev: DragState) => DragState)) => void;

export function PriorityGrid({ priority, tasks: initialTasks, projects }: PriorityGridProps) {
  const instanceId = useMemo(() => getInstanceId(), []);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dragState, setDragState] = useState<DragState>({
    draggingTaskId: null,
    hoveringTaskId: null,
  });

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceData = source.data as PriorityGridTaskData;
        const destData = destination.data as PriorityGridTaskData;

        if (sourceData.instanceId !== instanceId) return;
        if (destData.instanceId !== instanceId) return;
        if (sourceData.taskId === destData.taskId) return;

        const sourceIndex = tasks.findIndex((t) => t.id === sourceData.taskId);
        const destIndex = tasks.findIndex((t) => t.id === destData.taskId);

        if (sourceIndex === -1 || destIndex === -1) return;

        const newTasks = [...tasks];
        [newTasks[sourceIndex], newTasks[destIndex]] = [newTasks[destIndex], newTasks[sourceIndex]];
        setTasks(newTasks);
      },
    });
  }, [tasks, instanceId]);

  const priorityLabel = useMemo(() => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }, [priority]);

  const borderColor = useMemo(() => getPriorityBorderColor(priority), [priority]);

  if (tasks.length === 0) {
    return (
      <div
        className={`bg-white rounded-lg border-2 ${borderColor} p-6`}
        data-testid={`priority-grid-${priority}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900" data-testid={`priority-grid-header-${priority}`}>
            {priorityLabel} Priority
          </h2>
          <span
            className="text-sm text-gray-500 font-medium"
            data-testid={`priority-grid-count-${priority}`}
          >
            0 tasks
          </span>
        </div>
        <p className="text-gray-500 text-center py-8" data-testid={`priority-grid-empty-${priority}`}>
          No {priority} priority tasks
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border-2 ${borderColor} p-6`}
      data-testid={`priority-grid-${priority}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900" data-testid={`priority-grid-header-${priority}`}>
          {priorityLabel} Priority
        </h2>
        <span
          className="text-sm text-gray-500 font-medium"
          data-testid={`priority-grid-count-${priority}`}
        >
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tasks.map((task, index) => (
          <DraggableTaskWrapper
            key={task.id}
            task={task}
            index={index}
            projects={projects}
            instanceId={instanceId}
            isDragging={dragState.draggingTaskId === task.id}
            isHovering={dragState.hoveringTaskId === task.id}
            onDragStateChange={setDragState}
          />
        ))}
      </div>
    </div>
  );
}

interface DraggableTaskWrapperProps {
  task: Task;
  index: number;
  projects: Project[];
  instanceId: symbol;
  isDragging: boolean;
  isHovering: boolean;
  onDragStateChange: SetDragState;
}

function DraggableTaskWrapper({
  task,
  index,
  projects,
  instanceId,
  isDragging,
  isHovering,
  onDragStateChange,
}: DraggableTaskWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: (): PriorityGridTaskData => ({
          type: 'priority-grid-task',
          taskId: task.id,
          instanceId,
        }),
        onDragStart: () => {
          onDragStateChange({
            draggingTaskId: task.id,
            hoveringTaskId: null,
          });
        },
        onDrop: () => {
          onDragStateChange({
            draggingTaskId: null,
            hoveringTaskId: null,
          });
        },
      }),
      dropTargetForElements({
        element,
        getData: (): PriorityGridTaskData => ({
          type: 'priority-grid-task',
          taskId: task.id,
          instanceId,
        }),
        canDrop: ({ source }) => {
          const sourceData = source.data as PriorityGridTaskData;
          return (
            sourceData.type === 'priority-grid-task' &&
            sourceData.instanceId === instanceId &&
            sourceData.taskId !== task.id
          );
        },
        getIsSticky: () => true,
        onDragEnter: ({ source }) => {
          const sourceData = source.data as PriorityGridTaskData;
          if (sourceData.instanceId === instanceId) {
            onDragStateChange((prev) => ({
              ...prev,
              hoveringTaskId: task.id,
            }));
          }
        },
        onDragLeave: () => {
          onDragStateChange((prev) => ({
            ...prev,
            hoveringTaskId: null,
          }));
        },
        onDrop: () => {
          onDragStateChange((prev) => ({
            ...prev,
            hoveringTaskId: null,
          }));
        },
      })
    );
  }, [task.id, instanceId, onDragStateChange]);

  const getRotation = () => {
    const rotations = [2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8];
    const hash = task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return rotations[hash % rotations.length];
  };

  const getTransform = () => {
    if (isHovering) {
      return `scale(1.1) rotate(${getRotation()}deg)`;
    }
    return undefined;
  };

  const getFilter = () => {
    if (isDragging) {
      return 'grayscale(100%)';
    }
    if (isHovering) {
      return 'brightness(1.1)';
    }
    return undefined;
  };

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

  const project = projects.find(p => p.id === task.project_id);

  return (
    <div
      ref={wrapperRef}
      className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
      style={{
        transform: getTransform(),
        filter: getFilter(),
      }}
      data-testid={`priority-grid-task-wrapper-${task.id}`}
    >
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-2 mb-3">
          <div className="text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing mt-0.5">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
              <span
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full ml-2"
                data-testid={`priority-grid-task-position-${task.id}`}
              >
                #{index + 1}
              </span>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority === 'urgent' && <AlertCircle className="w-3 h-3" />}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
              {task.due_date && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.due_date)}
                </span>
              )}
              {project && (
                <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {project.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
