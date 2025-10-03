const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');

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

 
// Get all workers present at a site (optionally by date)
router.get('/attendance/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { date } = req.query;

    // Filter by date if provided
    let start, end;
    if (date) {
      const localDate = new Date(date);
      start = new Date(localDate.setHours(0, 0, 0, 0));
      end = new Date(localDate.setHours(23, 59, 59, 999));
    }

    const query = { siteId };
    if (start && end) query.date = { $gte: start, $lte: end };

    // Assuming Attendance model stores workerId and siteId
    const attendanceRecords = await Attendance.find(query).populate('workerId', 'name email photo');

    // Extract unique workers
    const workers = attendanceRecords.map(a => a.workerId);
    const uniqueWorkers = Array.from(new Set(workers.map(w => w._id))).map(
      id => workers.find(w => w._id === id)
    );

    res.json(uniqueWorkers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch workers for site' });
  }
});



// Get workers present today at a specific site
router.get('/workers/attendance/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    // Today's date
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    // Attendance records for today at this site
    const records = await Attendance.find({
      siteId,
      checkIn: { $gte: start, $lte: end }
    });

    // Get unique emails
    const emails = [...new Set(records.map(r => r.email))];

    // Find corresponding worker details
    const workers = await Worker.find({ email: { $in: emails } });

    res.json(workers);
  } catch (err) {
    console.error('❌ Error fetching workers with attendance:', err);
    res.status(500).json({ error: 'Failed to fetch workers for site today' });
  }
});
 

module.exports = router;
