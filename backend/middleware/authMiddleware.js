const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require("../models/User");
const SessionBlacklist = require("../models/SessionBlacklist.model");

const generateAccessToken = (user) => {
  return jwt.sign({
    _id: user._id,
    role: user.role,
    jti: uuidv4(), // Unique token identifier for session blacklisting
  }, process.env.JWT_SECRET, {
    expiresIn: '12h' // Token expires in 12 hours
  });
};

const authMiddleware = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if this token's JTI has been blacklisted (individual token force logout)
    if (decoded.jti) {
      const blacklisted = await SessionBlacklist.findOne({ jti: decoded.jti });
      if (blacklisted) {
        return res.status(401).json({ message: "Session has been terminated by an administrator" });
      }
    }

    // Check for a userId-level force-logout sentinel entry.
    // forceLogout writes a sentinel JTI of the form `force_logout:{userId}:{timestamp}`.
    // We look for any such entry that is still active (expiresAt > now).
    if (decoded._id || decoded.userId) {
      try {
        const uid = String(decoded._id || decoded.userId);
        const sentinelPrefix = `force_logout:${uid}:`;
        const forcedOut = await SessionBlacklist.findOne({
          jti: { $regex: `^${sentinelPrefix}` },
          expiresAt: { $gt: new Date() },
        });
        if (forcedOut) {
          return res.status(401).json({ message: "Session has been terminated by an administrator" });
        }
      } catch (sentinelErr) {
        // Non-fatal: if the sentinel check fails, allow the request to proceed
        console.error('[authMiddleware] Sentinel check error:', sentinelErr.message);
      }
    }

    const user = await User.findById(decoded._id || decoded.userId).select("-password");
    
    if (!user) {
      console.error('[authMiddleware] User not found for decoded token:', { 
        _id: decoded._id, 
        userId: decoded.userId,
        role: decoded.role 
      });
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token failed", error: error.message });
  }
};

module.exports = authMiddleware;
module.exports.generateAccessToken = generateAccessToken;
