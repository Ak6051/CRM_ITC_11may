const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: { type: String, unique: true, required: true },
  companyId: { type: Number, unique: true, required: true },
});

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
