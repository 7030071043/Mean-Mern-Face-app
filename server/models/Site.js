const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  description: String
});

module.exports = mongoose.model('Site', siteSchema);

  