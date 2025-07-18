const mongoose = require ('mongoose');

const attendanceSchema = new mongoose.Schema({
  email: { type: String, required: true },
  checkIn: { type: Date, required: true, default: Date.now },
  checkOut: { type: Date }, // Optional until check-out is submitted
  timestamp: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('Attendance', attendanceSchema);
