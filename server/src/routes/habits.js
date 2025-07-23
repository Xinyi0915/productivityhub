const express = require('express');
const habitsController = require('../controllers/habits');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all habits and create a new habit
router.route('/')
  .get(habitsController.getHabits)
  .post(habitsController.createHabit);

// Get, update, and delete a specific habit
router.route('/:id')
  .get(habitsController.getHabit)
  .patch(habitsController.updateHabit)
  .delete(habitsController.deleteHabit);

// Handle check-ins
router.route('/:id/checkin')
  .post(habitsController.addCheckIn);

router.route('/:id/checkin/:checkInId')
  .delete(habitsController.removeCheckIn);

module.exports = router; 