const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SessionBlacklist = require("../models/SessionBlacklist.model");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if this token's JTI has been blacklisted (force logout)
    if (decoded.jti) {
      const blacklisted = await SessionBlacklist.findOne({ jti: decoded.jti });
      if (blacklisted) {
        return res.status(401).json({ message: "Session has been terminated by an administrator" });
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
          return res.status(401).json({ message: "Session has been terminated by an administrator" });
        }
      } catch (sentinelErr) {
        console.error('[verifyToken] Sentinel check error:', sentinelErr.message);
      }
    }

    // Fetch the user from database and exclude password
    // Support both old token format (userId) and new format (_id)
    req.user = await User.findById(decoded._id || decoded.userId).select("-password");
    
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { verifyToken };
