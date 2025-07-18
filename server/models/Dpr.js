const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema({
  contractor: String,
  bigaari: String,
  mistry: String,
  baai: String,
  timings: 
String,
  hours: String
}, { _id: false });

const materialSchema = new mongoose.Schema({
  srNo: String,
  unit: String,
  qty: String,
  description: String
}, { _id: false });

const dprSchema = new mongoose.Schema({
  projectName: String,
  date: String,
  subNo: String,
  weather: String,
  temperature: String,
  humidity: String,
  start: String,
  finish: String,
  remarks: String,
  labourReport: [labourSchema],
  toolsUsed: [materialSchema],
  deliveryReport: [materialSchema],
  todayWork: String,
  completedWork: String,
  nextWork: String
}, { timestamps: true });

module.exports = mongoose.model('Dpr', dprSchema);