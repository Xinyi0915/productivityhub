import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AppDispatch } from '..';
import { updateCoins, registerFetchTimerSessions } from './authSlice';
import { sendTimerCompletionNotification, sendCoinEarnedNotification, sendTaskCompletionNotification } from '../../utils/notifications';
import { playNotificationSound, startWhiteNoise, stopWhiteNoise, setWhiteNoiseVolume, NoiseType, stopNotificationSound } from '../../utils/sounds';
import * as timerSessionsService from '../../services/timerSessions';

export interface TimerSession {
  id: string;
  duration: number;
  startTime: string;
  endTime: string;
  coinsEarned: number;
}

interface TimerState {
  isRunning: boolean;
  currentSession: TimerSession | null;
  selectedDuration: number; // in minutes
  timeRemaining: number; // in seconds
  sessions: TimerSession[];
  totalCoinsEarned: number;
  totalFocusMinutes: number;
  presetDurations: number[]; // in minutes
  whiteNoiseEnabled: boolean;
  whiteNoiseVolume: number;
  noiseType: NoiseType;
  loading: boolean;
  error: string | null;
}

const initialState: TimerState = {
  isRunning: false,
  currentSession: null,
  selectedDuration: 25,
  timeRemaining: 25 * 60,
  sessions: [],
  totalCoinsEarned: 0,
  totalFocusMinutes: 0,
  presetDurations: [15, 25, 30, 45, 60],
  whiteNoiseEnabled: false,
  whiteNoiseVolume: 0.1,
  noiseType: 'white',
  loading: false,
  error: null,
};

// Keep track of the current interval
let currentInterval: NodeJS.Timeout | null = null;

// Async thunks
export const fetchTimerSessions = createAsyncThunk(
  'timer/fetchSessions',
  async (params: { limit?: number; page?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await timerSessionsService.fetchTimerSessions(params);
      return response.sessions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch timer sessions');
    }
  }
);

export const saveTimerSession = createAsyncThunk(
  'timer/saveSession',
  async (session: TimerSession, { rejectWithValue }) => {
    try {
      return await timerSessionsService.createTimerSession(session);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save timer session');
    }
  }
);

// Background timer thunk
export const startBackgroundTimer = () => (dispatch: AppDispatch) => {
  // Clear any existing interval first
  if (currentInterval) {
    clearInterval(currentInterval);
  }

  // Start a new interval
  currentInterval = setInterval(() => {
    dispatch(tick());
  }, 1000);
};

export const stopBackgroundTimer = () => {
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = null;
  }
};

// New thunk for handling automatic timer completion
export const handleTimerCompletion = () => async (dispatch: AppDispatch, getState: () => any) => {
  const state = getState();
  const { selectedDuration, currentSession, whiteNoiseEnabled } = state.timer;
  const currentUserCoins = state.auth.user?.coins || 0;
  
  if (!currentSession) {
    console.error("Cannot complete session: No active session found");
    return;
  }
  
  // When timer completes naturally, we use the full selected duration
  const actualDuration = selectedDuration;
  
  // Award coins - 2 coins per minute
  const coinsEarned = Math.max(1, Math.floor(actualDuration * 2));
  
  // Update user coins
  dispatch(updateCoins(currentUserCoins + coinsEarned));
  
  // Send notifications
  sendTimerCompletionNotification(dispatch as AppDispatch, actualDuration);
  sendCoinEarnedNotification(dispatch as AppDispatch, coinsEarned, `completing a ${actualDuration}-minute focus session`);
  
  // Create completed session
  const completedSession = {
    ...currentSession,
    duration: actualDuration,
    endTime: new Date().toISOString(),
    coinsEarned
  };
  
  // Save the session to backend and update local state
  dispatch(saveTimerSession(completedSession)).then(() => {
    dispatch(completeSessionWithDuration(completedSession));
  });
  
  // Note: We don't stop notification sounds here to let them continue until user interaction
  // stopNotificationSound();
  
  // Ensure white noise is stopped
  if (whiteNoiseEnabled) {
    stopWhiteNoise();
  }
};

