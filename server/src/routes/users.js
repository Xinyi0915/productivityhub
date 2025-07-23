const express = require('express');
const usersController = require('../controllers/users');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes here are protected
router.use(protect);

router.patch('/profile', usersController.updateProfile);
router.patch('/password', usersController.updatePassword);
router.patch('/coins', usersController.updateCoins);

module.exports = router; 