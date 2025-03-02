// const mongoose = require('mongoose');

// const ForwardedCVSchema = new mongoose.Schema({
//   createdAt: { type: Date, default: Date.now },
//   forwardedCVs: [
//     {
//       // formId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'HRForm' }, // Assuming HRForm is another model you reference
//       companyName: { type: String, required: true },
//       websiteUrl: { type: String, required: true },
//       filePath: { type: String, required: true },
//     },
//   ],
// });

// module.exports = mongoose.model('ForwardedCV', ForwardedCVSchema);
const mongoose = require('mongoose');

const ForwardedCVSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  forwardedCVs: [
    {
      companyName: { type: String, required: true },
      websiteUrl: { type: String, required: true },
      filePath: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model('ForwardedCV', ForwardedCVSchema);