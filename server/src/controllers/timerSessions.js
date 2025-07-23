const TimerSession = require('../models/TimerSession');
const User = require('../models/User');

/**
 * Get all timer sessions for a user
 * @route GET /api/timer-sessions
 */
exports.getTimerSessions = async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add filters if provided
    if (type) {
      filter.type = type;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.startTime = {};
      
      if (startDate) {
        filter.startTime.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.startTime.$lte = new Date(endDate);
      }
    }
    
    // Fetch sessions
    const sessions = await TimerSession.find(filter)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Count total sessions
    const totalSessions = await TimerSession.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: sessions.length,
      totalPages: Math.ceil(totalSessions / limit),
      currentPage: parseInt(page),
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get a single timer session by ID
 * @route GET /api/timer-sessions/:id
 */
exports.getTimerSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await TimerSession.findOne({
      _id: sessionId,
      user: req.user._id,
    });
    
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Timer session not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Create a new timer session
 * @route POST /api/timer-sessions
 */
exports.createTimerSession = async (req, res) => {
  try {
    const sessionData = {
      ...req.body,
      user: req.user._id,
    };
    
    // Calculate duration if not provided
    if (!sessionData.duration && sessionData.startTime && sessionData.endTime) {
      const start = new Date(sessionData.startTime);
      const end = new Date(sessionData.endTime);
      const durationMs = end - start;
      sessionData.duration = Math.round(durationMs / 60000); // Convert to minutes
    }
    
    const session = await TimerSession.create(sessionData);
    
    // If coins were earned, update user's coins
    if (session.coinsEarned > 0) {
      const user = await User.findById(req.user._id);
      user.coins += session.coinsEarned;
      await user.save();
    }
    
    res.status(201).json({
      status: 'success',
      data: session,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update a timer session
 * @route PATCH /api/timer-sessions/:id
 */
exports.updateTimerSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const updateData = req.body;
    
    // Calculate duration if start and end time were updated
    if (!updateData.duration && updateData.startTime && updateData.endTime) {
      const start = new Date(updateData.startTime);
      const end = new Date(updateData.endTime);
      const durationMs = end - start;
      updateData.duration = Math.round(durationMs / 60000); // Convert to minutes
    }
    
    const originalSession = await TimerSession.findOne({
      _id: sessionId,
      user: req.user._id,
    });
    
    if (!originalSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Timer session not found',
      });
    }
    
    // Calculate coins difference
    const originalCoins = originalSession.coinsEarned || 0;
    const newCoins = updateData.coinsEarned !== undefined 
      ? updateData.coinsEarned 
      : originalCoins;
    const coinsDifference = newCoins - originalCoins;
    
    const session = await TimerSession.findOneAndUpdate(
      {
        _id: sessionId,
        user: req.user._id,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    
    // Update user's coins if coins earned has changed
    if (coinsDifference !== 0) {
      const user = await User.findById(req.user._id);
      user.coins += coinsDifference;
      await user.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: session,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Delete a timer session
 * @route DELETE /api/timer-sessions/:id
 */
exports.deleteTimerSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    const session = await TimerSession.findOne({
      _id: sessionId,
      user: req.user._id,
    });
    
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Timer session not found',
      });
    }
    
    // If session had coins, update user's coins
    if (session.coinsEarned > 0) {
      const user = await User.findById(req.user._id);
      user.coins -= session.coinsEarned;
      await user.save();
    }
    
    await session.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Timer session deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get summary statistics for timer sessions
 * @route GET /api/timer-sessions/stats
 */
exports.getTimerStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.startTime = {};
      
      if (startDate) {
        filter.startTime.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.startTime.$lte = new Date(endDate);
      }
    }
    
    // Aggregate statistics
    const stats = await TimerSession.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalMinutes: { $sum: '$duration' },
        totalCoinsEarned: { $sum: '$coinsEarned' },
        avgSessionDuration: { $avg: '$duration' },
        focusSessions: {
          $sum: { $cond: [{ $eq: ['$type', 'focus'] }, 1, 0] }
        },
        shortBreakSessions: {
          $sum: { $cond: [{ $eq: ['$type', 'shortBreak'] }, 1, 0] }
        },
        longBreakSessions: {
          $sum: { $cond: [{ $eq: ['$type', 'longBreak'] }, 1, 0] }
        },
      }},
    ]);
    
    // Get daily stats
    const dailyStats = await TimerSession.aggregate([
      { $match: filter },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          duration: 1,
          type: 1,
        },
      },
      {
        $group: {
          _id: '$date',
          totalMinutes: { $sum: '$duration' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        summary: stats.length > 0 ? stats[0] : {
          totalSessions: 0,
          totalMinutes: 0,
          totalCoinsEarned: 0,
          avgSessionDuration: 0,
          focusSessions: 0,
          shortBreakSessions: 0,
          longBreakSessions: 0,
        },
        dailyStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}; 