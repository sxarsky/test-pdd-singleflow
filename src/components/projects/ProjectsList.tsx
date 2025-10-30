import { useEffect, useState } from 'react';
import { Folder, Plus, Search } from 'lucide-react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { projectsApi, tasksApi } from '../../lib/api';
import { Project, Task } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { CreateProjectModal } from './CreateProjectModal';
import { ViewProjectModal } from './ViewProjectModal';
import { ProjectCard } from './ProjectCard';
import { ProjectDragData, TaskDragData, calculateNewOrder, getItemIndex } from '../../utils/dragAndDrop';

export function ProjectsList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await projectsApi.getAll();

      if (response.error) {
        console.error('Error fetching projects:', response.error);
        setLoading(false);
        return;
      }

      let allProjects = response.data || [];

      // Client-side filtering for status
      if (statusFilter !== 'all') {
        allProjects = allProjects.filter((p: Project) => p.status === statusFilter);
      }

      // Client-side search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allProjects = allProjects.filter((p: Project) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
      }

      setProjects(allProjects);

      // Fetch tasks for all projects
      if (allProjects.length > 0) {
        const tasksResponse = await tasksApi.getAll();

        if (tasksResponse.error) {
          console.error('Error fetching tasks:', tasksResponse.error);
        } else {
          const tasksData = tasksResponse.data || [];
          const taskMap: Record<string, Task[]> = {};

          allProjects.forEach((p: Project) => {
            taskMap[p.id] = [];
          });

          tasksData.forEach((task: Task) => {
            if (taskMap[task.project_id]) {
              taskMap[task.project_id].push(task);
            }
          });

          setTasksByProject(taskMap);
        }
      } else {
        setTasksByProject({});
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user, statusFilter, searchQuery]);

  useEffect(() => {
    return monitorForElements({
      onDrop: async ({ source, location }) => {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceData = source.data as ProjectDragData | TaskDragData;

        if (sourceData.type === 'project') {
          const destinationData = destination.data as ProjectDragData;
          if (destinationData.type !== 'project') return;

          const sourceIndex = getItemIndex(projects, sourceData.id);
          const destinationIndex = getItemIndex(projects, destinationData.id);

          if (sourceIndex === -1 || destinationIndex === -1) return;

          const reorderedProjects = calculateNewOrder(projects, sourceIndex, destinationIndex);
          setProjects(reorderedProjects);

          // Bulk update display orders
          await projectsApi.reorder(
            reorderedProjects.map(p => ({ id: p.id, display_order: p.display_order }))
          );
        } else if (sourceData.type === 'task') {
          const destinationData = destination.data as any;

          if (destinationData.type === 'project-task-zone') {
            const targetProjectId = destinationData.projectId;
            const taskData = sourceData as TaskDragData;
            const sourceProjectId = taskData.projectId;

            if (sourceProjectId === targetProjectId) return;

            try {
              const response = await tasksApi.update(taskData.id, {
                project_id: targetProjectId,
                display_order: (tasksByProject[targetProjectId]?.length || 0)
              });

              if (response.error) throw new Error(response.error);

              const updatedTasksByProject = { ...tasksByProject };
              updatedTasksByProject[sourceProjectId] = updatedTasksByProject[sourceProjectId].filter(
                t => t.id !== taskData.id
              );

              const updatedTask = { ...taskData.task, project_id: targetProjectId };
              updatedTasksByProject[targetProjectId] = [
                ...(updatedTasksByProject[targetProjectId] || []),
                updatedTask
              ];

              setTasksByProject(updatedTasksByProject);
            } catch (error) {
              console.error('Error moving task:', error);
              alert('Failed to move task. Please try again.');
              fetchProjects();
            }
          }
        }
      },
    });
  }, [projects, tasksByProject]);

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    fetchProjects();
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const handleEditFromView = () => {
    setShowViewModal(false);
  };

  const handleViewTaskFromProject = (task: Task) => {
    setShowViewModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="projects-list">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Folder className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900" data-testid="projects-page-title">Projects</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          data-testid="projects-page-create-button"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="projects-page-search-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          data-testid="projects-page-status-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300" data-testid="projects-page-empty-state">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first project</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            data-testid="projects-page-empty-create-button"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-page-grid">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              tasks={tasksByProject[project.id] || []}
              projects={projects}
              onView={() => handleViewProject(project)}
              onUpdate={fetchProjects}
              onDelete={fetchProjects}
              onTaskUpdate={fetchProjects}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProjectCreated}
        />
      )}

      {showViewModal && selectedProject && (
        <ViewProjectModal
          project={selectedProject}
          tasks={tasksByProject[selectedProject.id] || []}
          onClose={() => {
            setShowViewModal(false);
            setSelectedProject(null);
          }}
          onEdit={handleEditFromView}
          onTaskClick={handleViewTaskFromProject}
        />
      )}
    </div>
  );
}
