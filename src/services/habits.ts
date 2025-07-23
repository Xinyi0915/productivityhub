import { apiClient } from './api';

export interface ServerHabit {
  _id: string;
  user: string;
  name: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDays?: number[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  color?: string;
  icon?: string;
  streak: number;
  longestStreak: number;
  startDate: string;
  endDate?: string;
  active: boolean;
  checkIns: {
    _id: string;
    date: string;
    completed: boolean;
    notes?: string;
  }[];
  reminderEnabled?: boolean;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitParams {
  name: string;
  description?: string;
  category?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDays?: number[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  color?: string;
  icon?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  reminderEnabled?: boolean;
  reminderTime?: string;
}

export interface UpdateHabitParams {
  name?: string;
  description?: string;
  category?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDays?: number[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  color?: string;
  icon?: string;
  active?: boolean;
  endDate?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
}

export interface CheckInParams {
  date: string;
  notes?: string;
}

/**
 * Habits service for handling habit operations
 */
class HabitsService {
  /**
   * Get all habits
   */
  async getHabits(params?: {
    active?: boolean;
    category?: string;
    frequency?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ status: string; data: ServerHabit[] }> {
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
    
    return apiClient.get<{ status: string; data: ServerHabit[] }>(`/habits${queryString}`);
  }

  /**
   * Get a specific habit
   */
  async getHabit(id: string): Promise<{ status: string; data: ServerHabit }> {
    return apiClient.get<{ status: string; data: ServerHabit }>(`/habits/${id}`);
  }

  /**
   * Create a new habit
   */
  async createHabit(params: CreateHabitParams): Promise<{ status: string; data: ServerHabit }> {
    return apiClient.post<{ status: string; data: ServerHabit }>('/habits', params);
  }

  /**
   * Update a habit
   */
  async updateHabit(id: string, params: UpdateHabitParams): Promise<{ status: string; data: ServerHabit }> {
    return apiClient.patch<{ status: string; data: ServerHabit }>(`/habits/${id}`, params);
  }

  /**
   * Delete a habit
   */
  async deleteHabit(id: string): Promise<{ status: string; message: string }> {
    return apiClient.delete<{ status: string; message: string }>(`/habits/${id}`);
  }

  /**
   * Add a check-in for a habit
   */
  async addCheckIn(id: string, params: CheckInParams): Promise<{ status: string; data: ServerHabit }> {
    return apiClient.post<{ status: string; data: ServerHabit }>(`/habits/${id}/checkin`, params);
  }

  /**
   * Remove a check-in for a habit
   */
  async removeCheckIn(habitId: string, checkInId: string): Promise<{ status: string; data: ServerHabit }> {
    return apiClient.delete<{ status: string; data: ServerHabit }>(`/habits/${habitId}/checkin/${checkInId}`);
  }
}

// Create and export a singleton instance
export const habitsService = new HabitsService(); 