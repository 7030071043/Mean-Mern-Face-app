const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Worker = require('../models/Worker');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config for temporary uploads
const upload = multer({ dest: 'tmp/' });

// Add a worker
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    let photoUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'workers',
      });
      photoUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // remove temp file
    }

    const { name, email, status } = req.body;
    const newWorker = new Worker({ name, email, status, photo: photoUrl });
    await newWorker.save();
    res.status(201).json({ message: 'Worker added', worker: newWorker });
  } catch (err) {
    console.error('❌ Error adding worker:', err);
    res.status(500).json({ error: 'Failed to add worker' });
  }
});

module.exports = router;


// ✅ Get all workers
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// ✅ Update worker
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      status: req.body.status,
    };
    if (req.file) updateData.photo = req.file.path; // ✅ Cloudinary URL
    const updated = await Worker.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

// ✅ Delete worker
router.delete('/:id', async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Worker deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

module.exports = router;
