const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// 🔧 Reusable function to get today's date range
function getDayRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { start, end };
}

// ✅ Save attendance only once per person per day
router.post('/attendance', async (req, res) => {
  const { email } = req.body;
  const { start, end } = getDayRange();

  const alreadyMarked = await Attendance.findOne({
    email,
    timestamp: { $gte: start, $lt: end }
  });

  if (alreadyMarked) {
    return res.status(200).json({ message: 'Attendance already marked today' });
  }

  const attendance = new Attendance({ email });
  await attendance.save();
  res.status(200).json({ message: 'Attendance marked' });
});

// ✅ Get today's unique attendance
router.get('/attendance/today', async (req, res) => {
  try {
    const { start, end } = getDayRange();

    const todayAttendance = await Attendance.aggregate([
      { $match: { timestamp: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: '$email',
          timestamp: { $first: '$timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          email: '$_id',
          timestamp: 1
        }
      }
    ]);

    res.json(todayAttendance);
  } catch (err) {
    console.error("❌ Error fetching unique attendance:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ View full attendance history
router.get('/attendance/history', async (req, res) => {
  try {
    const all = await Attendance.find().sort({ timestamp: -1 });
    res.json(all);
  } catch (err) {
    console.error("❌ Failed to fetch history:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
