import { Project, Task } from '../lib/database.types';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

export type DragType = 'project' | 'task';

export interface DragData {
  type: DragType;
  id: string;
  index: number;
}

export interface ProjectDragData extends DragData {
  type: 'project';
  project: Project;
}

export interface TaskDragData extends DragData {
  type: 'task';
  task: Task;
  status: Task['status'];
  projectId: string;
}

export function calculateNewOrder<T extends { display_order: number }>(
  items: T[],
  sourceIndex: number,
  destinationIndex: number
): T[] {
  const result = Array.from(items);
  const [removed] = result.splice(sourceIndex, 1);

  const adjustedDestinationIndex = sourceIndex < destinationIndex
    ? destinationIndex - 1
    : destinationIndex;

  result.splice(adjustedDestinationIndex, 0, removed);

  return result.map((item, index) => ({
    ...item,
    display_order: index,
  }));
}

export function reorderItemsAcrossColumns<T extends { display_order: number }>(
  sourceItems: T[],
  destinationItems: T[],
  sourceIndex: number,
  destinationIndex: number,
  movedItem: T
): { updatedSource: T[]; updatedDestination: T[] } {
  const updatedSource = sourceItems
    .filter((_, index) => index !== sourceIndex)
    .map((item, index) => ({
      ...item,
      display_order: index,
    }));

  const updatedDestination = Array.from(destinationItems);
  updatedDestination.splice(destinationIndex, 0, movedItem);

  return {
    updatedSource,
    updatedDestination: updatedDestination.map((item, index) => ({
      ...item,
      display_order: index,
    })),
  };
}

export function getItemIndex<T extends { id: string }>(
  items: T[],
  itemId: string
): number {
  return items.findIndex((item) => item.id === itemId);
}

export function getReorderDestinationIndex(
  startIndex: number,
  indexOfTarget: number,
  closestEdgeOfTarget: Edge | null
): number {
  if (closestEdgeOfTarget === 'bottom') {
    return indexOfTarget + 1;
  }

  return indexOfTarget;
}

export function shouldReorder(
  sourceIndex: number,
  destinationIndex: number
): boolean {
  return sourceIndex !== destinationIndex;
}
