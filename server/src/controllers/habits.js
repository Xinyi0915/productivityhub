const Habit = require('../models/Habit');
const User = require('../models/User');
const { calculateHabitStreak } = require('../utils/streakCalculator');

/**
 * Get all habits for a user
 * @route GET /api/habits
 */
exports.getHabits = async (req, res) => {
  try {
    const { active, category, frequency, sortBy, sortOrder } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add filters if provided
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (frequency) {
      filter.frequency = frequency;
    }
    
    // Build sort object
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      // Default sort by createdAt
      sort = { createdAt: -1 };
    }
    
    const habits = await Habit.find(filter).sort(sort);

    // Recalculate streaks for each habit before sending
    const habitsWithStreaks = await Promise.all(habits.map(async habit => {
      const habitObj = habit.toObject(); // Convert to plain object
      const streakInfo = calculateHabitStreak(habitObj);
      
      // Update streak and longest streak
      habitObj.streak = streakInfo.streak;
      habitObj.longestStreak = Math.max(habitObj.longestStreak || 0, streakInfo.streak);
      
      // Save the updated streak to the database
      habit.streak = streakInfo.streak;
      habit.longestStreak = Math.max(habit.longestStreak || 0, streakInfo.streak);
      await habit.save(); // Wait for save to complete
      
      return habitObj;
    }));
    
    res.status(200).json({
      status: 'success',
      results: habitsWithStreaks.length,
      data: habitsWithStreaks,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get a single habit by ID
 * @route GET /api/habits/:id
 */
exports.getHabit = async (req, res) => {
  try {
    const habitId = req.params.id;
    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user._id,
    });
    
    if (!habit) {
      return res.status(404).json({
        status: 'error',
        message: 'Habit not found',
      });
    }

    // Recalculate streak before sending
    const habitObj = habit.toObject(); // Convert to plain object
    const streakInfo = calculateHabitStreak(habitObj);
    
    // Update streak and longest streak
    habitObj.streak = streakInfo.streak;
    habitObj.longestStreak = Math.max(habitObj.longestStreak || 0, streakInfo.streak);
    
    // Save the updated streak to the database
    habit.streak = streakInfo.streak;
    habit.longestStreak = Math.max(habit.longestStreak || 0, streakInfo.streak);
    await habit.save(); // Wait for save since this is a single habit
    
    res.status(200).json({
      status: 'success',
      data: habitObj,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Create a new habit
 * @route POST /api/habits
 */
exports.createHabit = async (req, res) => {
  try {
    // Add user ID to habit data
    const habitData = {
      ...req.body,
      user: req.user._id,
    };

    // Convert date strings to Date objects
    if (habitData.startDate) {
      habitData.startDate = new Date(habitData.startDate);
    }
    if (habitData.endDate) {
      habitData.endDate = new Date(habitData.endDate);
    } else {
      habitData.endDate = null;
    }
    
    const habit = await Habit.create(habitData);
    
    res.status(201).json({
      status: 'success',
      data: habit,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update a habit
 * @route PATCH /api/habits/:id
 */
exports.updateHabit = async (req, res) => {
  try {
    const habitId = req.params.id;
    const updateData = { ...req.body };

    // Convert date strings to Date objects
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if ('endDate' in updateData) {
      updateData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    }
    
    const habit = await Habit.findOneAndUpdate(
      {
        _id: habitId,
        user: req.user._id,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!habit) {
      return res.status(404).json({
        status: 'error',
        message: 'Habit not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: habit,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Delete a habit
 * @route DELETE /api/habits/:id
 */
exports.deleteHabit = async (req, res) => {
  try {
    const habitId = req.params.id;
    
    const habit = await Habit.findOneAndDelete({
      _id: habitId,
      user: req.user._id,
    });
    
    if (!habit) {
      return res.status(404).json({
        status: 'error',
        message: 'Habit not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Habit deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Add a check-in for a habit
 * @route POST /api/habits/:id/checkin
 */
exports.addCheckIn = async (req, res) => {
  try {
    const habitId = req.params.id;
    const { date, notes } = req.body;
    
    // Validate date
    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Date is required for check-in',
      });
    }
    
    const checkInDate = new Date(date);
    checkInDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the habit
    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user._id,
    });
    
    if (!habit) {
      return res.status(404).json({
        status: 'error',
        message: 'Habit not found',
      });
    }
    
    // Check if check-in already exists for this date
    const existingCheckIn = habit.checkIns.find(
      checkIn => {
        const checkInDay = new Date(checkIn.date);
        checkInDay.setHours(0, 0, 0, 0);
        return checkInDay.getTime() === checkInDate.getTime();
      }
    );
    
    if (existingCheckIn) {
      // Update existing check-in
      existingCheckIn.completed = true;
      existingCheckIn.notes = notes;
      existingCheckIn.date = checkInDate; // Ensure date is consistent
    } else {
      // Add new check-in
      habit.checkIns.push({
        date: checkInDate,
        completed: true,
        notes,
      });
    }
    
    // Sort check-ins by date
    habit.checkIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Recalculate streak
    const habitObj = habit.toObject();
    const streakInfo = calculateHabitStreak(habitObj);
    
    // Update streak and longest streak
    habit.streak = streakInfo.streak;
    habit.longestStreak = Math.max(habit.longestStreak || 0, streakInfo.streak);
    
    // Save the habit with updated check-ins and streak
    await habit.save();
    
    // Convert to object for response
    const responseHabit = habit.toObject();
    
    res.status(200).json({
      status: 'success',
      data: responseHabit,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Remove a check-in for a habit
 * @route DELETE /api/habits/:id/checkin/:checkInId
 */
exports.removeCheckIn = async (req, res) => {
  try {
    const { id: habitId, checkInId } = req.params;
    
    // Find the habit
    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user._id,
    });
    
    if (!habit) {
      return res.status(404).json({
        status: 'error',
        message: 'Habit not found',
      });
    }
    
    // Find and remove the check-in
    const checkInIndex = habit.checkIns.findIndex(
      checkIn => checkIn._id.toString() === checkInId
    );
    
    if (checkInIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Check-in not found',
      });
    }
    
    // Remove the check-in
    habit.checkIns.splice(checkInIndex, 1);
    
    // Sort remaining check-ins by date
    habit.checkIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Recalculate streak
    const habitObj = habit.toObject();
    const streakInfo = calculateHabitStreak(habitObj);
    
    // Update streak and longest streak
    habit.streak = streakInfo.streak;
    habit.longestStreak = Math.max(habit.longestStreak || 0, streakInfo.streak);
    
    // Save the updated habit
    await habit.save();
    
    // Convert to object for response
    const responseHabit = habit.toObject();
    
    res.status(200).json({
      status: 'success',
      data: responseHabit,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}; 