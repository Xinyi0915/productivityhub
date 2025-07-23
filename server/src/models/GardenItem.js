const mongoose = require('mongoose');

const gardenItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['plant', 'tree', 'flower', 'decoration', 'achievement'],
      required: true,
    },
    itemId: {
      type: String,
      required: true, // Corresponds to the item's ID in frontend
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    position: {
      x: {
        type: Number,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
      z: {
        type: Number,
        default: 0,
      },
    },
    planted: {
      type: Date,
      default: Date.now,
    },
    growthStage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    growthProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastWatered: {
      type: Date,
      default: Date.now,
    },
    cost: {
      type: Number,
      default: 0,
    },
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    linkedTo: {
      type: {
        itemType: {
          type: String,
          enum: ['task', 'habit', 'timerSession', 'achievement'],
        },
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for user queries
gardenItemSchema.index({ user: 1 });

// Create index for item type
gardenItemSchema.index({ user: 1, type: 1 });

// Create index for growth stage
gardenItemSchema.index({ user: 1, growthStage: 1 });

const GardenItem = mongoose.model('GardenItem', gardenItemSchema);

module.exports = GardenItem; 