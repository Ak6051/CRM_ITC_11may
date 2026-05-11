const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  candidateName:     { type: String, required: false },
  candidateEmail:    { type: String, required: true  },
  candidatePhone:    { type: String, required: false },
  qualification:     { type: String, required: false },
  positionName:      { type: String, required: false },
  experience:        { type: String, required: false },
  currentLocation:   { type: String, required: false },
  preferredLocation: { type: String, required: false },
  currentPosition:   { type: String, required: false },
  currentCTC:        { type: String, required: false },
  expectedCTC:       { type: String, required: false },
  noticePeriod:      { type: String, required: false },
  reasonforLeaving:  { type: String, required: false },
  currentCompany:    { type: String, required: false },
  industry:          { type: String, required: false },
  remark:            { type: String, required: false },
  resumeLink:        { type: String, required: false },
  candidateAgreement:{ type: String, required: false },

  jobId:    { type: mongoose.Schema.Types.ObjectId, ref: "JobOpenings", required: false },
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User",        required: false },

  // ── Admin / HR assignment ─────────────────────────────────────────────────
  assignedTo:       { type: mongoose.Schema.Types.ObjectId, ref: "User",        required: false },
  assignedPosition: { type: mongoose.Schema.Types.ObjectId, ref: "JobOpenings", required: false },
  assignedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User",        required: false },
  assignedAt:       { type: Date, required: false },

}, { timestamps: true });

const Candidate = mongoose.model("Candidate", candidateSchema);

// Indexes for fast aggregation queries
candidateSchema.index({ createdBy: 1, createdAt: -1 });
candidateSchema.index({ createdAt: -1 });
candidateSchema.index({ candidateName: 1 });
candidateSchema.index({ currentLocation: 1 });
candidateSchema.index({ positionName: 1 });

module.exports = Candidate;
