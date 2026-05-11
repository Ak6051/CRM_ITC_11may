const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    // ── Basic Lead Information (Required) ─────────────────────────────────────
    leadName:    { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    industry:    { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: '' },
    mobileNumber:{ type: String, required: true, trim: true },
    email:       { type: String, required: true, trim: true },
    websiteUrl:  { type: String, trim: true, default: '' },
    leadSource: {
      type: String,
      enum: ['Website', 'Call', 'Reference', 'WhatsApp', 'Social Media', 'Walk-in', 'Other'],
      required: true,
    },
    leadStatus: {
      type: String,
      enum: ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Lost'],
      default: 'New',
    },

    // ── Address Information ───────────────────────────────────────────────────
    city:        { type: String, trim: true, default: '' },
    state:       { type: String, trim: true, default: '' },
    country:     { type: String, trim: true, default: '' },
    fullAddress: { type: String, trim: true, default: '' },

    // ── Follow-up ─────────────────────────────────────────────────────────────
    nextFollowUpDate: { type: Date, default: null },
    followUpNotes:    { type: String, default: '' },
    communicationMode: {
      type: String,
      enum: ['Call', 'WhatsApp', 'Email', 'Meeting', ''],
      default: '',
    },
    remarks: { type: String, default: '' },

    // ── System ────────────────────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

// Indexes for fast search
leadSchema.index({ leadName: 1 });
leadSchema.index({ companyName: 1 });
leadSchema.index({ leadStatus: 1 });
leadSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
