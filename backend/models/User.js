

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const educationSchema = new mongoose.Schema({
  qualification: { type: String, default: '' },
  boardUniversity: { type: String, default: '' },
  year: { type: String, default: '' },
  percentage: { type: String, default: '' },
}, { _id: false });

const workExpSchema = new mongoose.Schema({
  companyName: { type: String, default: '' },
  designation: { type: String, default: '' },
  duration: { type: String, default: '' },
  lastCTC: { type: String, default: '' },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  // ── Core (existing) ───────────────────────────────────────────────────────
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobileNo: { type: String, required: true },
  address: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  role: {
    type: String,
    enum: ['Sales', 'HR', 'admin', 'teamleader'],
  },
  permissions: { type: [String], default: [] },
  assignedHRs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // HRs under this TL
  authorizedDevices: [{ type: String }],
  isActive: { type: Boolean, default: true },
  otp: String,
  otpExpiresAt: Date,
  createdAt: { type: Date, default: Date.now },

  // ── Tenure tracking ───────────────────────────────────────────────────────
  // Updated every time this account is reassigned to a new person.
  // All data created before this date belongs to the previous person.
  tenureStartedAt: { type: Date, default: null },

  // History of all previous tenures (name snapshots for audit)
  tenureHistory: [{
    name: { type: String },
    startedAt: { type: Date },
    endedAt: { type: Date },
    profileSnapshot: { type: Object }, // Stores all profile fields as they were at the time of ending
    _id: false,
  }],

  // ── 1. Personal Details ───────────────────────────────────────────────────
  fatherHusbandName: { type: String, default: '' },
  dateOfBirth: { type: Date, default: null },
  maritalStatus: { type: String, enum: ['Single', 'Married', ''], default: '' },
  nationality: { type: String, default: '' },

  // ── 2. Contact Details ────────────────────────────────────────────────────
  alternateNumber: { type: String, default: '' },
  currentAddress: { type: String, default: '' },
  permanentAddress: { type: String, default: '' },

  // ── 3. Employment Details ─────────────────────────────────────────────────
  position: { type: String, default: '' },
  department: { type: String, default: '' },
  dateOfJoining: { type: Date, default: null },
  workLocation: { type: String, default: '' },
  reportingManager: { type: String, default: '' },

  // ── 4. Educational Qualification ─────────────────────────────────────────
  education: { type: [educationSchema], default: [] },

  // ── 5. Work Experience ────────────────────────────────────────────────────
  workExperience: { type: [workExpSchema], default: [] },

  // ── 6. Salary Details ─────────────────────────────────────────────────────
  currentCTC: { type: String, default: '' },
  offeredCTC: { type: String, default: '' },
  paymentMode: { type: String, enum: ['Bank Transfer', 'Cash', ''], default: '' },

  // ── 7. Bank Details ───────────────────────────────────────────────────────
  bankName: { type: String, default: '' },
  accountHolderName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  bankBranch: { type: String, default: '' },

  // ── 8. Documents (S3 URLs) ────────────────────────────────────────────────
  docAadhaar: { type: String, default: '' },
  docPAN: { type: String, default: '' },
  docResume: { type: String, default: '' },
  docEducationalCerts: { type: String, default: '' },
  docExperienceLetters: { type: String, default: '' },
  docPassportPhoto: { type: String, default: '' },

  // ── 9. Emergency Contact ──────────────────────────────────────────────────
  emergencyName: { type: String, default: '' },
  emergencyRelation: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
});

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
