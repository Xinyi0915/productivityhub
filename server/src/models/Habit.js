const mongoose = require('mongoose');

const habitCheckInSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
    },
  },
  { _id: true }
);

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'general',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'daily',
    },
    // For custom frequency
    customDays: {
      type: [Number], // 0-6 for days of week
      default: [],
    },
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime',
    },
    color: {
      type: String,
      default: '#3B82F6', // Default blue color
    },
    icon: {
      type: String,
      default: 'check-circle',
    },
    streak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastCompletedDate: {
      type: Date,
      default: null,
    },
    // Store check-ins
    checkIns: [habitCheckInSchema],
    // Reminders
    reminderEnabled: {
      type: Boolean,
      default: false,
    },
    reminderTime: {
      type: String, // Format: "HH:MM"
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient user queries
habitSchema.index({ user: 1 });

// Create index for active habits
habitSchema.index({ user: 1, active: 1 });

// Create index for categories
habitSchema.index({ user: 1, category: 1 });

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit; 