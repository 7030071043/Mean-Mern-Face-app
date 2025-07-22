const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const XLSX = require('xlsx');

// 🔧 Reusable function to get start and end of a day (local timezone)
function getDayRange(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

// ✅ GET: Today's attendance (optional ?date=YYYY-MM-DD)
router.get('/today', async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getDayRange(date);

    const todayAttendance = await Attendance.find({
      timestamp: { $gte: start, $lte: end }
    });

    res.json(todayAttendance);
  } catch (err) {
    console.error('❌ /today error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET: Attendance by date (?date=YYYY-MM-DD)
router.get('/by-date', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const { start, end } = getDayRange(date);

    const records = await Attendance.find({
      timestamp: { $gte: start, $lte: end }
    });

    res.json(records);
  } catch (err) {
    console.error('❌ /by-date error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET: Summary for graph (attendance count by email)
router.get('/summary', async (req, res) => {
  try {
    const summary = await Attendance.aggregate([
      {
        $group: {
          _id: "$email",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          email: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);
    res.json(summary);
  } catch (err) {
    console.error('❌ /summary error:', err);
    res.status(500).json({ error: 'Summary fetch error' });
  }
});

// ✅ GET: Export attendance as Excel or CSV (optional ?date=YYYY-MM-DD&format=csv)
router.get('/export', async (req, res) => {
  try {
    const { date, format } = req.query;
    let query = {};
    let filename = 'Attendance.xlsx';

    if (date) {
      const { start, end } = getDayRange(date);
      query.timestamp = { $gte: start, $lt: end };
      filename = `Attendance_${date}.xlsx`;
    }

    const records = await Attendance.find(query).sort({ timestamp: -1 });

    const data = records.map(r => ({
      Email: r.email,
      TimeStamp: new Date(r.timestamp).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Disposition', `attachment; filename=${filename.replace('.xlsx', '.csv')}`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('❌ Excel export failed:', err);
    res.status(500).json({ error: 'Failed to export attendance' });
  }
});



// ✅ POST: Mark attendance only once per day
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { start, end } = getDayRange();

    const alreadyMarked = await Attendance.findOne({
      email,
      timestamp: { $gte: start, $lte: end }
    });

    if (alreadyMarked) {
      return res.status(400).json({ error: 'Attendance already marked today' });
    }

   const attendance = new Attendance({ email, timestamp: new Date() });

    await attendance.save();
    res.status(200).json({ message: 'Attendance marked' });
  } catch (err) {
    console.error('❌ Error marking attendance:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
