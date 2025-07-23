const express = require('express');
const achievementsController = require('../controllers/achievements');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all achievements and create a new achievement
router.route('/')
  .get(achievementsController.getAchievements)
  .post(achievementsController.createAchievement);

// Get and delete a specific achievement
router.route('/:id')
  .get(achievementsController.getAchievement)
  .delete(achievementsController.deleteAchievement);

// Handle achievement progress
router.patch('/:id/progress', achievementsController.updateProgress);

// Claim achievement reward
router.post('/:id/claim', achievementsController.claimReward);

module.exports = router;