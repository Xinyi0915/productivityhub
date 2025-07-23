const Task = require('../models/Task');

/**
 * Get all tasks for a user
 * @route GET /api/tasks
 */
exports.getTasks = async (req, res) => {
  try {
    const { completed, category, dueDate, sortBy, sortOrder, limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add filters if provided
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (dueDate) {
      const date = new Date(dueDate);
      // Create a range for the entire day
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      filter.dueDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    // Build sort object
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      // Default sort by order
      sort = { order: 1 };
    }
    
    // Fetch tasks
    const tasks = await Task.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'username'); // Populate user info
    
    // Count total tasks
    const totalTasks = await Task.countDocuments(filter);
    
    // Add userId and username to each task
    const tasksWithUserInfo = tasks.map(task => {
      const taskObj = task.toObject();
      if (task.user) {
        taskObj.userId = task.user._id.toString();
        taskObj.username = task.user.username;
      }
      return taskObj;
    });
    
    res.status(200).json({
      status: 'success',
      results: tasks.length,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: parseInt(page),
      data: tasksWithUserInfo,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get a single task by ID
 * @route GET /api/tasks/:id
 */
exports.getTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findOne({
      _id: taskId,
      user: req.user._id,
    }).populate('user', 'username');
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }
    
    // Add userId and username to the task
    const taskObj = task.toObject();
    if (task.user) {
      taskObj.userId = task.user._id.toString();
      taskObj.username = task.user.username;
    }
    
    res.status(200).json({
      status: 'success',
      data: taskObj,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Create a new task
 * @route POST /api/tasks
 */
exports.createTask = async (req, res) => {
  try {
    // Add user ID to task data
    const taskData = {
      ...req.body,
      user: req.user._id,
    };
    
    // If order is not specified, put it at the end
    if (taskData.order === undefined) {
      const lastTask = await Task.findOne({ 
        user: req.user._id,
        completed: false,
      }).sort({ order: -1 });
      
      taskData.order = lastTask ? lastTask.order + 1 : 0;
    }
    
    const task = await Task.create(taskData);
    
    res.status(201).json({
      status: 'success',
      data: task,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update a task
 * @route PATCH /api/tasks/:id
 */
exports.updateTask = async (req, res) => {
  try {
    // If marking as completed, set completedAt date
    if (req.body.completed === true) {
      req.body.completedAt = new Date();
    }
    
    // Use the resource from the middleware if available
    let task;
    if (req.resource) {
      // The middleware has already verified permissions
      task = await Task.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
      // Fall back to the original behavior
      task = await Task.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user._id,
        },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
    }
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: task,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Delete a task
 * @route DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res) => {
  try {
    // Use the resource from the middleware if available
    let task;
    if (req.resource) {
      // The middleware has already verified permissions
      task = await Task.findByIdAndDelete(req.params.id);
    } else {
      // Fall back to the original behavior
      task = await Task.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
    }
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Reorder tasks
 * @route PATCH /api/tasks/reorder
 */
exports.reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        status: 'error',
        message: 'Tasks must be an array of objects with id and order properties',
      });
    }
    
    // Use transactions for reordering to ensure consistency
    const session = await Task.startSession();
    session.startTransaction();
    
    try {
      const updates = tasks.map(task => {
        return Task.updateOne(
          { _id: task.id, user: req.user._id },
          { $set: { order: task.order } }
        );
      });
      
      await Promise.all(updates);
      
      await session.commitTransaction();
      session.endSession();
      
      res.status(200).json({
        status: 'success',
        message: 'Tasks reordered successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
}; 