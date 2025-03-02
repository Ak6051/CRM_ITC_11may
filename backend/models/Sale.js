const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  LeadBy: { type: String, required: true },
  companyName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  emailId: { type: String, required: true },
  callStatus: { type: String, required: true },
  meetingDate: { type: Date },
  meetingTime: { type: String },
  contactPerson: { type: String, required: true },
  designation: { type: String, required: true },
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
