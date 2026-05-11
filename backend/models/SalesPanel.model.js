const mongoose = require('mongoose');

const salesPanelSchema = new mongoose.Schema(
  {
    // ── Company (from CompanyCreate model) ────────────────────────────────────
    companyName: { type: String, required: false },
    companyId:   { type: Number, required: true },
    branchId:    { type: String, required: false },
    branchName:  { type: String, required: false },

    // ── Legacy fields (kept for old data) ─────────────────────────────────────
    industries:     { type: String, required: false },
    companyAddress: { type: String, required: false },
    contactName:    { type: String, required: false },
    email:          { type: String, required: false },
    phoneNumber:    { type: String, required: false },
    websiteURL:     { type: String, required: false },
    agreementSigned:{ type: String, required: false },

    // ── Job-specific fields ───────────────────────────────────────────────────
    response:             { type: String, required: false },
    jobTitle:             { type: String, required: false },
    benefits:             { type: String, required: false },
    numberOfRequirements: { type: Number, required: false },
    keyResponsibility:    { type: String, required: false },
    requiredSkills:       { type: String, required: false },
    education:            { type: String, required: false },
    experience:           { type: String, required: false },
    salary:               { type: String, required: false },
    jobLocation:          { type: String, required: false },
    jobTiming:            { type: String, required: false },
    gender:               { type: String, required: false },
    remarks:              { type: String, required: false },
    reminderDate:         { type: Date },
    descriptionFile:      { type: String, required: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const salesPanel = mongoose.model('salesPanel', salesPanelSchema);
module.exports = salesPanel;