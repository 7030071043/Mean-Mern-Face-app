const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  photo: {
    type: String,
    default: '' // no file initially; frontend handles fallback
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Worker', workerSchema);
