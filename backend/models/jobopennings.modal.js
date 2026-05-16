const mongoose = require('mongoose');

const jobOpeningsSchema = new mongoose.Schema(
  {
    // ── Company (from CompanyCreate model) ──────────────────────────────────
    companyName: { type: String, required: false },
    companyId:   { type: Number, required: true },

    // ── Branch (optional, from CompanyCreate.branches) ──────────────────────
    branchId:    { type: String, required: false },   // branch subdoc _id as string
    branchName:  { type: String, required: false },

    // ── Legacy company-detail fields (kept for old data) ────────────────────
    industries:     { type: String, required: false },
    companyAddress: { type: String, required: false },
    Area:           { type: String, required: false },
    contactName:    { type: String, required: false },
    email:          { type: String, required: false },
    phoneNumber:    { type: String, required: false },
    websiteURL:     { type: String, required: false },
    agreementSigned:{ type: String, required: false },
    gstUpload:      { type: String, required: false },

    // ── Job-specific fields ──────────────────────────────────────────────────
    jobTitle:             { type: String, required: false },
    jobLocation:          { type: String, required: false },
    numberOfRequirements: { type: Number, required: false },
    jobTiming:            { type: String, required: false },
    education:            { type: String, required: false },
    gender:               { type: String, required: false },
    salary:               { type: String, required: false },
    experience:           { type: String, required: false },
    requiredSkills:       { type: String, required: false },
    keyResponsibility:    { type: String, required: false },
    benefits:             { type: String, required: false },
    response:             { type: String, required: false },
    descriptionFile:      { type: String, required: false },
    remarks:              { type: String, required: false },
    weekOff:              { type: String, required: false },

    jobStatus: {
      type: String,
      enum: ['Open', 'Closed', 'OnHold'],
      default: 'Open',
    },
    holdReason: { type: String, default: '' }, // reason when jobStatus = 'OnHold'

    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedHR: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }],
    assignedTL: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }],

    convertedAt:  { type: Date, required: false },
    originalJobId:{ type: mongoose.Schema.Types.ObjectId, ref: 'salesPanel', required: false },
    startDate:    { type: Date },
    endDate:      { type: Date },
    completionDate:{ type: Date },
    lateByDays:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

const JobOpenings = mongoose.model('JobOpenings', jobOpeningsSchema);
module.exports = JobOpenings;
