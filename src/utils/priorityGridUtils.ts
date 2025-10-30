export function getInstanceId(): symbol {
  return Symbol('priority-grid-instance');
}

export function getPriorityBorderColor(priority: string): string {
  switch (priority) {
    case 'low':
      return 'border-green-500';
    case 'medium':
      return 'border-yellow-500';
    case 'high':
      return 'border-orange-500';
    case 'urgent':
      return 'border-red-500';
    default:
      return 'border-gray-300';
  }
}
