const mongoose = require('mongoose');

const interviewRoundSchema = new mongoose.Schema({
  roundName:         { type: String, default: 'Round 1' },
  roundDate:         { type: Date,   default: null },
  roundTime:         { type: String, default: '' },
  interviewMode:     { type: String, enum: ['Face To Face', 'Telephonic', 'Video Call', 'Other'], default: 'Face To Face' },
  interviewedByWhom: { type: String, default: '' },
}, { _id: false });

const candidateApplicationSchema = new mongoose.Schema(
  {
    // ── References ────────────────────────────────────────────────────────────
    candidateId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate',   required: true  },
    jobId:            { type: mongoose.Schema.Types.ObjectId, ref: 'JobOpenings',  required: true  },
    positionName:     { type: String, default: '' },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: false },
    // Snapshot of HR name at the time of creation — preserved even if User record changes
    createdByName:    { type: String, default: '' },

    // ── 1. Internal Interview Date ────────────────────────────────────────────
    internalInterviewDate: { type: Date, default: null },

    // ── 2. Interview By Whom (HR user ref) ────────────────────────────────────
    interviewByWhom: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ── 3. Candidate Review ───────────────────────────────────────────────────
    candidateReview: { type: String, enum: ['Green', 'Yellow', 'Red', ''], default: '' },

    // ── 4. Candidate Remarks ──────────────────────────────────────────────────
    candidateRemark: { type: String, default: '' },

    // ── 5. Resume Submit Date ─────────────────────────────────────────────────
    resumeSubmitDate: { type: Date, default: null },

    // ── 6. Lineup Status ──────────────────────────────────────────────────────
    lineupStatus: { type: String, default: '' },

    // ── 7. Remarks 1 ──────────────────────────────────────────────────────────
    remarks1: { type: String, default: '' },

    // ── 8. Interview Rounds (default 1 round) ─────────────────────────────────
    interviewRounds: { type: [interviewRoundSchema], default: [{}] },

    // ── 9. Interview Status + Trail Days ──────────────────────────────────────
    interviewStatus: {
      type: String,
      enum: ['On Discussion', 'Selected', 'On Hold', 'Trail', 'Rejected', ''],
      default: '',
    },
    trailDays: { type: Number, default: null }, // active only when interviewStatus = 'Trail'

    // ── 10. Remarks 2 (active when On Hold or Rejected) ───────────────────────
    remarks2: { type: String, default: '' },

    // ── 11. Offered Salary ────────────────────────────────────────────────────
    offeredSalary: { type: String, default: '' },

    // ── 12. Offered Status ────────────────────────────────────────────────────
    offeredStatus: { type: String, enum: ['Accepted', 'Rejected', ''], default: '' },

    // ── 13. Remarks 3 (active when Offered Status = Rejected) ────────────────
    remarks3: { type: String, default: '' },

    // ── 14. Joining Date Status ───────────────────────────────────────────────
    joiningDateStatus: { type: String, default: '' },

    // ── 15. Joining Date ──────────────────────────────────────────────────────
    joiningDate: { type: Date, default: null },

    // ── 16. Has Joined ────────────────────────────────────────────────────────
    hasJoined: { type: String, default: '' },

    // ── Legacy / system fields (kept for backward compat) ────────────────────
    interviewDate:         { type: Date,   default: null },
    originalInterviewDate: { type: Date,   default: null },
    selectionStatus:       { type: String, enum: ['Accepted', 'Rejected', ''], default: '' },
    selectionDate:         { type: Date,   default: null },
    salaryOffered:         { type: String, default: '' },
    offerLetter:           { type: String, default: '' },
    offerStatus:           { type: String, default: '' },
    candidateRemarks:      { type: String, default: '' },
    candidateAgreement:    { type: String, default: '' },
    rescheduledDates: [{
      date:   { type: Date,   required: true },
      reason: { type: String, default: '' },
    }],
    billingDate:    { type: Date,   default: null },
    billingAmount:  { type: String, default: '' },
    paymentStatus:  { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    paymentDate:    { type: Date,   default: null },
    paymentMode:    { type: String, default: '' },
    paymentRemark:  { type: String, default: '' },
    isBackout:      { type: Boolean, default: false },
    backoutReason:  { type: String, default: '' },
    backoutAt:      { type: Date,   default: null },
    assignedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt:     { type: Date,   default: null },
  },
  { timestamps: true }
);

candidateApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
candidateApplicationSchema.index({ candidateId: 1 });
candidateApplicationSchema.index({ jobId: 1 });
candidateApplicationSchema.index({ createdBy: 1, createdAt: -1 });

const CandidateApplication = mongoose.model('CandidateApplication', candidateApplicationSchema);
module.exports = CandidateApplication;
