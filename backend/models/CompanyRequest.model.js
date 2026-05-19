const mongoose = require('mongoose');

const companyRequestSchema = new mongoose.Schema(
  {
    // ── Request fields (same as CompanyCreate) ────────────────────────────────
    companyName:    { type: String, required: true, trim: true },
    industries:     { type: String, trim: true, default: '' },
    companyAddress: { type: String, trim: true, default: '' },
    area:           { type: String, trim: true, default: '' },
    city:           { type: String, trim: true, default: '' },
    state:          { type: String, trim: true, default: '' },   // NEW
    country:        { type: String, trim: true, default: '' },   // NEW
    pincode:        { type: String, trim: true, default: '' },   // NEW
    contactPerson:  { type: String, trim: true, default: '' },
    contactPersonDesignation: { type: String, trim: true, default: '' },
    contactNumber: { type: String, trim: true, default: '' },
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
    gstUpload:           { type: String, default: '' },   // S3 URL
    agreementUpload:     { type: String, default: '' },   // S3 URL
    agreementStartDate:  { type: Date,   default: null }, // NEW
    agreementEndDate:    { type: Date,   default: null }, // NEW
    otherDocumentUpload: { type: String, default: '' },   // S3 URL
    // ── Payment ───────────────────────────────────────────────────────────────
    invoiceNumber:  { type: String, trim: true, default: '' },   // NEW
    paymentMode:    { type: String, enum: ['Cash', 'Bank', 'Other', ''], default: '' }, // NEW
    paymentRemark:  { type: String, trim: true, default: '' },   // NEW
    tokenAmount:    { type: Number, default: null },
    tokenUpload:    { type: String, default: '' },   // S3 URL

    // ── Workflow ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Revoked'],
      default: 'Pending',
    },
    requestedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:   { type: Date, default: null },
    rejectReason: { type: String, default: '' },

    // ── After approval, link to created CompanyCreate doc ────────────────────
    createdCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyCreate', default: null },
    leadId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.CompanyRequest
  || mongoose.model('CompanyRequest', companyRequestSchema);
