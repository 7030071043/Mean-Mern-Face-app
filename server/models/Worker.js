// const mongoose = require('mongoose');

// const workerSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true
//   },
//   photo: {
//     type: String,
//     default: '' // no file initially; frontend handles fallback
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Worker', workerSchema);


// models/Worker.js
const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: String,
  email: String,
  status: { type: String, default: 'active' },
  photo: {
    url: String,
    public_id: String,
  },
});

module.exports = mongoose.model('Worker', WorkerSchema);
