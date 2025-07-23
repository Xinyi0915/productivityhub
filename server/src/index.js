const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cron = require('node-cron');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const habitRoutes = require('./routes/habits');
const timerSessionRoutes = require('./routes/timerSessions');
const gardenRoutes = require('./routes/garden');
const achievementRoutes = require('./routes/achievements');

// Import jobs
const updateAllHabitStreaks = require('./jobs/dailyStreakUpdate');

// Initialize express app
const app = express();

// Middleware
app.use(morgan('dev'));

// Enhanced CORS configuration for deployment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  process.env.FRONTEND_URL, // Production frontend URL (set this in your environment)
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1 && !process.env.ALLOW_ALL_ORIGINS) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/timer-sessions', timerSessionRoutes);
app.use('/api/garden', gardenRoutes);
app.use('/api/achievements', achievementRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/productivityhub';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    // Schedule daily streak update job - runs at midnight every day
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Running scheduled habit streak update');
        const result = await updateAllHabitStreaks();
        logger.info(`Streak update completed: ${result.updatedCount} habits updated, ${result.brokenStreaksCount} streaks broken`);
      } catch (error) {
        logger.error('Error in scheduled streak update:', error);
      }
    });
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

module.exports = app; 