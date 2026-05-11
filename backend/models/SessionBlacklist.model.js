const mongoose = require('mongoose');

const SessionBlacklistSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: MongoDB auto-deletes documents when expiresAt is reached
// expireAfterSeconds: 0 means the document is deleted at the expiresAt time
SessionBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SessionBlacklist', SessionBlacklistSchema);
