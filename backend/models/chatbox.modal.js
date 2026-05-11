// models/Message.js
const mongoose = require('mongoose');

const chatBoxSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['admin', 'HR', 'Sales'] }, // NEW!
  message: { type: String },
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatBox', chatBoxSchema);
