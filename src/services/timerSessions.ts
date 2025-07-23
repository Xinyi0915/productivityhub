import { apiClient } from './api';
import { TimerSession } from '../store/slices/timerSlice';

export interface TimerSessionResponse {
  _id: string;
  user: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'focus' | 'shortBreak' | 'longBreak';
  completed: boolean;
  interrupted: boolean;
  task?: string;
  label?: string;
  notes?: string;
  coinsEarned: number;
  pomodoroNumber?: number;
  pomodoroSet?: string;
  createdAt: string;
  updatedAt: string;
}

// Convert backend timer session to frontend timer session
export const convertToTimerSession = (session: TimerSessionResponse): TimerSession => {
  return {
    id: session._id,
    duration: session.duration,
    startTime: session.startTime,
    endTime: session.endTime,
    coinsEarned: session.coinsEarned
  };
};

// Convert frontend timer session to backend format
export const convertToTimerSessionRequest = (session: TimerSession) => {
  return {
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    coinsEarned: session.coinsEarned,
    type: 'focus', // Default type
    completed: true // Default completed status
  };
};

// Get all timer sessions
export const fetchTimerSessions = async (params?: {
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}) => {
  try {
    const response = await apiClient.get('/timer-sessions', { params });
    return {
      sessions: response.data.map(convertToTimerSession),
      pagination: {
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        totalResults: response.results
      }
    };
  } catch (error) {
    console.error('Error fetching timer sessions:', error);
    throw error;
  }
};

// Get a single timer session
export const fetchTimerSession = async (id: string) => {
  try {
    const response = await apiClient.get(`/timer-sessions/${id}`);
    return convertToTimerSession(response.data);
  } catch (error) {
    console.error(`Error fetching timer session ${id}:`, error);
    throw error;
  }
};

// Create a new timer session
export const createTimerSession = async (session: TimerSession) => {
  try {
    const timerSessionData = convertToTimerSessionRequest(session);
    const response = await apiClient.post('/timer-sessions', timerSessionData);
    return convertToTimerSession(response.data);
  } catch (error) {
    console.error('Error creating timer session:', error);
    throw error;
  }
};

// Update a timer session
export const updateTimerSession = async (id: string, updates: Partial<TimerSession>) => {
  try {
    const response = await apiClient.patch(`/timer-sessions/${id}`, updates);
    return convertToTimerSession(response.data);
  } catch (error) {
    console.error(`Error updating timer session ${id}:`, error);
    throw error;
  }
};

// Delete a timer session
export const deleteTimerSession = async (id: string) => {
  try {
    await apiClient.delete(`/timer-sessions/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting timer session ${id}:`, error);
    throw error;
  }
};

// Get timer statistics
export const fetchTimerStats = async (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  try {
    const response = await apiClient.get('/timer-sessions/stats', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching timer stats:', error);
    throw error;
  }
}; 