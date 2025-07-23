const mongoose = require('mongoose');

const timerSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
    },
    type: {
      type: String,
      enum: ['focus', 'shortBreak', 'longBreak'],
      default: 'focus',
    },
    completed: {
      type: Boolean,
      default: true,
    },
    interrupted: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    coinsEarned: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

// Create index for user queries
timerSessionSchema.index({ user: 1 });

// Create index for date-based queries
timerSessionSchema.index({ user: 1, startTime: -1 });

// Create index for type-based queries
timerSessionSchema.index({ user: 1, type: 1 });

const TimerSession = mongoose.model('TimerSession', timerSessionSchema);

module.exports = TimerSession; 