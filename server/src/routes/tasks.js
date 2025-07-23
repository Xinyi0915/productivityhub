const express = require('express');
const tasksController = require('../controllers/tasks');
const { protect, isOwnerOrAdmin } = require('../middleware/auth');
const Task = require('../models/Task');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all tasks and create a new task
router.route('/')
  .get(tasksController.getTasks)
  .post(tasksController.createTask);

// Get, update, and delete a specific task
router.route('/:id')
  .get(tasksController.getTask)
  .patch(isOwnerOrAdmin(Task), tasksController.updateTask)
  .delete(isOwnerOrAdmin(Task), tasksController.deleteTask);

// Reorder tasks
router.patch('/reorder', tasksController.reorderTasks);

module.exports = router; 