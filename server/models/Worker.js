const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "active",
  },
  photo: {
    type: String, // ✅ URL from Cloudinary
    default: null,
  },
});

module.exports = mongoose.model("Worker", WorkerSchema);
