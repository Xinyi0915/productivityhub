/**
 * Utility functions for managing browser storage
 */
import { purgePersistedState } from '../store';

/**
 * Clear all browser storage (localStorage and sessionStorage)
 */
export const clearAllBrowserStorage = (): void => {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('All browser storage cleared');
  } catch (error) {
    console.error('Error clearing browser storage:', error);
  }
};

/**
 * Clear only Redux persisted state from sessionStorage
 */
export const clearReduxPersistedState = (): void => {
  try {
    // Use Redux Persist's purge method to clear persisted state
    purgePersistedState();
    
    console.log('Redux persisted state cleared');
  } catch (error) {
    console.error('Error clearing Redux persisted state:', error);
  }
}; 