import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage/session'; // Use sessionStorage instead of localStorage
import authReducer from './slices/authSlice';
import tasksReducer from './slices/tasksSlice';
import habitsReducer from './slices/habitsSlice';
import timerReducer from './slices/timerSlice';
import notificationsReducer from './slices/notificationsSlice';
import gardenReducer from './slices/gardenSlice';

// Configure persist options for the main Redux state
// This ensures data persists across page refreshes but not browser sessions
const persistConfig = {
  key: 'root', // Root key in sessionStorage
  storage,     // Storage engine (sessionStorage)
  whitelist: ['auth', 'tasks', 'habits', 'timer', 'garden'], // Only persist these slices
};

// Separate persistence config for the timer slice
// This allows for more granular control over timer persistence
const timerPersistConfig = {
  key: 'timer',  // Separate root key for timer data
  storage,
  blacklist: []  // Persist everything in the timer state (could be used to exclude fields)
};

// Create persisted reducers by wrapping our slice reducers with persistReducer
// This adds middleware that automatically saves/loads state to/from sessionStorage
const persistedTimerReducer = persistReducer(timerPersistConfig, timerReducer);

// Combine all reducers
const appReducer = combineReducers({
  auth: authReducer,
  tasks: tasksReducer,
  habits: habitsReducer,
  timer: persistedTimerReducer,
  notifications: notificationsReducer, // Notifications are intentionally not persisted
  garden: gardenReducer,
});

// Root reducer that handles the logout action specially
const rootReducer = (state: any, action: any) => {
  // When logout action is dispatched or a new user registers, reset all state
  if (action.type === 'auth/logout' || action.type === 'auth/register/fulfilled') {
    // Return a fresh state
    state = {
      auth: state.auth // Preserve the auth state that's already been cleared or updated
    };
  }

  return appReducer(state, action);
};

// Create persisted root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the Redux store with our persisted reducers
export const store = configureStore({
  reducer: persistedReducer,
  // Configure middleware to ignore Redux-Persist actions in serializability checks
  // This prevents warnings about non-serializable values in Redux actions
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

// Expose store globally for direct notification access
declare global {
  interface Window {
    reduxStore: typeof store;
  }
}

// Only set in browser environments
if (typeof window !== 'undefined') {
  window.reduxStore = store;
}

// Special handler for focus time changes
// This creates a custom subscription to focus time changes to ensure they're
// immediately persisted and reflected throughout the app
let lastFocusMinutes = store.getState().timer.totalFocusMinutes;
store.subscribe(() => {
  const currentState = store.getState();
  const currentFocusMinutes = currentState.timer.totalFocusMinutes;
  
  // Only trigger when focus minutes actually change
  if (currentFocusMinutes !== lastFocusMinutes) {
    console.log(`Focus minutes changed: ${lastFocusMinutes} → ${currentFocusMinutes}`);
    lastFocusMinutes = currentFocusMinutes;
    
    // Trigger storage event to notify other browser tabs/components
    window.dispatchEvent(new Event('storage'));
  }
});

// Create the persistor for use with PersistGate
export const persistor = persistStore(store);

// Export a function to purge persisted state
export const purgePersistedState = () => {
  return persistor.purge();
};

// Define TypeScript types for the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>; 