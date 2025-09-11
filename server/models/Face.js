const mongoose = require('mongoose');

const faceSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  descriptor: { type: [Number], required: true }, // array of numbers
}, { timestamps: true });

// Before saving, ensure Float32Array → normal array
faceSchema.pre('save', function (next) {
  if (this.descriptor && this.descriptor instanceof Float32Array) {
    this.descriptor = Array.from(this.descriptor);
  }
  next();
});

module.exports = mongoose.model('Face', faceSchema);
