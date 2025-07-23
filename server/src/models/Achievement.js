const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    achievementId: {
      type: String,
      required: true, // Corresponds to the achievement's ID in the system
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['task', 'habit', 'focus', 'garden', 'special'],
      required: true,
    },
    icon: {
      type: String,
    },
    earnedDate: {
      type: Date,
      default: Date.now,
    },
    progress: {
      current: {
        type: Number,
        default: 0,
      },
      target: {
        type: Number,
        required: true,
      },
    },
    completed: {
      type: Boolean,
      default: false,
    },
    coinsRewarded: {
      type: Number,
      default: 0,
    },
    rewardClaimed: {
      type: Boolean,
      default: false,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'special'],
      default: 'bronze',
    },
  },
  {
    timestamps: true,
  }
);

// Create index for user queries
achievementSchema.index({ user: 1 });

// Create index for completion status
achievementSchema.index({ user: 1, completed: 1 });

// Create index for category
achievementSchema.index({ user: 1, category: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement; 