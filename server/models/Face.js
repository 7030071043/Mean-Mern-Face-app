const mongoose = require('mongoose');

const faceSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  descriptor: { type: [Number], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Face', faceSchema);
