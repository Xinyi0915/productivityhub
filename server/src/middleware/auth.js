const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes that require authentication
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access',
      });
    }

    // 2) Verify token with default secret if JWT_SECRET is not defined
    const secret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
    const decoded = jwt.verify(token, secret);

    // 3) Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists',
      });
    }

    // 4) Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to restrict access to admin users only
 */
exports.restrictTo = (role) => {
  return (req, res, next) => {
    // Check if user role matches the required role
    if (req.user.role !== role) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

/**
 * Middleware to check if user is owner of the resource or an admin
 */
exports.isOwnerOrAdmin = (model) => {
  return async (req, res, next) => {
    try {
      // Get the resource
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: 'Resource not found',
        });
      }
      
      // Check if user is owner or admin
      const isOwner = resource.user && resource.user.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to perform this action',
        });
      }
      
      // Add resource to request for later use
      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  };
}; 