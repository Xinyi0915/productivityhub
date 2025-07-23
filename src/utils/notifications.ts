/**
 * Notification utility functions for providing user feedback throughout the application
 * Handles creation and dispatching of different types of notifications
 */
import { AppDispatch } from '../store';
import { addNotification } from '../store/slices/notificationsSlice';

/**
 * Generic notification sender - foundation for all other notification types
 * 
 * @param dispatch - Redux dispatch function
 * @param title - Title displayed at the top of the notification
 * @param message - Main content of the notification
 * @param type - Visual styling of the notification (affects color and icon)
 */
export const sendNotification = (
  dispatch: AppDispatch,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  dispatch(addNotification({ title, message, type }));
};

// Task-related notifications

/**
 * Sends a positive reinforcement notification when a task is completed (with dispatch)
 */
export const sendTaskCompletionNotificationWithDispatch = (dispatch: AppDispatch, taskTitle: string) => {
  sendNotification(
    dispatch,
    'Task Completed! 🎉',
    `Great job completing "${taskTitle}"! Keep up the momentum.`,
    'success'
  );
};

/**
 * Notifies the user when they earn coins for various achievements (with dispatch)
 */
export const sendCoinEarnedNotificationWithDispatch = (
  dispatch: AppDispatch,
  amount: number,
  reason: string
) => {
  sendNotification(
    dispatch,
    'Coins Earned! 🪙',
    `You earned ${amount} coins for ${reason}.`,
    'info'
  );
};

// Non-dispatch versions that can be used directly from components
/**
 * Sends a task completion notification directly without requiring dispatch
 */
export const sendTaskCompletionNotification = (taskTitle: string) => {
  const dispatch = window.reduxStore?.dispatch;
  if (dispatch) {
    sendNotification(
      dispatch,
      'Task Completed! 🎉',
      `Great job completing "${taskTitle}"! Keep up the momentum.`,
      'success'
    );
  }
};

/**
 * Sends a coin earned notification directly without requiring dispatch
 */
export const sendCoinEarnedNotification = (amount: number, reason: string = 'your achievements') => {
  const dispatch = window.reduxStore?.dispatch;
  if (dispatch) {
    if (amount > 0) {
      sendNotification(
        dispatch,
        'Coins Earned! 🪙',
        `You earned ${amount} coins for ${reason}.`,
        'info'
      );
    } else if (amount < 0) {
      sendNotification(
        dispatch,
        'Coins Deducted! 🪙',
        `You lost ${Math.abs(amount)} coins for ${reason}.`,
        'warning'
      );
    }
  }
};

// Habit-related notifications

/**
 * Sends a milestone notification for habit streaks at specific intervals
 * Special messages are sent at 3-day intervals and weekly milestones
 * 
 * @param dispatch - Redux dispatch function
 * @param habitName - Name of the habit being tracked
 * @param streakCount - Current streak length in days
 */
export const sendHabitStreakNotification = (
  dispatch: AppDispatch,
  habitName: string,
  streakCount: number
) => {
  if (streakCount % 7 === 0) {
    // Weekly streak milestone - major achievement
    sendNotification(
      dispatch,
      'Streak Milestone! 🔥',
      `Amazing! You've maintained "${habitName}" for ${streakCount} days. That's ${
        streakCount / 7
      } weeks of consistency!`,
      'success'
    );
  } else if (streakCount % 3 === 0) {
    // 3-day streak milestone - minor achievement
    sendNotification(
      dispatch,
      'Streak Growing! ⚡',
      `You've kept up "${habitName}" for ${streakCount} days. Keep going!`,
      'success'
    );
  }
};

// Timer-related notifications

/**
 * Sends a notification when a focus timer session completes
 * 
 * @param dispatch - Redux dispatch function
 * @param duration - Length of the completed session in minutes
 */
export const sendTimerCompletionNotification = (dispatch: AppDispatch, duration: number) => {
  sendNotification(
    dispatch,
    'Focus Session Complete! ⏰',
    `Well done! You've completed a ${duration}-minute focus session.`,
    'success'
  );
};

/**
 * Sends a notification when a new plant is added to the user's garden
 * 
 * @param dispatch - Redux dispatch function
 * @param plantName - Name of the plant added to the garden
 */
export const sendGardenNotification = (dispatch: AppDispatch, plantName: string) => {
  sendNotification(
    dispatch,
    'Garden Growing! 🌱',
    `You've added a beautiful ${plantName} to your garden!`,
    'success'
  );
};

// Due date notifications

/**
 * Sends notifications about task due dates with different urgency levels
 * - Overdue tasks: Warning with days overdue
 * - Due today: Warning with today reminder
 * - Due tomorrow: Info with tomorrow reminder
 * 
 * @param dispatch - Redux dispatch function
 * @param taskTitle - Title of the task
 * @param daysUntilDue - Days until due (negative for overdue)
 */
export const sendDueDateNotification = (
  dispatch: AppDispatch,
  taskTitle: string,
  daysUntilDue: number
) => {
  if (daysUntilDue < 0) {
    // Task is overdue - warning notification
    sendNotification(
      dispatch,
      'Task Overdue! ⚠️',
      `"${taskTitle}" is overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'}.`,
      'warning'
    );
  } else if (daysUntilDue === 0) {
    // Task is due today - warning notification
    sendNotification(
      dispatch,
      'Task Due Today! ⏰',
      `"${taskTitle}" is due today. Don't forget to complete it!`,
      'warning'
    );
  } else if (daysUntilDue === 1) {
    // Task is due tomorrow - informational notification
    sendNotification(
      dispatch,
      'Task Due Tomorrow! 📅',
      `"${taskTitle}" is due tomorrow. Make sure to plan for it.`,
      'info'
    );
  }
};

/**
 * Checks all tasks for upcoming or passed due dates and sends appropriate notifications
 * Should be called once per day or when the app loads
 * 
 * @param dispatch - Redux dispatch function
 * @param tasks - Array of all tasks to check
 */
export const checkDueDates = (dispatch: AppDispatch, tasks: any[]) => {
  const now = new Date();  // Current time for hour-based notifications
  const today = new Date();
  today.setHours(0, 0, 0, 0);  // Start of today for day-based calculations
  
  // Check each task for due date conditions
  tasks.forEach(task => {
    if (task.deadline && !task.completed) {
      const dueDate = new Date(task.deadline);  // Full date-time of the deadline
      const dueDateStart = new Date(dueDate);
      dueDateStart.setHours(0, 0, 0, 0);  // Start of the day of the deadline
      
      // Calculate whole days difference between deadline day and today
      const diffTime = dueDateStart.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Special handling for tasks due today - check hours remaining
      if (diffDays === 0) {
        const hourDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // More urgent notification for tasks due within the hour
        if (hourDiff > 0 && hourDiff <= 1) {
          sendNotification(
            dispatch,
            'Task Due Soon! ⚠️',
            `"${task.title}" is due in less than an hour!`,
            'warning'
          );
        }
      }
      
      // For daily notifications, only send for tasks due soon or overdue
      // This prevents notification spam for tasks due far in the future
      if (diffDays <= 1 || diffDays < 0) {
        sendDueDateNotification(dispatch, task.title, diffDays);
      }
    }
  });
}; 