const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
   assignedBy: { type: String, required: true },
  assignedTo: { type: String, required: true }, // email
  task: { type: String, required: true },
  status: { type: String, default: 'pending' }, // 'pending' | 'done'
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
