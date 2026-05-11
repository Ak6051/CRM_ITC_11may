const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: false },
    companyAddress: { type: String, required: false },
    gstNo: { type: String },
    candidateName: { type: String, required: false },
    jobPosition: { type: String, required: false },
    pipeline: { type: Number , required: false },
    c2cOffered: { type: Number , required: false },
    backOut: { type: Number , required: false },
    billingAmount: { type: Number, required: false },
    selectionDate: { type: Date, required: false },
    joiningDate: { type: Date, required: false },
    billingDate: { type: Date, required: false },
    recruiter: { type: String, required: false },
    paymentReceiveDate: { type: Date, required: false },
    remark: { type: String , required: false},
    GstUpload:{type:String, required:false},
    
  },
  { timestamps: true }
);

const Candidate = mongoose.model("MasterSheet", candidateSchema);
module.exports = Candidate;
