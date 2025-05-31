const mongoose = require("mongoose");

const rescheduleSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  newDate: { type: Date, required: true },
  reason: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const Reschedule = mongoose.model("Reschedule", rescheduleSchema);
module.exports = Reschedule;
