const mongoose = require('mongoose');

const LoginAuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for blocked attempts where user may not exist
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'HR',
  },
  ip: {
    type: String,
    required: true,
  },
  deviceInfo: {
    type: String,
    default: '', // User-Agent header
  },
  status: {
    type: String,
    enum: ['success', 'blocked', 'failed', 'force_logout', 'logout'],
    required: true,
  },
  // Populated only for force_logout entries
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Populated when HR voluntarily logs out — timestamp of logout
  logoutAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: entries eligible for deletion after 90 days (7776000 seconds)
LoginAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Query performance indexes
LoginAuditLogSchema.index({ status: 1 });
LoginAuditLogSchema.index({ userId: 1 });
LoginAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LoginAuditLog', LoginAuditLogSchema);
