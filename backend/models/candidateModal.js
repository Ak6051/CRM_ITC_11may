const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  candidateName: { type: String, required: false },
  candidateEmail: { type: String, required: false },
  candidatePhone: { type: String, required: false },
  qualification: { type: String, required: false },
  remark: { type: String, required: false },
  resumeLink: { type: String, required: false },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "JobOpenings", required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    // New fields for manual entry
    interviewDate:{ type: Date, required: false },
    lineupStatus:{ type: String, required: false },
    joiningDate:{ type: Date, required: false },
    candidateRemarks: { type: String, required: false },
    rescheduledDates: [{ 
      date: { type: Date, required: true },
      reason: { type: String, required: false }
    }],

    billingDate: { type: Date, required: false },
    billingAmount: { type: Number, required: false },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    paymentDate: { type: Date, required: false },
}, { timestamps: true });

const Candidate = mongoose.model("Candidate", candidateSchema);
module.exports = Candidate;
