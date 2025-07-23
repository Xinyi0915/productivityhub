const GardenItem = require('../models/GardenItem');
const User = require('../models/User');

/**
 * Get all garden items for a user
 * @route GET /api/garden
 */
exports.getGardenItems = async (req, res) => {
  try {
    const { type, growthStage, isVisible } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add filters if provided
    if (type) {
      filter.type = type;
    }
    
    if (growthStage !== undefined) {
      filter.growthStage = parseInt(growthStage);
    }
    
    if (isVisible !== undefined) {
      filter.isVisible = isVisible === 'true';
    }
    
    const items = await GardenItem.find(filter).sort({ planted: -1 });
    
    res.status(200).json({
      status: 'success',
      results: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get a single garden item by ID
 * @route GET /api/garden/:id
 */
exports.getGardenItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await GardenItem.findOne({
      _id: itemId,
      user: req.user._id,
    });
    
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Garden item not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Create a new garden item
 * @route POST /api/garden
 */
exports.createGardenItem = async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      user: req.user._id,
    };
    
    // Check if user has enough coins
    if (itemData.cost > 0) {
      const user = await User.findById(req.user._id);
      
      if (user.coins < itemData.cost) {
        return res.status(400).json({
          status: 'error',
          message: 'Not enough coins to purchase this item',
        });
      }
      
      // Deduct coins
      user.coins -= itemData.cost;
      await user.save();
    }
    
    const item = await GardenItem.create(itemData);
    
    res.status(201).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update a garden item
 * @route PATCH /api/garden/:id
 */
exports.updateGardenItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    
    // Disallow changing cost after creation
    if (req.body.cost !== undefined) {
      delete req.body.cost;
    }
    
    const item = await GardenItem.findOneAndUpdate(
      {
        _id: itemId,
        user: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Garden item not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Delete a garden item
 * @route DELETE /api/garden/:id
 */
exports.deleteGardenItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    
    const item = await GardenItem.findOneAndDelete({
      _id: itemId,
      user: req.user._id,
    });
    
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Garden item not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Garden item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update the growth stage of a garden item
 * @route PATCH /api/garden/:id/grow
 */
exports.growItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { incrementBy = 1 } = req.body;
    
    const item = await GardenItem.findOne({
      _id: itemId,
      user: req.user._id,
    });
    
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Garden item not found',
      });
    }
    
    // Update growth progress
    item.growthProgress += incrementBy * 20; // 20% per growth increment
    
    // Check if growth progress reaches 100%
    if (item.growthProgress >= 100) {
      item.growthStage += Math.floor(item.growthProgress / 100);
      item.growthProgress %= 100;
    }
    
    // Cap growth stage at max (5)
    if (item.growthStage > 5) {
      item.growthStage = 5;
      item.growthProgress = 100;
    }
    
    // Update last watered timestamp
    item.lastWatered = new Date();
    
    await item.save();
    
    res.status(200).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get garden statistics
 * @route GET /api/garden/stats
 */
exports.getGardenStats = async (req, res) => {
  try {
    const stats = await GardenItem.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalFullyGrown: { 
          $sum: { $cond: [{ $eq: ['$growthStage', 5] }, 1, 0] }
        },
        totalValue: { $sum: '$cost' },
        itemsByType: {
          $push: {
            type: '$type',
            growthStage: '$growthStage',
          }
        }
      }},
    ]);
    
    // Process items by type
    let typeStats = {};
    if (stats.length > 0 && stats[0].itemsByType) {
      stats[0].itemsByType.forEach(item => {
        if (!typeStats[item.type]) {
          typeStats[item.type] = {
            count: 0,
            fullyGrown: 0
          };
        }
        
        typeStats[item.type].count++;
        if (item.growthStage === 5) {
          typeStats[item.type].fullyGrown++;
        }
      });
      
      delete stats[0].itemsByType;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        summary: stats.length > 0 ? {
          ...stats[0],
          _id: undefined,
        } : {
          totalItems: 0,
          totalFullyGrown: 0,
          totalValue: 0,
        },
        typeStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}; 