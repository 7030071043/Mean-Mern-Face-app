const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  task: {
    type: String,
    required: true
  },
  assignedBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'done'],
    default: 'pending'
  }
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('Task', taskSchema);
