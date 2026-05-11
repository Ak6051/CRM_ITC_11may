// models/RescheduledMeeting.js

const mongoose = require('mongoose');

const rescheduledMeetingSchema = new mongoose.Schema(
  {
    salesId: { type: mongoose.Schema.Types.ObjectId, ref: 'salesPanel', required: true },
    newDate: { type: Date, required: true },
    reason: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RescheduledMeeting', rescheduledMeetingSchema);
