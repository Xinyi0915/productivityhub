const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token for a user
 */
const generateToken = (id) => {
  // Use a default secret if JWT_SECRET is not defined in environment variables
  const secret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  
  return jwt.sign({ id }, secret, {
    expiresIn: expiresIn,
  });
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user with email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email or username already in use',
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    // Return user info without password
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      coins: user.coins,
    };

    res.status(201).json({
      status: 'success',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password',
      });
    }

    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user info without password
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      coins: user.coins,
    };

    res.status(200).json({
      status: 'success',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        coins: user.coins,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Create an admin user (protected route)
 * @route POST /api/auth/create-admin
 */
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user with email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email or username already in use',
      });
    }

    // Create new admin user
    const user = await User.create({
      username,
      email,
      password,
      role: 'admin', // Set role to admin
    });

    // Generate token
    const token = generateToken(user._id);

    // Return user info without password
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      coins: user.coins,
    };

    res.status(201).json({
      status: 'success',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Create the first admin user (one-time use)
 * @route POST /api/auth/create-first-admin
 */
exports.createFirstAdmin = async (req, res) => {
  try {
    // Check if any admin users already exist
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin user already exists. Use the create-admin endpoint instead.',
      });
    }
    
    const { username, email, password } = req.body;

    // Check if user with email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email or username already in use',
      });
    }

    // Create first admin user
    const user = await User.create({
      username,
      email,
      password,
      role: 'admin', // Set role to admin
    });

    // Generate token
    const token = generateToken(user._id);

    // Return user info without password
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      coins: user.coins,
    };

    res.status(201).json({
      status: 'success',
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
}; 