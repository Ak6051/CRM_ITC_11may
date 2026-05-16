const ipRangeCheck = require('ip-range-check');
const IpWhitelist = require('../models/IpWhitelist.model');
const LoginAuditLog = require('../models/LoginAuditLog.model');

/**
 * Extracts the client IP address from the request.
 * Reads X-Forwarded-For first (proxy/load-balancer header),
 * falls back to the raw socket remote address.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
function extractClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const ip = req.socket.remoteAddress || '';
  // Normalize IPv6 loopback to IPv4 format
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  // Strip IPv6-mapped IPv4 prefix (e.g. ::ffff:192.168.1.1 → 192.168.1.1)
  if (ip.startsWith('::ffff:')) return ip.substring(7);
  return ip;
}

/**
 * Middleware that enforces IP whitelist restrictions for HR login attempts.
 *
 * Behaviour:
 *  - Non-HR roles (admin, Sales) bypass the check entirely.
 *  - If the whitelist is empty the check is skipped (open mode).
 *  - If the client IP is not in the whitelist the request is rejected with
 *    HTTP 403 and a blocked audit log entry is written.
 *  - If the client IP is in the whitelist, next() is called.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function ipWhitelistMiddleware(req, res, next) {
  const { email } = req.body;

  // If no email, we can't check role, but we should probably let the next handler handle validation
  if (!email) {
    return next();
  }

  // Find user to check role
  const User = require('../models/User');
  let user;
  try {
    user = await User.findOne({ email });
  } catch (err) {
    console.error('[ipWhitelistMiddleware] User lookup failed:', err);
    return next();
  }

  // Requirement 2.6 — bypass for non-HR roles (admin, Sales, etc.)
  // If user not found, let preLogin handle it
  if (!user || user.role !== 'HR') {
    return next();
  }

  // Requirement 2.1 — extract client IP before any OTP step
  const clientIp = extractClientIp(req);

  let whitelist;
  try {
    whitelist = await IpWhitelist.find({});
  } catch (err) {
    console.error('[ipWhitelistMiddleware] Failed to fetch whitelist:', err);
    // Fail open to avoid locking out all HR users on a DB error
    return next();
  }

  // Requirement 2.5 — empty whitelist means open access
  if (whitelist.length === 0) {
    return next();
  }

  // Requirement 2.2 — compare client IP against every whitelist entry
  const allowed = whitelist.some((entry) => ipRangeCheck(clientIp, entry.ip));

  if (!allowed) {
    // Requirement 2.4 — write blocked audit log entry
    try {
      await LoginAuditLog.create({
        status: 'blocked',
        email: req.body.email || '',
        ip: clientIp,
        deviceInfo: req.headers['user-agent'] || '',
      });
    } catch (logErr) {
      // Audit log failure must not block the 403 response
      console.error('[ipWhitelistMiddleware] Failed to write audit log:', logErr);
    }

    // Requirement 2.3 — return 403 with the specified message
    return res.status(403).json({ message: 'Login not allowed from this IP address' });
  }

  // IP is whitelisted — proceed to the next handler
  return next();
}

module.exports = { extractClientIp, ipWhitelistMiddleware };
