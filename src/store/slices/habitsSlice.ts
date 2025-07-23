import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from '..';
import { updateCoins, registerFetchHabits } from './authSlice';
import { sendHabitStreakNotification, sendCoinEarnedNotification } from '../../utils/notifications';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { habitsService, ServerHabit } from '../../services/habits';

export interface HabitCompletion {
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
  completedAt?: string; // ISO datetime string
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string; // New field for the habit icon
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD), optional for ongoing habits
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule: number[]; // Array of days (1-7 for weekly habits, empty for daily)
  completions: HabitCompletion[];
  currentStreak: number;
  bestStreak: number;
}

interface HabitsState {
  habits: Habit[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

// Format today's date
const today = new Date();
const formatTodayDate = () => {
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert server habit to frontend habit format
const mapServerHabitToHabit = (serverHabit: ServerHabit): Habit => {
  return {
    id: serverHabit._id,
    title: serverHabit.name,
    description: serverHabit.description || '',
    color: serverHabit.color || '#3B82F6', // Default blue color
    icon: serverHabit.icon || '✓',
    startDate: serverHabit.startDate,
    endDate: serverHabit.endDate, // Map end date from server
    frequency: serverHabit.frequency, // Use the frequency from the server
    schedule: serverHabit.customDays || [], // Use customDays from the server
    completions: serverHabit.checkIns.map(checkIn => ({
      date: checkIn.date,
      completed: checkIn.completed,
      completedAt: checkIn.date // Use date as completedAt
    })),
    currentStreak: serverHabit.streak,
    bestStreak: serverHabit.longestStreak
  };
};

// Default habits for demonstration - will be replaced with data from the server
const defaultHabits: Habit[] = [];

// Create initial state with default habits, will update streaks later
const initialStateWithoutStreaks: HabitsState = {
  habits: defaultHabits,
  loading: false,
  refreshing: false,
  error: null,
};

// Remove custom streak calculation functions and use backend-provided values
const initialState: HabitsState = {
  habits: initialStateWithoutStreaks.habits.map(habit => {
    // Use the streak values provided by the backend
    return {
      ...habit,
      currentStreak: habit.currentStreak || 0,
      bestStreak: habit.bestStreak || 0,
    };
  }),
  loading: initialStateWithoutStreaks.loading,
  refreshing: initialStateWithoutStreaks.refreshing,
  error: initialStateWithoutStreaks.error,
};

// Helper function to get the start of the week for a given date
const getWeekStart = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay()); // Start from Sunday
  return result;
};

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Check if a habit can be completed on a specific date
const canCompleteHabit = (habit: Habit, date: string): boolean => {
  const habitDate = new Date(date);
  const startDate = new Date(habit.startDate);
  const endDate = habit.endDate ? new Date(habit.endDate) : null;

  // Check if date is within the habit's active range
  if (habitDate < startDate) return false;
  if (endDate && habitDate > endDate) return false;

  // Daily habits can be completed any day
  return true;
};

// Async thunks for API calls
export const fetchHabits = createAsyncThunk(
  'habits/fetchHabits',
  async (_, { rejectWithValue }) => {
    try {
      const response = await habitsService.getHabits();
      return response.data.map(mapServerHabitToHabit);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Add a refresh habits action
export const refreshHabits = createAsyncThunk(
  'habits/refreshHabits',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Show loading state
      dispatch(habitsSlice.actions.setRefreshing(true));
      
      // Fetch all habits from server
      const response = await habitsService.getHabits();
      const habits = response.data.map(mapServerHabitToHabit);
      
      // Update streaks for each habit
      const habitsWithStreaks = habits.map(habit => {
        if (habit.completions.length > 0) {
          // Create a copy of the habit to avoid modifying the original
          const habitCopy = { ...habit };
          // Calculate streak
          calculateAndUpdateHabitStreak(habitCopy);
          return habitCopy;
        }
        return habit;
      });
      
      // Hide loading state
      dispatch(habitsSlice.actions.setRefreshing(false));
      
      return habitsWithStreaks;
    } catch (error) {
      // Hide loading state even on error
      dispatch(habitsSlice.actions.setRefreshing(false));
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchHabit = createAsyncThunk(
  'habits/fetchHabit',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await habitsService.getHabit(id);
      return mapServerHabitToHabit(response.data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createHabit = createAsyncThunk(
  'habits/createHabit',
  async (habitData: Omit<Habit, 'id' | 'completions' | 'currentStreak' | 'bestStreak'>, { rejectWithValue }) => {
    try {
      const response = await habitsService.createHabit({
        name: habitData.title,
        description: habitData.description,
        color: habitData.color,
        icon: habitData.icon,
        startDate: habitData.startDate,
        endDate: habitData.endDate || undefined, // Explicitly handle empty string
        frequency: habitData.frequency,
        customDays: habitData.schedule
      });
      
      return mapServerHabitToHabit(response.data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateHabitAsync = createAsyncThunk(
  'habits/updateHabitAsync',
  async (habitData: Partial<Habit> & { id: string }, { rejectWithValue }) => {
    try {
      const updateData: any = {};
      
      if (habitData.title) updateData.name = habitData.title;
      if (habitData.description !== undefined) updateData.description = habitData.description;
      if (habitData.color) updateData.color = habitData.color;
      if (habitData.icon) updateData.icon = habitData.icon;
      if (habitData.startDate) updateData.startDate = habitData.startDate;
      // Always include endDate in update, even if it's undefined
      updateData.endDate = habitData.endDate || undefined;
      if (habitData.frequency) updateData.frequency = habitData.frequency;
      if (habitData.schedule) updateData.customDays = habitData.schedule;
      
      const response = await habitsService.updateHabit(habitData.id, updateData);
      return mapServerHabitToHabit(response.data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteHabitAsync = createAsyncThunk(
  'habits/deleteHabitAsync',
  async (id: string, { rejectWithValue }) => {
    try {
      await habitsService.deleteHabit(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const toggleHabitCheckIn = createAsyncThunk(
  'habits/toggleHabitCheckIn',
  async ({ habitId, date }: { habitId: string; date: string }, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as RootState;
      const habit = state.habits.habits.find(h => h.id === habitId);
      
      if (!habit) {
        throw new Error('Habit not found');
      }
      
      // Check if the completion already exists
      const existingCompletion = habit.completions.find(c => c.date.split('T')[0] === date);
      
      if (existingCompletion && existingCompletion.completed) {
        // If already completed, we need to remove the check-in
        // Find the check-in ID from the server habit
        const response = await habitsService.getHabit(habitId);
        const serverHabit = response.data;
        const checkIn = serverHabit.checkIns.find(c => c.date.split('T')[0] === date);
        
        if (checkIn) {
          await habitsService.removeCheckIn(habitId, checkIn._id);
        }
      } else {
        // Add new check-in
        await habitsService.addCheckIn(habitId, { date });
      }
      
      // Fetch the updated habit to get the new state
      const updatedResponse = await habitsService.getHabit(habitId);
      const updatedHabit = mapServerHabitToHabit(updatedResponse.data);
      
      // Instead of calculating streak here, we'll use the updateHabitStreak action
      // which will use the more comprehensive calculation logic
      
      return updatedHabit;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Thunk to toggle habit completion and update coins
export const toggleHabitCompletionAndUpdateCoins = createAsyncThunk<void, { habitId: string; date: string }>(
  'habits/toggleHabitCompletionAndUpdateCoins',
  async ({ habitId, date }, { dispatch, getState }) => {
    const state = getState() as RootState;
    const habit = state.habits.habits.find((h) => h.id === habitId);
    const user = state.auth.user;

    if (habit && user) {
      // Check if the habit was previously completed
      const wasCompleted = habit.completions.some(
        c => c.date.split('T')[0] === date.split('T')[0] && c.completed
      );
      
      try {
        // Use the API to toggle check-in
        await dispatch(toggleHabitCheckIn({ habitId, date })).unwrap();
        
        // Fetch the updated habit to ensure we have the latest state
        const response = await habitsService.getHabit(habitId);
        const updatedHabit = mapServerHabitToHabit(response.data);
        
        // Update the habit in the store with the latest data
        dispatch(updateHabit(updatedHabit));
        
        // Get the completion status after the update
        const completion = updatedHabit.completions.find((c) => c.date.split('T')[0] === date);
        const isNowCompleted = completion?.completed || false;
        
        // Handle coin updates based on the change
        if (isNowCompleted && !wasCompleted) {
          // Add coins for completing
          const coinsToAdd = 5;
          dispatch(updateCoins(user.coins + coinsToAdd));
          sendCoinEarnedNotification(coinsToAdd, 'completing a habit');
          
          // Check for streak milestone
          if (updatedHabit.currentStreak > 0 && updatedHabit.currentStreak % 7 === 0) {
            const streakBonus = 15;
            dispatch(updateCoins(user.coins + coinsToAdd + streakBonus));
            sendCoinEarnedNotification(streakBonus, `${updatedHabit.currentStreak}-day streak`);
          }
        } else if (!isNowCompleted && wasCompleted) {
          // Deduct coins for uncompleting
          const coinsToDeduct = 5;
          const newCoins = Math.max(0, user.coins - coinsToDeduct);
          dispatch(updateCoins(newCoins));
          
          if (user.coins > 0) {
            sendCoinEarnedNotification(-coinsToDeduct, 'unmarking a habit');
          }
        }
        
        // Force a refresh of all habits to ensure consistency
        await dispatch(refreshHabits()).unwrap();
        
        // Dispatch a PERSIST action to ensure state is saved
        dispatch({ type: 'persist/PERSIST' });
      } catch (error) {
        console.error('Error updating habit completion:', error);
        throw error;
      }
    }
  }
);

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    updateHabit: (state, action: PayloadAction<Partial<Habit> & { id: string }>) => {
      const index = state.habits.findIndex((h) => h.id === action.payload.id);
      if (index !== -1) {
        state.habits[index] = {
          ...state.habits[index],
          ...action.payload,
        };
      }
    },
    deleteHabit: (state, action: PayloadAction<string>) => {
      state.habits = state.habits.filter((h) => h.id !== action.payload);
    },
    toggleHabitCompletion: (state, action: PayloadAction<{ habitId: string; date: string }>) => {
      const { habitId, date } = action.payload;
      const habit = state.habits.find((h) => h.id === habitId);
      
      if (habit) {
        // Normalize the date format (remove any time part)
        const normalizedDate = date.split('T')[0];
        
        // Find completion by normalized date
        const completionIndex = habit.completions.findIndex((c) => c.date.split('T')[0] === normalizedDate);
        
        if (completionIndex !== -1) {
          // Toggle existing completion
          const wasCompleted = habit.completions[completionIndex].completed;
          habit.completions[completionIndex].completed = !wasCompleted;
          
          // Update completedAt timestamp
          if (!wasCompleted) {
            habit.completions[completionIndex].completedAt = new Date().toISOString();
          } else {
            delete habit.completions[completionIndex].completedAt;
          }
        } else {
          // Add new completion record
          habit.completions.push({
            date: normalizedDate, 
            completed: true,
            completedAt: new Date().toISOString()
          });
        }
        
        // Update streak after toggling completion
        calculateAndUpdateHabitStreak(habit);
      }
    },
    updateHabitStreak: (state, action: PayloadAction<string>) => {
      const habitId = action.payload;
      const habit = state.habits.find((h) => h.id === habitId);
      
      if (habit) {
        // Call the helper function to update the streak
        calculateAndUpdateHabitStreak(habit);
      }
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch all habits
    builder
      .addCase(fetchHabits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHabits.fulfilled, (state, action) => {
        state.loading = false;
        state.habits = action.payload;
      })
      .addCase(fetchHabits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      
    // Fetch single habit
    builder
      .addCase(fetchHabit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHabit.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.habits.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.habits[index] = action.payload;
        } else {
          state.habits.push(action.payload);
        }
      })
      .addCase(fetchHabit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      
    // Create habit
    builder
      .addCase(createHabit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHabit.fulfilled, (state, action) => {
        state.loading = false;
        state.habits.push(action.payload);
      })
      .addCase(createHabit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      
    // Update habit
    builder
      .addCase(updateHabitAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHabitAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.habits.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.habits[index] = action.payload;
        }
      })
      .addCase(updateHabitAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      
    // Delete habit
    builder
      .addCase(deleteHabitAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHabitAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.habits = state.habits.filter(h => h.id !== action.payload);
      })
      .addCase(deleteHabitAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      
    // Toggle habit check-in
    builder
      .addCase(toggleHabitCheckIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleHabitCheckIn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.habits.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.habits[index] = action.payload;
        }
      })
      .addCase(toggleHabitCheckIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Refresh habits
    builder
      .addCase(refreshHabits.fulfilled, (state, action) => {
        state.habits = action.payload;
        state.error = null;
      })
      .addCase(refreshHabits.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// Helper function to update habit streak
function calculateAndUpdateHabitStreak(habit: Habit) {
  if (habit.completions.length === 0) {
    habit.currentStreak = 0;
    return;
  }
  
    // DAILY HABIT STREAK CALCULATION
    const sortedCompletions = [...habit.completions]
      .filter(c => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedCompletions.length === 0) {
      habit.currentStreak = 0;
      return;
    }
    
    // Get the most recent completion date
    const mostRecentDate = new Date(sortedCompletions[0].date);
    mostRecentDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate days between most recent completion and today
    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If the most recent completion is more than 1 day ago, streak is broken
    if (daysDiff > 1) {
      habit.currentStreak = 0;
      return;
    }
    
    // Count consecutive days backwards from most recent completion
    let streak = 1;
    let prevDate = mostRecentDate;
    
    for (let i = 1; i < sortedCompletions.length; i++) {
      const currentDate = new Date(sortedCompletions[i].date);
      currentDate.setHours(0, 0, 0, 0);
      
      // Calculate days between consecutive completions
      const diffDays = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If dates are consecutive, increment streak
      if (diffDays === 1) {
        streak++;
        prevDate = currentDate;
      } else {
        break;
      }
    }
    
    habit.currentStreak = streak;
  
  // Update best streak
  habit.bestStreak = Math.max(habit.bestStreak || 0, habit.currentStreak);
}

export const {
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  updateHabitStreak,
  setRefreshing,
} = habitsSlice.actions;

// Register the fetchHabits function in the auth slice
registerFetchHabits(fetchHabits);

export default habitsSlice.reducer; 