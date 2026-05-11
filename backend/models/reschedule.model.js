const mongoose = require("mongoose");

const rescheduleSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  newDate: { type: Date, required: true },
  reason: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: String }, // Added to ensure uniqueness of reschedule entries
}, { timestamps: true });

const Reschedule = mongoose.model("Reschedule", rescheduleSchema);
module.exports = Reschedule;
