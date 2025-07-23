import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, User, LoginParams, RegisterParams, UpdateProfileParams, UpdatePasswordParams } from '../../services/auth';
import { AppDispatch } from '..';

// We need to handle circular dependency, so declare the import type
type FetchTasksAction = () => any;
type FetchHabitsAction = () => any;
type FetchTimerSessionsAction = () => any;
type FetchPlantsAction = () => any;

// Declare variables to hold the imported functions
let fetchTasksFunc: FetchTasksAction | null = null;
let fetchHabitsFunc: FetchHabitsAction | null = null;
let fetchTimerSessionsFunc: FetchTimerSessionsAction | null = null;
let fetchPlantsFunc: FetchPlantsAction | null = null;

// Function to register the fetchTasks function
export const registerFetchTasks = (fetchTasks: FetchTasksAction) => {
  fetchTasksFunc = fetchTasks;
};

// Function to register the fetchHabits function
export const registerFetchHabits = (fetchHabits: FetchHabitsAction) => {
  fetchHabitsFunc = fetchHabits;
};

// Function to register the fetchTimerSessions function
export const registerFetchTimerSessions = (fetchTimerSessions: FetchTimerSessionsAction) => {
  fetchTimerSessionsFunc = fetchTimerSessions;
};

// Function to register the fetchPlants function
export const registerFetchPlants = (fetchPlants: FetchPlantsAction) => {
  fetchPlantsFunc = fetchPlants;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initialize with empty state - no localStorage dependency
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// Async thunks for API calls
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginParams, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterParams, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: UpdateProfileParams, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData: UpdatePasswordParams, { rejectWithValue }) => {
    try {
      const response = await authService.updatePassword(passwordData);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateCoins = createAsyncThunk(
  'auth/updateCoins',
  async (coins: number, { rejectWithValue }) => {
    try {
      const response = await authService.updateCoins({ coins });
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Create a new thunk to initialize user data after login
export const initializeUserData = createAsyncThunk(
  'auth/initializeUserData',
  async (_, { dispatch }) => {
    try {
      // Fetch tasks if the function is available
      if (fetchTasksFunc) {
        await dispatch(fetchTasksFunc());
      }

      // Fetch habits if the function is available
      if (fetchHabitsFunc) {
        await dispatch(fetchHabitsFunc());
      }

      // Fetch timer sessions and garden items
      if (fetchTimerSessionsFunc) {
        dispatch(fetchTimerSessionsFunc());
      }
      
      if (fetchPlantsFunc) {
        dispatch(fetchPlantsFunc());
      }
      // dispatch(fetchAchievements());
    } catch (error) {
      console.error('Error initializing user data:', error);
      // Don't throw the error here, just log it
      // This ensures the login/registration process completes even if data fetching fails
    }
  }
);

// Create a function to handle login success with data initialization
export const loginWithInitialization = (credentials: LoginParams) => async (dispatch: AppDispatch) => {
  try {
    // First, perform the login
    const result = await dispatch(login(credentials)).unwrap();
    
    try {
      // Then, initialize user data
      await dispatch(initializeUserData());
    } catch (error) {
      console.error('Error initializing data after login:', error);
      // Continue even if initialization fails
    }
    
    return result;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Create a function to handle register success with data initialization
export const registerWithInitialization = (userData: RegisterParams) => async (dispatch: AppDispatch) => {
  try {
    // First, perform the registration
    const result = await dispatch(register(userData)).unwrap();
    
    try {
      // Then, initialize user data
      await dispatch(initializeUserData());
    } catch (error) {
      console.error('Error initializing data after registration:', error);
      // Continue even if initialization fails
    }
    
    return result;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        // Don't modify state directly when returning a new object
        // Only return the new state object
        return {
          ...state,
          user: action.payload.user,
          token: action.payload.token,
          isLoading: false,
          error: null,
        };
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Password
    builder
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Coins
    builder
      .addCase(updateCoins.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCoins.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user && action.payload.user) {
          state.user.coins = action.payload.user.coins;
      }
      })
      .addCase(updateCoins.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCredentials, setUser, logout, clearError } = authSlice.actions;

export default authSlice.reducer; 