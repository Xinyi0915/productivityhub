const express = require('express');
const timerSessionsController = require('../controllers/timerSessions');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Stats endpoint
router.get('/stats', timerSessionsController.getTimerStats);

// Get all sessions and create a new session
router.route('/')
  .get(timerSessionsController.getTimerSessions)
  .post(timerSessionsController.createTimerSession);

// Get, update, and delete a specific session
router.route('/:id')
  .get(timerSessionsController.getTimerSession)
  .patch(timerSessionsController.updateTimerSession)
  .delete(timerSessionsController.deleteTimerSession);

module.exports = router;