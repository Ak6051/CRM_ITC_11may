// models/reminder.model.js
const mongoose = require('mongoose');

const candidateReminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }, // 🆕
  message: { type: String, required: true },
  remindAt: { type: Date, required: true },
  isShown: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CandidateReminder', candidateReminderSchema);
