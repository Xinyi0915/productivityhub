const User = require('../models/User');

/**
 * Update user profile
 * @route PATCH /api/users/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user._id;

    // Check if username or email exists for another user
    if (username || email) {
      const existingUser = await User.findOne({
        $or: [
          { username, _id: { $ne: userId } },
          { email, _id: { $ne: userId } },
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Username or email already in use',
        });
      }
    }

    // Fields to update
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run validators on update
    });

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        coins: updatedUser.coins,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update user password
 * @route PATCH /api/users/password
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update user coins
 * @route PATCH /api/users/coins
 */
exports.updateCoins = async (req, res) => {
  try {
    const { coins } = req.body;
    const userId = req.user._id;

    // Validate coins
    if (typeof coins !== 'number' || coins < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Coins must be a positive number',
      });
    }

    // Update user's coins
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { coins },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        coins: updatedUser.coins,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
}; 