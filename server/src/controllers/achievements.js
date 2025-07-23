const Achievement = require('../models/Achievement');
const User = require('../models/User');

/**
 * Get all achievements for a user
 * @route GET /api/achievements
 */
exports.getAchievements = async (req, res) => {
  try {
    const { completed, category, tier, hidden } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add filters if provided
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (tier) {
      filter.tier = tier;
    }
    
    if (hidden !== undefined) {
      filter.hidden = hidden === 'true';
    }
    
    const achievements = await Achievement.find(filter).sort({ 
      completed: 1, // Incomplete first
      category: 1,
      tier: 1
    });
    
    res.status(200).json({
      status: 'success',
      results: achievements.length,
      data: achievements,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get a single achievement by ID
 * @route GET /api/achievements/:id
 */
exports.getAchievement = async (req, res) => {
  try {
    const achievementId = req.params.id;
    const achievement = await Achievement.findOne({
      _id: achievementId,
      user: req.user._id,
    });
    
    if (!achievement) {
      return res.status(404).json({
        status: 'error',
        message: 'Achievement not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: achievement,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Create a new achievement
 * @route POST /api/achievements
 */
exports.createAchievement = async (req, res) => {
  try {
    // Add user ID to achievement data
    const achievementData = {
      ...req.body,
      user: req.user._id,
    };
    
    const achievement = await Achievement.create(achievementData);
    
    res.status(201).json({
      status: 'success',
      data: achievement,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update an achievement's progress
 * @route PATCH /api/achievements/:id/progress
 */
exports.updateProgress = async (req, res) => {
  try {
    const achievementId = req.params.id;
    const { progress } = req.body;
    
    if (progress === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Progress is required',
      });
    }
    
    const achievement = await Achievement.findOne({
      _id: achievementId,
      user: req.user._id,
    });
    
    if (!achievement) {
      return res.status(404).json({
        status: 'error',
        message: 'Achievement not found',
      });
    }
    
    // Update progress
    achievement.progress.current = progress;
    
    // Check if achievement is completed
    if (progress >= achievement.progress.target && !achievement.completed) {
      achievement.completed = true;
      achievement.earnedDate = new Date();
    }
    
    await achievement.save();
    
    res.status(200).json({
      status: 'success',
      data: achievement,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Claim achievement reward
 * @route POST /api/achievements/:id/claim
 */
exports.claimReward = async (req, res) => {
  try {
    const achievementId = req.params.id;
    
    const achievement = await Achievement.findOne({
      _id: achievementId,
      user: req.user._id,
    });
    
    if (!achievement) {
      return res.status(404).json({
        status: 'error',
        message: 'Achievement not found',
      });
    }
    
    if (!achievement.completed) {
      return res.status(400).json({
        status: 'error',
        message: 'Achievement not completed yet',
      });
    }
    
    if (achievement.rewardClaimed) {
      return res.status(400).json({
        status: 'error',
        message: 'Reward already claimed',
      });
    }
    
    // Mark reward as claimed
    achievement.rewardClaimed = true;
    await achievement.save();
    
    // Add coins to user if there's a coin reward
    if (achievement.coinsRewarded > 0) {
      const user = await User.findById(req.user._id);
      user.coins += achievement.coinsRewarded;
      await user.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        achievement,
        coinsRewarded: achievement.coinsRewarded,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Delete an achievement
 * @route DELETE /api/achievements/:id
 */
exports.deleteAchievement = async (req, res) => {
  try {
    const achievementId = req.params.id;
    
    const achievement = await Achievement.findOneAndDelete({
      _id: achievementId,
      user: req.user._id,
    });
    
    if (!achievement) {
      return res.status(404).json({
        status: 'error',
        message: 'Achievement not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Achievement deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}; 