const net = require('net');
const isCidr = require('is-cidr');
const IpWhitelist = require('../models/IpWhitelist.model');
const LoginAuditLog = require('../models/LoginAuditLog.model');
const SessionBlacklist = require('../models/SessionBlacklist.model');

// ---------------------------------------------------------------------------
// Helper: validate that a string is a valid IPv4, IPv6, or CIDR range
// ---------------------------------------------------------------------------
function isValidIpOrCidr(value) {
  return net.isIP(value) !== 0 || isCidr(value) > 0;
}

// ---------------------------------------------------------------------------
// Task 6.1 — Whitelist CRUD
// ---------------------------------------------------------------------------

/**
 * POST /api/security/whitelist
 * Add a new IP address or CIDR range to the whitelist.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
const addWhitelistEntry = async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip || !isValidIpOrCidr(ip.trim())) {
      return res.status(400).json({ message: 'Invalid IP address or CIDR range' });
    }

    const entry = await IpWhitelist.create({
      ip: ip.trim(),
      addedBy: req.user._id,
    });

    return res.status(201).json({ message: 'IP address added to whitelist', entry });
  } catch (err) {
    // MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ message: 'IP address already exists in whitelist' });
    }
    console.error('addWhitelistEntry error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/security/whitelist
 * Return all whitelist entries.
 * Requirements: 1.1
 */
const getWhitelist = async (req, res) => {
  try {
    const entries = await IpWhitelist.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ entries });
  } catch (err) {
    console.error('getWhitelist error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * DELETE /api/security/whitelist/:id
 * Remove a whitelist entry by its MongoDB _id.
 * Requirements: 1.5
 */
const removeWhitelistEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await IpWhitelist.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Whitelist entry not found' });
    }

    return res.status(200).json({ message: 'Whitelist entry removed' });
  } catch (err) {
    console.error('removeWhitelistEntry error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// Task 6.2 — Audit log query
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

/**
 * GET /api/security/audit-logs
 * Return paginated, filtered audit log entries.
 * Query params: startDate, endDate, status, userId, page (default 1)
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7
 */
const getAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, status, userId } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    // Build filter object
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    const skip = (page - 1) * PAGE_SIZE;

    const [logs, total] = await Promise.all([
      LoginAuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .populate('userId', 'firstName lastName email'),
      LoginAuditLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return res.status(200).json({ logs, total, page, totalPages });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// Task 6.3 — Force logout
// ---------------------------------------------------------------------------

/**
 * POST /api/security/force-logout/:userId
 * Immediately invalidate all active sessions for the target HR user.
 * Uses a sentinel JTI pattern so authMiddleware can detect the force-logout
 * without needing to enumerate individual tokens.
 * Requirements: 5.1, 5.3, 5.4
 */
const forceLogout = async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // now + 12h

    const sentinelJti = `force_logout:${userId}:${now.getTime()}`;

    await SessionBlacklist.create({
      jti: sentinelJti,
      userId,
      expiresAt,
    });

    // Fetch HR user's email for the audit log
    const User = require('../models/User');
    const targetUser = await User.findById(userId).select('email').lean();

    // Write audit log entry (fire-and-forget)
    LoginAuditLog.create({
      status: 'force_logout',
      userId,
      email: targetUser?.email || 'unknown',
      ip: req.ip || req.socket?.remoteAddress || 'unknown',
      performedBy: req.user._id,
    }).catch((auditErr) => {
      console.error('forceLogout audit log write failed:', auditErr);
    });

    return res.status(200).json({ message: 'User session has been terminated' });
  } catch (err) {
    console.error('forceLogout error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// Active Sessions — who is currently logged in
// ---------------------------------------------------------------------------

/**
 * GET /api/security/active-sessions
 * Returns users who have a recent successful login with no subsequent
 * logout or force_logout. "Recent" = within the last 10 hours (token TTL).
 */
const getActiveSessions = async (req, res) => {
  try {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);

    // Get all successful logins in the last 10 hours
    const recentLogins = await LoginAuditLog.find({
      status: 'success',
      createdAt: { $gte: tenHoursAgo },
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email role')
      .lean();

    // Get all userIds that have logged out or been force-logged-out since their last login
    const loggedOutUserIds = new Set(
      (await LoginAuditLog.find({
        status: { $in: ['logout', 'force_logout'] },
        createdAt: { $gte: tenHoursAgo },
      }).lean()).map(l => l.userId?.toString()).filter(Boolean)
    );

    // Deduplicate: keep only the most recent login per user, exclude logged-out users
    const seen = new Set();
    const activeSessions = [];

    for (const log of recentLogins) {
      const uid = log.userId?._id?.toString() || log.userId?.toString();
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      if (loggedOutUserIds.has(uid)) continue; // already logged out
      activeSessions.push({
        logId:     log._id,
        userId:    log.userId,
        email:     log.email,
        ip:        log.ip,
        deviceInfo:log.deviceInfo,
        loginAt:   log.createdAt,
        minutesAgo: Math.floor((Date.now() - new Date(log.createdAt).getTime()) / 60000),
      });
    }

    return res.status(200).json({ activeSessions, count: activeSessions.length });
  } catch (err) {
    console.error('getActiveSessions error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  isValidIpOrCidr,
  addWhitelistEntry,
  getWhitelist,
  removeWhitelistEntry,
  getAuditLogs,
  forceLogout,
  getActiveSessions,
};
