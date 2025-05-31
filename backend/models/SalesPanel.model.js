const mongoose = require('mongoose');

const salesPanelSchema = new mongoose.Schema(
  {
    industries: { type: String, required: false },
    companyName: { type: String, required: false },
    companyId: { type: Number, required: true },
    companyAddress: { type: String, required: false },
    contactName: { type: String, required: false },
    email: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    response: { type: String, required: false },
    jobTitle: { type: String, required: false },
    benefits: { type: String, required: false },
    numberOfRequirements: { type: Number, required: false },
    websiteURL: { type: String, required: false },
    keyResponsibility: { type: String, required: false },
    requiredSkills: { type: String, required: false },
    education: { type: String, required: false },
    experience: { type: String, required: false },
    salary: { type: String, required: false },
    jobLocation: { type: String, required: false },
    remarks: { type: String, required: false },
    agreementSigned: { type: String, required: false },
    description: { type: String, required: false },
    descriptionFile: { type: String, required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const salesPanel = mongoose.model('salesPanel', salesPanelSchema);
module.exports = salesPanel;