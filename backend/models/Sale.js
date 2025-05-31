const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  companyName: { type: String, required: true },
  numberOfRequirements: { type: Number, required: true },
  salary: { type: String, required: true },
  experience: { type: String, required: true },
  jobLocation: { type: String, required: true },
  description: { type: String, required: true },
  assignedHR: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startDate: { type: [Date], default: [] },
  latestStartDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  jobStatus: {
    type: String,
    enum: ["Open", "Closed"], // Sirf 'Open' aur 'Closed' allowed honge
    default: "Open",
  },
  endDate:{type:Date },
  paymentStatus: { type: String, enum: ['Payment Received', 'Payment Pending'] }, // Add payment status

});

const Sale = mongoose.model("Sale", saleSchema);

module.exports = Sale;
