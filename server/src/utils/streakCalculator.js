/**
 * Utility functions for calculating habit streaks
 */

/**
 * Sets the time of a date to midnight (00:00:00)
 * @param {Date} date - The date to normalize
 * @returns {Date} - Date with time set to midnight
 */
const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Get the day of week in 0-6 format (0 = Sunday)
 * @param {Date} date - The date to get day from
 * @returns {number} - Day of week (0-6)
 */
const getDayOfWeek = (date) => {
  return date.getDay();
};

/**
 * Convert day of week from 0-6 format to 1-7 format (1 = Monday, 7 = Sunday)
 * @param {number} dayOfWeek - Day of week in 0-6 format
 * @returns {number} - Day of week in 1-7 format
 */
const convertDayFormat = (dayOfWeek) => {
  return dayOfWeek === 0 ? 7 : dayOfWeek;
};

/**
 * Get the start date of the week containing the given date
 * @param {Date} date - The date to get week start for
 * @returns {Date} - Start date of the week (Sunday)
 */
const getWeekStart = (date) => {
  const normalized = normalizeDate(date);
  const dayOfWeek = getDayOfWeek(normalized);
  const result = new Date(normalized);
  result.setDate(normalized.getDate() - dayOfWeek);
  return result;
};

/**
 * Get the week number of the year for a given date
 * @param {Date} date - The date to get week number for
 * @returns {number} - Week number (1-53)
 */
const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Checks if a date is the day after another date
 * @param {Date} date - The date to check
 * @param {Date} previousDate - The previous date
 * @returns {boolean} - True if date is the day after previousDate
 */
const isConsecutiveDay = (date, previousDate) => {
  const normalizedDate = normalizeDate(date);
  const normalizedPrevDate = normalizeDate(previousDate);
  
  // Calculate difference in days
  const diffTime = normalizedDate.getTime() - normalizedPrevDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return Math.round(diffDays) === 1;
};

/**
 * Calculate streak for daily habits
 * @param {Array} checkIns - Array of check-in dates
 * @param {Date} today - Today's date (for testing)
 * @returns {Object} - Object containing streak and lastCompletedDate
 */
