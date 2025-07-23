/**
 * Daily job to update habit streaks
 * This ensures that streaks are properly broken when users miss days
 */

const Habit = require('../models/Habit');
const { calculateHabitStreak } = require('../utils/streakCalculator');
const logger = require('../utils/logger');

/**
 * Update all habit streaks
 */
async function updateAllHabitStreaks() {
  try {
    logger.info('Starting daily habit streak update');
    
    // Get all active habits
    const habits = await Habit.find({ active: true });
    logger.info(`Found ${habits.length} active habits to check`);
    
    let updatedCount = 0;
    let brokenStreaksCount = 0;
    
    // Process each habit
    for (const habit of habits) {
      try {
        // Get current streak
        const currentStreak = habit.streak;
        
        // Calculate streak using the utility
        const { streak, lastCompletedDate } = calculateHabitStreak(habit);
        
        // Check if streak was broken
        if (currentStreak > 0 && streak === 0) {
          brokenStreaksCount++;
          logger.info(`Streak broken for habit ${habit._id} (${habit.name}). Previous streak: ${currentStreak}`);
        }
        
        // Update streak and lastCompletedDate
        habit.streak = streak;
        habit.lastCompletedDate = lastCompletedDate;
        
        // Update longest streak if current streak is higher
        if (streak > (habit.longestStreak || 0)) {
          habit.longestStreak = streak;
        }
        
        // Save the updated habit
        await habit.save();
        updatedCount++;
      } catch (error) {
        logger.error(`Error updating streak for habit ${habit._id}:`, error);
        // Continue with next habit
        continue;
      }
    }
    
    logger.info(`Daily streak update complete. Updated ${updatedCount} habits, ${brokenStreaksCount} streaks were broken`);
    return { updatedCount, brokenStreaksCount };
    
  } catch (error) {
    logger.error('Error in daily habit streak update:', error);
    throw error;
  }
}

module.exports = updateAllHabitStreaks; 