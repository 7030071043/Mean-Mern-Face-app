
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  email: { type: String, required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true }, // add this
  checkIn: { type: Date, required: true, default: Date.now },
  checkOut: { type: Date }, // Optional until check-out
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);


