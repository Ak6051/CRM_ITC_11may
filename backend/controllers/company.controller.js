const Company = require('../models/companycreate.model');
const { uploadToS3 } = require('../middleware/gcsMulter');

const COMPANY_FIELDS = [
  'companyName', 'industries', 'companyAddress', 'area', 'city',
  'state', 'country', 'pincode',
  'contactPerson', 'contactPersonDesignation', 'contactNumber', 'email',
  'contactPerson2', 'contactPerson2Designation', 'contactNumber2', 'email2',
  'websiteUrl', 'gpsLocation',
  'agreementStartDate', 'agreementEndDate',
  'invoiceNumber', 'paymentMode', 'paymentRemark', 'tokenAmount',
];

// ── GET all companies ────────────────────────────────────────────────────────
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ companyId: -1 }).populate('createdBy', 'firstName lastName email');
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET single company ───────────────────────────────────────────────────────
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST create company ──────────────────────────────────────────────────────
exports.createCompany = async (req, res) => {
  try {
    const { companyName, industries, companyAddress, area, city,
            state, country, pincode,
            contactPerson, contactPersonDesignation, contactNumber, email,
            contactPerson2, contactPerson2Designation, contactNumber2, email2,
            websiteUrl, gpsLocation,
            agreementStartDate, agreementEndDate,
            invoiceNumber, paymentMode, paymentRemark, tokenAmount } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }
    if (!req.files?.agreementUpload?.[0]) {
      return res.status(400).json({ success: false, message: 'Signed agreement document is required' });
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existing = await Company.findOne({
      companyName: { $regex: `^${companyName.trim()}$`, $options: 'i' },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Company "${companyName}" already exists (ID: ${existing.companyId})`,
        existingId: existing.companyId,
      });
    }

    let gstUpload = '', agreementUpload = '', tokenUpload = '', otherDocumentUpload = '';
    if (req.files?.gstUpload?.[0]) {
      const f = req.files.gstUpload[0];
      gstUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.agreementUpload?.[0]) {
      const f = req.files.agreementUpload[0];
      agreementUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.tokenUpload?.[0]) {
      const f = req.files.tokenUpload[0];
      tokenUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.otherDocumentUpload?.[0]) {
      const f = req.files.otherDocumentUpload[0];
      otherDocumentUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }

    const company = new Company({
      companyName, industries, companyAddress, area, city,
      state, country, pincode,
      contactPerson, contactPersonDesignation, contactNumber, email,
      contactPerson2, contactPerson2Designation, contactNumber2, email2,
      websiteUrl, gpsLocation,
      agreementStartDate: agreementStartDate || null,
      agreementEndDate:   agreementEndDate   || null,
      invoiceNumber, paymentMode, paymentRemark,
      tokenAmount: tokenAmount !== '' && tokenAmount !== undefined ? Number(tokenAmount) : null,
      gstUpload, agreementUpload, tokenUpload, otherDocumentUpload,
      createdBy: req.user?._id,
    });

    await company.save();
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Company name already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT update company ───────────────────────────────────────────────────────
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    COMPANY_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) {
        company[f] = f === 'tokenAmount'
          ? (req.body[f] !== '' ? Number(req.body[f]) : null)
          : req.body[f];
      }
    });

    if (req.files?.gstUpload?.[0]) {
      const f = req.files.gstUpload[0];
      company.gstUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.agreementUpload?.[0]) {
      const f = req.files.agreementUpload[0];
      company.agreementUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.tokenUpload?.[0]) {
      const f = req.files.tokenUpload[0];
      company.tokenUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.otherDocumentUpload?.[0]) {
      const f = req.files.otherDocumentUpload[0];
      company.otherDocumentUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }

    await company.save();
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE company ───────────────────────────────────────────────────────────
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    // Revoke the linked CompanyRequest so Sales sees it as revoked
    const CompanyRequest = require('../models/CompanyRequest.model');
    await CompanyRequest.findOneAndUpdate(
      { createdCompanyId: req.params.id, status: 'Approved' },
      { $set: { status: 'Revoked', rejectReason: 'Company was deleted by admin' } }
    );

    res.json({ success: true, message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST add branch ──────────────────────────────────────────────────────────
exports.addBranch = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const {
      branchName, branchAddress, city, area, state, country, pincode,
      contactPerson, contactPersonDesignation, contactNumber, email,
      contactPerson2, contactPerson2Designation, contactNumber2, email2,
      websiteUrl, gpsLocation,
      agreementStartDate, agreementEndDate,
      invoiceNumber, paymentMode, paymentRemark, tokenAmount,
    } = req.body;
    if (!branchName) return res.status(400).json({ success: false, message: 'Branch name is required' });

    let gstUpload = '', agreementUpload = '', otherDocumentUpload = '', tokenUpload = '';
    if (req.files?.gstUpload?.[0]) {
      const f = req.files.gstUpload[0];
      gstUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.agreementUpload?.[0]) {
      const f = req.files.agreementUpload[0];
      agreementUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.otherDocumentUpload?.[0]) {
      const f = req.files.otherDocumentUpload[0];
      otherDocumentUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.tokenUpload?.[0]) {
      const f = req.files.tokenUpload[0];
      tokenUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }

    company.branches.push({
      branchName, branchAddress, city, area, state, country, pincode,
      contactPerson, contactPersonDesignation, contactNumber, email,
      contactPerson2, contactPerson2Designation, contactNumber2, email2,
      websiteUrl, gpsLocation,
      agreementStartDate: agreementStartDate || null,
      agreementEndDate:   agreementEndDate   || null,
      invoiceNumber, paymentMode, paymentRemark,
      tokenAmount: tokenAmount !== '' && tokenAmount !== undefined ? Number(tokenAmount) : null,
      gstUpload, agreementUpload, otherDocumentUpload, tokenUpload,
    });
    await company.save();
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT update branch ────────────────────────────────────────────────────────
exports.updateBranch = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const branch = company.branches.id(req.params.branchId);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });

    const fields = [
      'branchName', 'branchAddress', 'city', 'area', 'state', 'country', 'pincode',
      'contactPerson', 'contactPersonDesignation', 'contactNumber', 'email',
      'contactPerson2', 'contactPerson2Designation', 'contactNumber2', 'email2',
      'websiteUrl', 'gpsLocation',
      'agreementStartDate', 'agreementEndDate',
      'invoiceNumber', 'paymentMode', 'paymentRemark', 'tokenAmount',
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        branch[f] = f === 'tokenAmount'
          ? (req.body[f] !== '' ? Number(req.body[f]) : null)
          : req.body[f];
      }
    });

    if (req.files?.gstUpload?.[0]) {
      const f = req.files.gstUpload[0];
      branch.gstUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.agreementUpload?.[0]) {
      const f = req.files.agreementUpload[0];
      branch.agreementUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.otherDocumentUpload?.[0]) {
      const f = req.files.otherDocumentUpload[0];
      branch.otherDocumentUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.tokenUpload?.[0]) {
      const f = req.files.tokenUpload[0];
      branch.tokenUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }

    await company.save();
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE branch ────────────────────────────────────────────────────────────
exports.deleteBranch = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    company.branches = company.branches.filter(b => b._id.toString() !== req.params.branchId);
    await company.save();
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
