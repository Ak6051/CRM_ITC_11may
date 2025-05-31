

// const mongoose = require('mongoose');

// const convertedJobSchema = new mongoose.Schema({
//   industries: String,
//   companyName: String,
//   companyAddress: String,
//   contactName: String,
//   phoneNumber: String,
//   websiteURL: String,
//   email: String,
//   numberOfRequirements: String,
//   agreementSigned: String,
//   description: String,
//   jobLocation: String,
//   remarks: String,
//   convertedAt: Date,
//   assignedHR: { type: mongoose.Schema.Types.ObjectId, ref: "User", require:false},
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',  // Assuming your User model is named 'User'
//     required: true,
//   }
// });

// module.exports = mongoose.model('ConvertedJob', convertedJobSchema);

 const mongoose = require('mongoose');

const convertedJobSchema = new mongoose.Schema({
  industries: String,
  companyName: String,
  companyAddress: String,
  contactName: String,
  phoneNumber: String,
  websiteURL: String,
  email: String,
  numberOfRequirements: String,
  agreementSigned: String,
  description: String,
  jobLocation: String,
  remarks: String,
  convertedAt: Date,
  assignedHR: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  startDate: Date,
  endDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
   originalJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'salesPanel',
    required: true,
    unique: true  // Prevents duplicate convert
  },
  
});
module.exports = mongoose.model('ConvertedJob', convertedJobSchema);
