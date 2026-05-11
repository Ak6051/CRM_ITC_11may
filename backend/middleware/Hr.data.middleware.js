const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SessionBlacklist = require('../models/SessionBlacklist.model');

const protect = async (req, res, next) => {
  let token;

  // Check if token is present in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if this token's JTI has been blacklisted (force logout)
      if (decoded.jti) {
        const blacklisted = await SessionBlacklist.findOne({ jti: decoded.jti });
        if (blacklisted) {
          return res.status(401).json({ message: 'Session has been terminated by an administrator' });
        }
      }

      // Check for userId-level force-logout sentinel
      const uid = decoded._id || decoded.userId;
      if (uid) {
        try {
          const sentinelPrefix = `force_logout:${uid}:`;
          const forcedOut = await SessionBlacklist.findOne({
            jti: { $regex: `^${sentinelPrefix}` },
            expiresAt: { $gt: new Date() },
          });
          if (forcedOut) {
            return res.status(401).json({ message: 'Session has been terminated by an administrator' });
          }
        } catch (sentinelErr) {
          console.error('[protect] Sentinel check error:', sentinelErr.message);
        }
      }

      // Find user by ID from decoded token and exclude password from data
      // Support both old token format (userId) and new format (_id)
      req.user = await User.findById(decoded._id || decoded.userId).select('-password');

      // If user not found
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }

      next(); // Call next middleware or route handler
    } catch (error) {
      // Check for token expiration
      if (error.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json({ message: 'Token expired. Please login again.' });
      }

      // Log other token errors and return unauthorized error
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    // If no token found in headers
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
