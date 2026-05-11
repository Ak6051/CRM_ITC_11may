const mongoose = require('mongoose');

const assignedTaskSchema = new mongoose.Schema({
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskName: { type: String, required: true },
  endDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AssignedTask', assignedTaskSchema);
