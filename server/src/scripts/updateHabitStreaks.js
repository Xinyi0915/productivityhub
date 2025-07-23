/**
 * Script to update all existing habits with proper streak calculations
 * Run with: node src/scripts/updateHabitStreaks.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const { calculateHabitStreak } = require('../utils/streakCalculator');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for streak update'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function updateAllHabitStreaks() {
  try {
    console.log('Starting habit streak update...');
    
    // Get all habits
    const habits = await Habit.find({});
    console.log(`Found ${habits.length} habits to update`);
    
    let updatedCount = 0;
    
    // Process each habit
    for (const habit of habits) {
      // Calculate streak using the new utility
      const { streak, lastCompletedDate } = calculateHabitStreak(habit);
      
      // Update streak and lastCompletedDate
      habit.streak = streak;
      habit.lastCompletedDate = lastCompletedDate;
      
      // Update longest streak if needed
      if (streak > habit.longestStreak) {
        habit.longestStreak = streak;
      }
      
      // Save the updated habit
      await habit.save();
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount}/${habits.length} habits`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} habits`);
    console.log('Streak update complete!');
    
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error updating habit streaks:', error);
    // Close the MongoDB connection
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the update function
updateAllHabitStreaks(); 