export const completeTimerSession = () => async (dispatch: AppDispatch, getState: () => any) => {
  const state = getState();
  const { selectedDuration, currentSession, timeRemaining, whiteNoiseEnabled } = state.timer;
  const currentUserCoins = state.auth.user?.coins || 0;
  
  if (!currentSession) {
    console.error("Cannot complete session: No active session found");
    return;
  }
  
  // Calculate actual duration based on time remaining
  // If we started with 25 minutes and have 10 minutes remaining, we've focused for 15 minutes
  const actualDuration = selectedDuration - Math.floor(timeRemaining / 60);
  
  // Only award coins and record session if at least 1 minute was spent
  if (actualDuration > 0) {
    // Award coins based on actual time spent - 2 coins per minute, minimum 1 coin
    const coinsEarned = Math.max(1, Math.floor(actualDuration * 2));
    
    // Update coins with the correct current value
    dispatch(updateCoins(currentUserCoins + coinsEarned));
    
    // Send notifications
    sendTaskCompletionNotification(dispatch as AppDispatch, actualDuration);
    sendCoinEarnedNotification(dispatch as AppDispatch, coinsEarned, `completing a ${actualDuration}-minute focus session`);
    
    // Override the session duration with actual time spent
    const updatedSession = {
      ...currentSession,
      duration: actualDuration,
      endTime: new Date().toISOString(),
      coinsEarned
    };
    
    // Save the session to backend and update local state
    dispatch(saveTimerSession(updatedSession)).then(() => {
      dispatch(completeSessionWithDuration(updatedSession));
    });
  } else {
    // If less than a minute was spent, just reset the timer without recording
    dispatch(resetTimer());
  }
  
  // Stop any notification sounds
  stopNotificationSound();
  
  // Ensure white noise is stopped
  if (whiteNoiseEnabled) {
    stopWhiteNoise();
  }
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    setDuration: (state, action: PayloadAction<number>) => {
      state.selectedDuration = action.payload;
      state.timeRemaining = action.payload * 60;
    },
    startTimer: (state) => {
      if (!state.isRunning) {
        state.isRunning = true;
        state.currentSession = {
          id: Date.now().toString(),
          duration: state.selectedDuration,
          startTime: new Date().toISOString(),
          endTime: '',
          coinsEarned: 0,
        };
        // Start white noise if enabled
        if (state.whiteNoiseEnabled) {
          startWhiteNoise(state.noiseType, state.whiteNoiseVolume);
        }
      }
    },
    pauseTimer: (state) => {
      state.isRunning = false;
      stopBackgroundTimer();
      // Stop white noise
      if (state.whiteNoiseEnabled) {
        stopWhiteNoise();
      }
    },
    resetTimer: (state) => {
      state.isRunning = false;
      state.timeRemaining = state.selectedDuration * 60;
      state.currentSession = null;
      stopBackgroundTimer();
      // Stop white noise
      if (state.whiteNoiseEnabled) {
        stopWhiteNoise();
      }
      // Stop any notification sounds
      stopNotificationSound();
    },
    tick: (state) => {
      if (!state.isRunning) return;

      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
        if (state.timeRemaining === 0) {
          // Timer completed
          if (state.currentSession) {
            state.isRunning = false;
            stopBackgroundTimer();
            // Play notification sound
            playNotificationSound();
            // Stop white noise if enabled
            if (state.whiteNoiseEnabled) {
              stopWhiteNoise();
            }
            // Note: We DON'T handle session completion here
            // It will be handled by the handleTimerCompletion thunk
          }
        }
      }
    },
    completeSession: (state) => {
      state.isRunning = false;
      state.timeRemaining = state.selectedDuration * 60;
      stopBackgroundTimer();
    },
    addCustomDuration: (state, action: PayloadAction<number>) => {
      if (!state.presetDurations.includes(action.payload)) {
        state.presetDurations.push(action.payload);
        state.presetDurations.sort((a, b) => a - b);
      }
    },
    removeCustomDuration: (state, action: PayloadAction<number>) => {
      state.presetDurations = state.presetDurations.filter(
        (duration) => duration !== action.payload
      );
    },
    completeSessionWithDuration: (state, action: PayloadAction<TimerSession>) => {
      const session = action.payload;
      const completedSession = {
        ...session,
        endTime: session.endTime || new Date().toISOString(),
      };
      
      // Add to the beginning of the sessions array
      state.sessions.unshift(completedSession);
      
      // Update total coins earned
      state.totalCoinsEarned += completedSession.coinsEarned;
      
      // Update total focus minutes
      state.totalFocusMinutes += completedSession.duration;
      
      // Reset timer state
      state.isRunning = false;
      state.timeRemaining = state.selectedDuration * 60;
      state.currentSession = null;
      
      // Stop white noise
      if (state.whiteNoiseEnabled) {
        stopWhiteNoise();
      }
      
      // Stop any notification sounds
      stopNotificationSound();
    },
    setWhiteNoiseEnabled: (state, action: PayloadAction<boolean>) => {
      state.whiteNoiseEnabled = action.payload;
      
      // If turning off while timer is running, stop the white noise
      if (!action.payload && state.isRunning) {
        stopWhiteNoise();
      }
      
      // If turning on while timer is running, start the white noise
      if (action.payload && state.isRunning) {
        startWhiteNoise(state.noiseType, state.whiteNoiseVolume);
      }
    },
    setWhiteNoiseVolume: (state, action: PayloadAction<number>) => {
      state.whiteNoiseVolume = action.payload;
      
      // Update volume if white noise is enabled
      if (state.whiteNoiseEnabled) {
        setWhiteNoiseVolume(action.payload);
      }
    },
    setNoiseType: (state, action: PayloadAction<NoiseType>) => {
      state.noiseType = action.payload;
      
      // If white noise is enabled and timer is running, restart with new noise type
      if (state.whiteNoiseEnabled && state.isRunning) {
        stopWhiteNoise();
        startWhiteNoise(action.payload, state.whiteNoiseVolume);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch timer sessions
      .addCase(fetchTimerSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimerSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
        
        // Calculate totals
        state.totalCoinsEarned = action.payload.reduce((total, session) => total + session.coinsEarned, 0);
        state.totalFocusMinutes = action.payload.reduce((total, session) => total + session.duration, 0);
      })
      .addCase(fetchTimerSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Save timer session
      .addCase(saveTimerSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveTimerSession.fulfilled, (state) => {
        state.loading = false;
        // Note: The session is added to the state in the completeSessionWithDuration reducer
      })
      .addCase(saveTimerSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setDuration,
  startTimer,
  pauseTimer,
  resetTimer,
  tick,
  completeSession,
  completeSessionWithDuration,
  addCustomDuration,
  removeCustomDuration,
  setWhiteNoiseEnabled,
  setWhiteNoiseVolume,
  setNoiseType,
} = timerSlice.actions;

export default timerSlice.reducer;

// Register the fetchTimerSessions function with authSlice
registerFetchTimerSessions(fetchTimerSessions); 