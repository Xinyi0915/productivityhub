const express = require('express');
const authController = require('../controllers/auth');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/create-first-admin', authController.createFirstAdmin); // One-time use route to create first admin

// Protected routes
router.get('/me', protect, authController.getMe);

// Admin routes - only existing admins can create other admins
router.post('/create-admin', protect, restrictTo('admin'), authController.createAdmin);

module.exports = router; 