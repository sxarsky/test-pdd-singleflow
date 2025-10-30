// In development, use the full URL for CORS. In production, use relative URL
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000/api'
  : '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error' };
  }
}

// Auth API
export const authApi = {
  signUp: (email: string, password: string, username: string) =>
    fetchApi<{ user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),

  signIn: (email: string, password: string) =>
    fetchApi<{ user: any }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signOut: () =>
    fetchApi('/auth/signout', {
      method: 'POST',
    }),

  getUser: () => fetchApi<{ user: any }>('/auth/user'),
};

// Projects API
export const projectsApi = {
  getAll: () => fetchApi<any[]>('/projects'),

  getById: (id: string) => fetchApi<any>(`/projects/${id}`),

  create: (project: {
    name: string;
    description?: string;
    status?: string;
  }) =>
    fetchApi<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),

  update: (id: string, updates: any) =>
    fetchApi<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id: string) =>
    fetchApi(`/projects/${id}`, {
      method: 'DELETE',
    }),

  reorder: (projects: Array<{ id: string; display_order: number }>) =>
    fetchApi('/projects/bulk/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ projects }),
    }),
};

// Tasks API
export const tasksApi = {
  getAll: (projectId?: string) => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return fetchApi<any[]>(`/tasks${query}`);
  },

  getById: (id: string) => fetchApi<any>(`/tasks/${id}`),

  create: (task: {
    project_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    due_date?: string;
    tag_ids?: string[];
  }) =>
    fetchApi<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  update: (id: string, updates: any) =>
    fetchApi<any>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id: string) =>
    fetchApi(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  reorder: (
    tasks: Array<{ id: string; display_order: number; status: string }>
  ) =>
    fetchApi('/tasks/bulk/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ tasks }),
    }),
};

// Tags API
export const tagsApi = {
  getAll: () => fetchApi<any[]>('/tags'),

  create: (tag: { name: string; color: string }) =>
    fetchApi<any>('/tags', {
      method: 'POST',
      body: JSON.stringify(tag),
    }),

  update: (id: string, updates: { name?: string; color?: string }) =>
    fetchApi<any>(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (id: string) =>
    fetchApi(`/tags/${id}`, {
      method: 'DELETE',
    }),
};

// Admin API
export const adminApi = {
  reset: () =>
    fetchApi<{ success: boolean; message: string; stats: { projects: number; tasks: number } }>('/admin/reset', {
      method: 'POST',
    }),
};
