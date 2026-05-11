const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskName: { type: String, required: true },
  endDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
