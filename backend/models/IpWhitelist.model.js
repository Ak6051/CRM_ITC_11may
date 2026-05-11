const mongoose = require('mongoose');

const IpWhitelistSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Validated against IPv4, IPv6, or CIDR regex in the controller
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('IpWhitelist', IpWhitelistSchema);
