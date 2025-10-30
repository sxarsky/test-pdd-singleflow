import { Tag } from 'lucide-react';

export function TagsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
      </div>

      <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tags management coming soon</h3>
        <p className="text-gray-500">Create and manage tags to organize your tasks</p>
      </div>
    </div>
  );
}
