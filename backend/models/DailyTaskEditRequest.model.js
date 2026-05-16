const mongoose = require('mongoose');

const dailyTaskEditRequestSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTask',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of proposed changes
  proposedChanges: {
    companyName: { type: String },
    position: { type: String },
    totalCall: { type: Number },
    profilesShared: { type: Number },
    interviewsScheduled: { type: Number },
    revenueGenerated: { type: Number },
    TCEOD: { type: String },
    PSEOD: { type: String },
    ISEOD: { type: String },
    RGEOD: { type: String },
    remarks: [{ type: String }]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNote: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyTaskEditRequest', dailyTaskEditRequestSchema);
