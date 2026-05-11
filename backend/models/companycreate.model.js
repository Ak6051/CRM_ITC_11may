const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    branchName:    { type: String, required: true, trim: true },
    branchAddress: { type: String, trim: true, default: '' },
    area:          { type: String, trim: true, default: '' },
    city:          { type: String, trim: true, default: '' },
    state:         { type: String, trim: true, default: '' },
    country:       { type: String, trim: true, default: '' },
    pincode:       { type: String, trim: true, default: '' },
    // ── Contact Person 1 ──────────────────────────────────────────────────────
    contactPerson: { type: String, trim: true, default: '' },
    contactPersonDesignation: { type: String, trim: true, default: '' },
    contactNumber: { type: String, trim: true, default: '' },
    email:         { type: String, trim: true, default: '' },
    // ── Contact Person 2 ──────────────────────────────────────────────────────
    contactPerson2: { type: String, trim: true, default: '' },
    contactPerson2Designation: { type: String, trim: true, default: '' },
    contactNumber2: { type: String, trim: true, default: '' },
    email2:         { type: String, trim: true, default: '' },
    // ──────────────────────────────────────────────────────────────────────────
    websiteUrl:    { type: String, trim: true, default: '' },
    gpsLocation:   { type: String, trim: true, default: '' },
    // ── Documents ──────────────────────────────────────────────────────────
    gstUpload:           { type: String, default: '' },
    agreementUpload:     { type: String, default: '' },
    agreementStartDate:  { type: Date,   default: null },
    agreementEndDate:    { type: Date,   default: null },
    otherDocumentUpload: { type: String, default: '' },
    // ── Payment ────────────────────────────────────────────────────────────
    invoiceNumber: { type: String, trim: true, default: '' },
    paymentMode:   { type: String, enum: ['Cash', 'Bank', 'Other', ''], default: '' },
    paymentRemark: { type: String, trim: true, default: '' },
    tokenAmount:   { type: Number, default: null },
    tokenUpload:   { type: String, default: '' },
  },
  { _id: true, timestamps: true }
);

const companyCreateSchema = new mongoose.Schema(
  {
    companyId:      { type: Number, unique: true },          // auto-assigned from 1001
    companyName:    { type: String, required: true, trim: true },
    industries:     { type: String, trim: true, default: '' },
    companyAddress: { type: String, trim: true, default: '' },
    area:           { type: String, trim: true, default: '' },
    city:           { type: String, trim: true, default: '' },
    state:          { type: String, trim: true, default: '' },
    country:        { type: String, trim: true, default: '' },
    pincode:        { type: String, trim: true, default: '' },
    // ── Contact Person 1 ──────────────────────────────────────────────────────
    contactPerson:  { type: String, trim: true, default: '' },
    contactPersonDesignation: { type: String, trim: true, default: '' },
    contactNumber:  { type: String, trim: true, default: '' },
    email:          { type: String, trim: true, default: '' },
    // ── Contact Person 2 ──────────────────────────────────────────────────────
    contactPerson2: { type: String, trim: true, default: '' },
    contactPerson2Designation: { type: String, trim: true, default: '' },
    contactNumber2: { type: String, trim: true, default: '' },
    email2:         { type: String, trim: true, default: '' },
    // ──────────────────────────────────────────────────────────────────────────
    websiteUrl:     { type: String, trim: true, default: '' },
    gpsLocation:    { type: String, trim: true, default: '' },
    // ── Documents ─────────────────────────────────────────────────────────────
    gstUpload:             { type: String, default: '' },
    agreementUpload:       { type: String, default: '' },
    agreementStartDate:    { type: Date,   default: null },
    agreementEndDate:      { type: Date,   default: null },
    otherDocumentUpload:   { type: String, default: '' },
    // ── Payment ───────────────────────────────────────────────────────────────
    invoiceNumber:  { type: String, trim: true, default: '' },
    paymentMode:    { type: String, enum: ['Cash', 'Bank', 'Other', ''], default: '' },
    paymentRemark:  { type: String, trim: true, default: '' },
    tokenAmount:    { type: Number, default: null },
    tokenUpload:    { type: String, default: '' },
    branches:       { type: [branchSchema], default: [] },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-increment companyId starting from 1001
companyCreateSchema.pre('save', async function (next) {
  if (this.isNew && !this.companyId) {
    const last = await this.constructor.findOne({}, {}, { sort: { companyId: -1 } });
    this.companyId = last && last.companyId ? last.companyId + 1 : 1001;
  }
  next();
});

// Guard against model re-registration on hot-reload
module.exports = mongoose.models.CompanyCreate
  || mongoose.model('CompanyCreate', companyCreateSchema);
