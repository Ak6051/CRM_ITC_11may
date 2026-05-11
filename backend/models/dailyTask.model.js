const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema({
  hrName: {type:String, required:true},
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  companyName:{type:String, required:true},
  position: {type:String, required:true},
  totalCall:{type:Number, required:true},
  TCEOD: {type:String, required:true},
  profilesShared:{type:Number, required:true},
  PSEOD: {type:String, required:true},
  interviewsScheduled:{type:Number, required:true},
  ISEOD: {type:String, required:true},
  revenueGenerated:{type:Number, required:true},
  RGEOD: {type:String, required:true},
  remark:{type:String, required:false},
}, { timestamps: true });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);
