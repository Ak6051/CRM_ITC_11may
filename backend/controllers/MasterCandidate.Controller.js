const MasterSheet = require("../models/MasterCandidate.model.js");
const { uploadToS3 } = require("../middleware/gcsMulter");

// ✅ Create Candidate
const createCandidate = async (req, res) => {
  try {
    // Convert numeric + date values properly
    const payload = {
      ...req.body,
      billingAmount: req.body.billingAmount ? Number(req.body.billingAmount) : 0,
      pipeline: req.body.pipeline ? Number(req.body.pipeline) : 0,
      c2cOffered: req.body.c2cOffered ? Number(req.body.c2cOffered) : 0,
      backOut: req.body.backOut ? Number(req.body.backOut) : 0,
      selectionDate: req.body.selectionDate ? new Date(req.body.selectionDate) : null,
      joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : null,
      billingDate: req.body.billingDate ? new Date(req.body.billingDate) : null,
      paymentReceiveDate: req.body.paymentReceiveDate ? new Date(req.body.paymentReceiveDate) : null,
    };
    if (req.file) {
      const filename = `candidates_resume/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      const publicUrl = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
      payload.GstUpload = publicUrl;
    }

    const candidate = await MasterSheet.create(payload);
    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: "Failed to create candidate", error: error.message });
  }
};

// ✅ Fetch All Candidates
const getAllCandidates = async (req, res) => {
  try {
    const candidates = await MasterSheet.find().sort({ createdAt: -1 });
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch candidates", error: error.message });
  }
};

// ✅ Update Candidate
const updateCandidate = async (req, res) => {
  try {
    // Create update object with $set operator
    const update = { $set: {} };
    
    // Add all fields from req.body to update object
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && req.body[key] !== '') {
        // Handle date fields
        if (['selectionDate', 'joiningDate', 'billingDate', 'paymentReceiveDate'].includes(key)) {
          update.$set[key] = new Date(req.body[key]);
        } 
        // Handle number fields
        else if (['billingAmount', 'pipeline', 'c2cOffered', 'backOut'].includes(key)) {
          update.$set[key] = Number(req.body[key]) || 0;
        }
        // Handle other fields
        else {
          update.$set[key] = req.body[key];
        }
      }
    });

    // Handle file upload if present
    if (req.file) {
      const filename = `candidates_resume/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      const publicUrl = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
      update.$set.GstUpload = publicUrl;
    }

    // Only proceed with update if there are fields to update
    if (Object.keys(update.$set).length > 0) {
      const updated = await MasterSheet.findByIdAndUpdate(
        req.params.id, 
        update, 
        { new: true, runValidators: true }
      );
      
      if (!updated) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      return res.status(200).json(updated);
    }
    if (!updated) return res.status(404).json({ message: "Candidate not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update candidate", error: error.message });
  }
};

// ✅ Delete Candidate
const deleteCandidate = async (req, res) => {
  try {
    const deleted = await MasterSheet.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Candidate not found" });
    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete candidate", error: error.message });
  }
};

const importCandidates = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "No data provided for import" });
    }

    // Insert many documents at once
    const insertedDocs = await MasterSheet.insertMany(data);

    res.status(201).json({
      message: `${insertedDocs.length} records imported successfully`,
      inserted: insertedDocs.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      message: "Failed to import data",
      error: error.message,
    });
  }
};

module.exports = {
  createCandidate,
  getAllCandidates,
  updateCandidate,
  deleteCandidate,
  importCandidates,
};
