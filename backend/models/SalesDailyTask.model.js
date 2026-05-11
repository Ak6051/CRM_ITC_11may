const mongoose = require('mongoose');

const salesDailyTaskSchema = new mongoose.Schema({
  salesName: {type:String, required:true},
  salesId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  TargetedLead : {type:Number , required:true},
  TLEOD :{type:Number , required:false},
  TargetedMeeting :{type:Number , required:true},
  TMEOD:{type:Number , required:false},
  TargetedAgreement:{type:Number , required:true},
  TAEOD:{type:Number , required:false},
  TargetedOpenings:{type:Number , required:true},
  TOEOD:{type:Number , required:false},

  remark:{type:String, required:false},
}, { timestamps: true });

module.exports = mongoose.model('SalesDailyTask', salesDailyTaskSchema);
