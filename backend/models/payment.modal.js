const mongoose = require('mongoose');
const { schema } = require('./Sale');

const PaymentSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  LeadBy: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  emailId: { type: String, required: true },
  address: { type: String, required: true },
  websiteUrl: { type: String },
  callStatus: { type: String },
  meetingDate: { type: Date },
  meetingTime: { type: String },
  contactPerson: { type: String },
  designation: { type: String },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  paymentStatus: { type: String, enum: ['Payment Received', 'Payment Pending'], default: 'Payment Pending' }, // Add payment status
});

module.exports = mongoose.model('payment', PaymentSchema)
