const mongoose = require('mongoose');

const allTypeCandidateSchema = new mongoose.Schema(
  {
    name:{type:String , required:false},
     phoneNumber: { type: String, required: false },
    positionName: { type: String, required: false },
    experience: { type: String, required: false },
    currentLocation: { type: String, required: false },
    currentPosition: { type: String, required: false },
    currentCTC: { type: String, required: false },
    expectedCTC: { type: String, required: false },
    noticePeriod: { type: String, required: false },
    reasonforLeaving: { type: String, required: false },
    currentCompany: { type: String, required: false },
    resumeUpload: { type: String, required: false },
    remark: { type: String, required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    

  },
  { timestamps: true }
);

const allcandidate = mongoose.model('allcandidate', allTypeCandidateSchema);
module.exports = allcandidate;
