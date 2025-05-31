const mongoose = require("mongoose");

const convertSourceDataSchema = new mongoose.Schema({
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  candidatePhone: { type: String, required: true },
  qualification: { type: String, required: true },
  remark: { type: String, required: true },
  resumeLink: { type: String, required: false },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "ConvertedJob", required: true },

    // New fields for manual entry
    interviewDate:{ type: Date, required: false },
    lineupStatus:{ type: String, required: false },
    joiningDate:{ type: Date, required: false },
    candidateRemarks: { type: String, required: false },

    billingDate: { type: Date, required: false },
    billingAmount: { type: Number, required: false },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    paymentDate: { type: Date, required: false },
}, { timestamps: true });

const convertSourceData = mongoose.model("convertSourceData", convertSourceDataSchema);
module.exports = convertSourceData;
