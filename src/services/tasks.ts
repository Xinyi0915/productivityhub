import { apiClient } from './api';

export interface ServerTask {
  _id: string;
  user: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  order: number;
  tags?: string[];
  completedAt?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceCount?: number;
  parentTask?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  username?: string;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  order?: number;
  tags?: string[];
}

export interface UpdateTaskParams {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  order?: number;
  tags?: string[];
}

export interface ReorderTasksParams {
  tasks: { id: string; order: number }[];
}

/**
 * Tasks service for handling task operations
 */
class TasksService {
  /**
   * Get all tasks
   */
  async getTasks(params?: {
    completed?: boolean;
    category?: string;
    dueDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    page?: number;
  }): Promise<{ status: string; data: ServerTask[]; totalPages?: number; currentPage?: number }> {
    // Build query string
    let queryString = '';
    if (params) {
      const queryParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      if (queryParams) {
        queryString = `?${queryParams}`;
      }
    }
    
    return apiClient.get<{ status: string; data: ServerTask[]; totalPages?: number; currentPage?: number }>(`/tasks${queryString}`);
  }

  /**
   * Get a specific task
   */
  async getTask(id: string): Promise<{ status: string; data: ServerTask }> {
    return apiClient.get<{ status: string; data: ServerTask }>(`/tasks/${id}`);
  }

  /**
   * Create a new task
   */
  async createTask(params: CreateTaskParams): Promise<{ status: string; data: ServerTask }> {
    return apiClient.post<{ status: string; data: ServerTask }>('/tasks', params);
  }

  /**
   * Update a task
   */
  async updateTask(id: string, params: UpdateTaskParams): Promise<{ status: string; data: ServerTask }> {
    return apiClient.patch<{ status: string; data: ServerTask }>(`/tasks/${id}`, params);
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<{ status: string; message: string }> {
    return apiClient.delete<{ status: string; message: string }>(`/tasks/${id}`);
  }

  /**
   * Reorder tasks
   */
  async reorderTasks(params: ReorderTasksParams): Promise<{ status: string; message: string }> {
    return apiClient.patch<{ status: string; message: string }>('/tasks/reorder', params);
  }
}

// Create and export a singleton instance
export const tasksService = new TasksService(); 