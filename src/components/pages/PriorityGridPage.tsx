import { useEffect, useState, useMemo } from 'react';
import { Grid3x3 } from 'lucide-react';
import { tasksApi, projectsApi } from '../../lib/api';
import { Task, Project } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { PriorityGrid } from '../priority/PriorityGrid';

export function PriorityGridPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [tasksResponse, projectsResponse] = await Promise.all([
        tasksApi.getAll(),
        projectsApi.getAll(),
      ]);

      if (tasksResponse.error) {
        console.error('Error fetching tasks:', tasksResponse.error);
      }
      if (projectsResponse.error) {
        console.error('Error fetching projects:', projectsResponse.error);
      }

      setTasks(tasksResponse.data || []);
      setProjects(projectsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedTasksByPriority = useMemo(() => {
    const sortTasks = (priorityTasks: Task[]) => {
      return [...priorityTasks].sort((a, b) => {
        if (a.display_order !== null && b.display_order !== null) {
          return a.display_order - b.display_order;
        }
        if (a.display_order !== null) return -1;
        if (b.display_order !== null) return 1;
        return a.id.localeCompare(b.id);
      });
    };

    return {
      low: sortTasks(tasks.filter((task) => task.priority === 'low')),
      medium: sortTasks(tasks.filter((task) => task.priority === 'medium')),
      high: sortTasks(tasks.filter((task) => task.priority === 'high')),
      urgent: sortTasks(tasks.filter((task) => task.priority === 'urgent')),
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="priority-grid-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Grid3x3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900" data-testid="priority-grid-page-header">
            Priority Grid
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        <PriorityGrid priority="urgent" tasks={sortedTasksByPriority.urgent} projects={projects} />
        <PriorityGrid priority="high" tasks={sortedTasksByPriority.high} projects={projects} />
        <PriorityGrid priority="medium" tasks={sortedTasksByPriority.medium} projects={projects} />
        <PriorityGrid priority="low" tasks={sortedTasksByPriority.low} projects={projects} />
      </div>
    </div>
  );
}
