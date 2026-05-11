// models/reminder.model.js
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salesPanelId: { type: mongoose.Schema.Types.ObjectId, ref: 'salesPanel'},
  message: { type: String, required: true },
  remindAt: { type: Date, required: true },
  remindUntil: { type: Date, required: true },
  isShown: { type: Boolean, default: false },
  remindRepeat: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
