const express = require('express');
const gardenController = require('../controllers/garden');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Stats endpoint
router.get('/stats', gardenController.getGardenStats);

// Get all garden items and create a new item
router.route('/')
  .get(gardenController.getGardenItems)
  .post(gardenController.createGardenItem);

// Get, update, and delete a specific garden item
router.route('/:id')
  .get(gardenController.getGardenItem)
  .patch(gardenController.updateGardenItem)
  .delete(gardenController.deleteGardenItem);

// Grow a garden item
router.patch('/:id/grow', gardenController.growItem);

module.exports = router; 