const calculateDailyStreak = (checkIns, today = new Date()) => {
  if (!checkIns || checkIns.length === 0) {
    return { streak: 0, lastCompletedDate: null };
  }
  
  // Normalize today's date to midnight
  const normalizedToday = normalizeDate(today);
  
  // Sort check-ins by date (newest first) and only include completed ones
  const sortedCheckIns = [...checkIns]
    .filter(checkIn => checkIn.completed)
    .map(checkIn => normalizeDate(new Date(checkIn.date)))
    .sort((a, b) => b.getTime() - a.getTime());
  
  // If no completed check-ins, return 0 streak
  if (sortedCheckIns.length === 0) {
    return { streak: 0, lastCompletedDate: null };
  }
  
  const latestCheckIn = sortedCheckIns[0];
  
  // If the latest check-in is more than one day old, streak is broken
  const daysSinceLastCheckIn = Math.floor(
    (normalizedToday.getTime() - latestCheckIn.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastCheckIn > 1) {
    return { streak: 0, lastCompletedDate: latestCheckIn };
  }
  
  // Start counting streak from the latest check-in
  let streak = 1;
  let currentDate = latestCheckIn;
  
  // Look at each previous check-in
  for (let i = 1; i < sortedCheckIns.length; i++) {
    const prevDate = sortedCheckIns[i];
    
    // Calculate days between current and previous check-in
    const daysBetween = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // If it's consecutive, increment streak and continue
    if (daysBetween === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      // Break the chain if not consecutive
      break;
    }
  }
  
  return { streak, lastCompletedDate: latestCheckIn };
};

/**
 * Calculate streak for weekly habits
 * @param {Array} checkIns - Array of check-in dates
 * @param {Array} scheduledDays - Array of scheduled days (1-7 format)
 * @param {Date} today - Today's date (for testing)
 * @returns {Object} - Object containing streak and lastCompletedDate
 */
const calculateWeeklyStreak = (checkIns, scheduledDays, today = new Date()) => {
  if (!checkIns || checkIns.length === 0 || !scheduledDays || scheduledDays.length === 0) {
    return { streak: 0, lastCompletedDate: null };
  }
  
  const normalizedToday = normalizeDate(today);
  const currentWeekStart = getWeekStart(normalizedToday);
  
  // Filter out future check-ins
  const validCheckIns = checkIns.filter(checkIn => {
    const checkInDate = normalizeDate(new Date(checkIn.date));
    return checkInDate <= normalizedToday;
  });
  
  // If no valid check-ins (all are in the future), return 0 streak
  if (validCheckIns.length === 0) {
    return { streak: 0, lastCompletedDate: null };
  }
  
  // Group check-ins by week
  const checkInsByWeek = {};
  
  validCheckIns.forEach(checkIn => {
    const checkInDate = normalizeDate(new Date(checkIn.date));
    const weekStart = getWeekStart(checkInDate);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!checkInsByWeek[weekKey]) {
      checkInsByWeek[weekKey] = [];
    }
    
    checkInsByWeek[weekKey].push(checkInDate);
  });
  
  // Sort weeks in descending order (newest first)
  const sortedWeeks = Object.keys(checkInsByWeek)
    .sort((a, b) => new Date(b) - new Date(a));
  
  if (sortedWeeks.length === 0) {
    return { streak: 0, lastCompletedDate: null };
  }
  
  // Check if all scheduled days in current week are completed
  // But only for days that have already passed
  let streak = 0;
  let lastCompletedDate = null;
  let continuousStreak = true;
  
  for (let weekIdx = 0; weekIdx < sortedWeeks.length; weekIdx++) {
    const weekKey = sortedWeeks[weekIdx];
    const weekStart = new Date(weekKey);
    const weekCheckIns = checkInsByWeek[weekKey];
    
    // For the current week, we only check days that have passed
    const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
    let allRequiredDaysCompleted = true;
    
    // Check if all scheduled days for this week are completed
    for (const scheduledDay of scheduledDays) {
      const dayOffset = scheduledDay === 7 ? 0 : scheduledDay - 1; // Convert to 0-6 format
      const scheduledDate = new Date(weekStart);
      scheduledDate.setDate(weekStart.getDate() + dayOffset);
      
      // Skip future dates for current week
      if (isCurrentWeek && scheduledDate > normalizedToday) {
        continue;
      }
      
      // Check if this scheduled date was completed
      const wasCompleted = weekCheckIns.some(date => 
        date.getTime() === scheduledDate.getTime()
      );
      
      if (!wasCompleted) {
        allRequiredDaysCompleted = false;
        break;
      }
      
      // Update last completed date if this is the most recent completion
      if (!lastCompletedDate || scheduledDate > lastCompletedDate) {
        lastCompletedDate = scheduledDate;
      }
    }
    
    if (allRequiredDaysCompleted) {
      streak++;
      
      // For weeks other than the current week, check if it's consecutive
      if (weekIdx > 0) {
        const thisWeekStart = new Date(weekKey);
        const prevWeekKey = sortedWeeks[weekIdx - 1];
        const prevWeekStart = new Date(prevWeekKey);
        
        // Check if weeks are consecutive
        const diffTime = prevWeekStart.getTime() - thisWeekStart.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (Math.round(diffDays) !== 7) {
          continuousStreak = false;
          break;
        }
      }
    } else {
      break;
    }
  }
  
  return { streak, lastCompletedDate };
};

/**
 * Calculate habit streak based on frequency
 * @param {Object} habit - Habit object
 * @param {Date} today - Today's date (for testing)
 * @returns {Object} - Object containing streak and lastCompletedDate
 */
const calculateHabitStreak = (habit, today = new Date()) => {
  if (!habit || !habit.checkIns || habit.checkIns.length === 0) {
    return { streak: 0, lastCompletedDate: null };
  }
  
  if (habit.frequency === 'weekly' || habit.frequency === 'custom') {
    return calculateWeeklyStreak(habit.checkIns, habit.customDays, today);
  }
  
  // Default to daily streak calculation
  return calculateDailyStreak(habit.checkIns, today);
};

module.exports = {
  normalizeDate,
  getDayOfWeek,
  convertDayFormat,
  getWeekStart,
  getWeekNumber,
  isConsecutiveDay,
  calculateDailyStreak,
  calculateWeeklyStreak,
  calculateHabitStreak
}; 