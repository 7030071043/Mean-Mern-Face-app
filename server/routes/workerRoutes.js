const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Worker = require('../models/Worker');

// Ensure uploads directory exists once
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Helper: Extract worker data
const extractWorkerData = (req) => {
  const { name, email } = req.body;
  const photo = req.file?.filename || null;
  return { name, email, photo };
};

// ✅ Add worker
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const workerData = extractWorkerData(req);
    const newWorker = new Worker(workerData);
    await newWorker.save();
    res.status(201).json({ message: 'Worker added' });
  } catch (err) {
    console.error('❌ Error adding worker:', err);
    res.status(500).json({ error: 'Failed to add worker' });
  }
});

// ✅ Get all workers
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// ✅ Update worker
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const update = extractWorkerData(req);
    await Worker.findByIdAndUpdate(req.params.id, update);
    res.json({ message: 'Worker updated' });
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
