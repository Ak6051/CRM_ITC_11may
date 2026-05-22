const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    hrId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    position:    { type: String, required: true },   // position the HR is calling for
    calledAt:    { type: Date,   default: Date.now }, // exact timestamp of the call
  },
  { timestamps: true }
);

// Prevent duplicate logs: same HR + candidate + position on the same calendar day
callLogSchema.index({ hrId: 1, candidateId: 1, position: 1, calledAt: 1 });

// Fast lookup by hrId + position + date range (used in TCEOD count)
callLogSchema.index({ hrId: 1, position: 1, calledAt: 1 });

module.exports = mongoose.model('CallLog', callLogSchema);
