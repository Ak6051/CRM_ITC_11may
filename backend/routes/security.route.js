const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  addWhitelistEntry,
  getWhitelist,
  removeWhitelistEntry,
  getAuditLogs,
  forceLogout,
  getActiveSessions,
} = require('../controllers/securityController');

const router = express.Router();

/**
 * Middleware that restricts access to admin users only.
 * Must be used after authMiddleware (which populates req.user).
 * Requirements: 1.1, 4.1, 5.3
 */
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admins only.' });
}

// Apply authMiddleware and adminOnly to all routes in this router
router.use(authMiddleware, adminOnly);

// Whitelist management — Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
router.post('/whitelist', addWhitelistEntry);
router.get('/whitelist', getWhitelist);
router.delete('/whitelist/:id', removeWhitelistEntry);

// Audit log query — Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7
router.get('/audit-logs', getAuditLogs);

// Force logout — Requirements: 5.1, 5.3, 5.4
router.post('/force-logout/:userId', forceLogout);

// Active sessions — who is currently logged in
router.get('/active-sessions', getActiveSessions);

module.exports = router;
