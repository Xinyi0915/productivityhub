import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { updateCoins, registerFetchTasks } from './authSlice';
import { AppDispatch, RootState } from '..';
import { sendTaskCompletionNotification, sendCoinEarnedNotification } from '../../utils/notifications';
import { tasksService, ServerTask } from '../../services/tasks';

export interface Task {
  id: string;
  title: string;
  description?: string;
  icon?: string; // Optional icon emoji for the task
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt?: string;
  groupId?: string;
  createdAt: string;
  userId?: string; // ID of the user who created the task
  username?: string; // Username of the user who created the task
}

export interface TaskGroup {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface TasksState {
  tasks: Task[];
  groups: TaskGroup[];
  selectedGroupId: string | null;
  isLoading: boolean;
  error: string | null;
}

const defaultGroups: TaskGroup[] = [
  {
    id: 'default',
    name: 'Tasks',
    color: '#4F46E5', // indigo
    createdAt: new Date().toISOString(),
  }
];

// Initial state with empty arrays
const initialState: TasksState = {
  tasks: [],
  groups: defaultGroups, // Keep default groups for now
  selectedGroupId: null,
  isLoading: false,
  error: null,
};

// Convert server task to frontend task format
const mapServerTaskToTask = (serverTask: ServerTask): Task => {
  return {
    id: serverTask._id,
    title: serverTask.title,
    description: serverTask.description,
    icon: '📝', // Default icon
    deadline: serverTask.dueDate,
    priority: serverTask.priority,
    completed: serverTask.completed,
    completedAt: serverTask.completedAt,
    groupId: serverTask.category || 'default', // Default to the default group if no category is specified
    createdAt: serverTask.createdAt,
    userId: serverTask.userId,
    username: serverTask.username,
  };
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tasksService.getTasks();
      return response.data.map(mapServerTaskToTask);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchTask = createAsyncThunk(
  'tasks/fetchTask',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await tasksService.getTask(id);
      return mapServerTaskToTask(response.data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await tasksService.createTask({
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.deadline,
        priority: taskData.priority,
        category: taskData.groupId,
      });
      return mapServerTaskToTask(response.data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTaskAsync = createAsyncThunk(
  'tasks/updateTaskAsync',
  async (taskData: Partial<Task> & { id: string }, { rejectWithValue }) => {
    try {
      const response = await tasksService.updateTask(taskData.id, {
        title: taskData.title,
        description: taskData.description,
        completed: taskData.completed,
        dueDate: taskData.deadline,
        priority: taskData.priority as any,
        category: taskData.groupId,
      });
      return mapServerTaskToTask(response.data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTaskAsync',
  async (id: string, { rejectWithValue }) => {
    try {
      await tasksService.deleteTask(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const toggleTaskAsync = createAsyncThunk(
  'tasks/toggleTaskAsync',
  async (id: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const task = state.tasks.tasks.find(t => t.id === id);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      const newCompletedState = !task.completed;
      
      const response = await tasksService.updateTask(id, {
        completed: newCompletedState
      });
      
      // If task was completed, reward coins
      if (newCompletedState) {
        // Reward coins based on priority
        let coinsToAdd = 0;
        switch (task.priority) {
          case 'low':
            coinsToAdd = 1;
            break;
          case 'medium':
            coinsToAdd = 2;
            break;
          case 'high':
            coinsToAdd = 3;
            break;
        }
        
        if (coinsToAdd > 0) {
          // Get current coins
          const currentCoins = state.auth.user?.coins || 0;
          
          // Update coins
          dispatch(updateCoins(currentCoins + coinsToAdd));
          
          // Show notification
          sendCoinEarnedNotification(coinsToAdd, 'completing a task');
        }
        
        // Show task completion notification
        sendTaskCompletionNotification(task.title);
      }
      
      return mapServerTaskToTask(response.data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<Omit<Task, 'id' | 'completed' | 'createdAt'> & { groupId?: string }>) => {
      state.tasks.push({
        ...action.payload,
        id: crypto.randomUUID(),
        completed: false,
        createdAt: new Date().toISOString(),
      });
    },
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },
    toggleTask: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;
        if (task.completed) {
          task.completedAt = new Date().toISOString();
        } else {
          delete task.completedAt;
        }
      }
    },
    addTaskGroup: (state, action: PayloadAction<Omit<TaskGroup, 'id' | 'createdAt'>>) => {
      state.groups.push({
        ...action.payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
    },
    updateTaskGroup: (state, action: PayloadAction<Partial<TaskGroup> & { id: string }>) => {
      const index = state.groups.findIndex(group => group.id === action.payload.id);
      if (index !== -1) {
        state.groups[index] = { ...state.groups[index], ...action.payload };
      }
    },
    deleteTaskGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter(group => group.id !== action.payload);
      // Remove group from tasks
      state.tasks = state.tasks.map(task => {
        if (task.groupId === action.payload) {
          return { ...task, groupId: undefined };
        }
        return task;
      });
    },
    setSelectedGroup: (state, action: PayloadAction<string | null>) => {
      state.selectedGroupId = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch all tasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
      
    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
      
    // Update task
    builder
      .addCase(updateTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
      
    // Delete task
    builder
      .addCase(deleteTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      })
      .addCase(deleteTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
      
    // Toggle task
    builder
      .addCase(toggleTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(toggleTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addTask,
  updateTask,
  deleteTask,
  toggleTask,
  addTaskGroup,
  updateTaskGroup,
  deleteTaskGroup,
  setSelectedGroup,
} = tasksSlice.actions;

// Thunk for toggling tasks with coin rewards
export const toggleTaskAndUpdateCoins = (taskId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    // Use the async thunk for toggling tasks
    await dispatch(toggleTaskAsync(taskId)).unwrap();
  } catch (error) {
    console.error('Error toggling task:', error);
  }
};

// Register the fetchTasks function in the auth slice
registerFetchTasks(fetchTasks);

export default tasksSlice.reducer; 