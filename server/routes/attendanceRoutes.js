const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require("../models/Attendance");
const Site = require("../models/Site");   // ✅ needed for siteId lookup
const XLSX = require("xlsx");
const Worker = require('../models/Worker'); // make sure Worker model exists
const site = require('../models/Site');

// Helper to check valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// 🔧 Reusable function to get start and end of a day (local timezone)
function getDayRange(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/* ------------------- 📌 GET ROUTES ------------------- */

// ✅ Get today's attendance (optionally pass ?date=YYYY-MM-DD)
router.get("/today", async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getDayRange(date);

    const todayAttendance = await Attendance.find({
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: -1 });

    res.json(todayAttendance);
  } catch (err) {
    console.error("❌ /today error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get attendance by specific date (?date=YYYY-MM-DD)
router.get("/by-date", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });

    const { start, end } = getDayRange(date);

    const records = await Attendance.find({
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: -1 });

    res.json(records);
  } catch (err) {
    console.error("❌ /by-date error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Summary for graph (attendance count by email)
router.get("/summary", async (req, res) => {
  try {
    const summary = await Attendance.aggregate([
      {
        $group: {
          _id: "$email",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          email: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);
    res.json(summary);
  } catch (err) {
    console.error("❌ /summary error:", err);
    res.status(500).json({ error: "Summary fetch error" });
  }
});

// ✅ Export attendance as Excel or CSV (optional ?date=YYYY-MM-DD&format=csv)
router.get("/export", async (req, res) => {
  try {
    const { date, format } = req.query;
    let query = {};
    let filename = "Attendance.xlsx";

    if (date) {
      const { start, end } = getDayRange(date);
      query.timestamp = { $gte: start, $lt: end };
      filename = `Attendance_${date}.xlsx`;
    }

    const records = await Attendance.find(query).sort({ timestamp: -1 });

    const data = records.map((r) => ({
      Email: r.email,
      Site: r.siteName || r.siteId,
      TimeStamp: new Date(r.timestamp).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${filename.replace(".xlsx", ".csv")}`
      );
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error("❌ Excel export failed:", err);
    res.status(500).json({ error: "Failed to export attendance" });
  }
});

// ✅ Get attendance for a specific site
router.get("/site/:siteId", async (req, res) => {
  try {
    const { siteId } = req.params;
    const records = await Attendance.find({ siteId }).sort({ timestamp: -1 });
    res.json(records);
  } catch (err) {
    console.error("❌ /site/:siteId error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------- 📌 POST ROUTE ------------------- */
 


// POST attendance (mark once per user per day per site)
router.post("/", async (req, res) => {
  try {
    const { email, siteId } = req.body;

    if (!email || !siteId)
      return res.status(400).json({ error: "Email and siteId are required" });

    // Validate siteId format
    if (!mongoose.Types.ObjectId.isValid(siteId))
      return res.status(400).json({ error: "Invalid siteId" });

    // Get start of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check if attendance already exists for this user at this site today
    const existing = await Attendance.findOne({
      email,
      siteId,
      timestamp: { $gte: todayStart, $lte: todayEnd },
    });

    if (existing)
      return res.status(400).json({ error: "Attendance already marked today" });

    // Save new attendance
    const attendance = new Attendance({ email, siteId });
    await attendance.save();

    res.json({ message: "Attendance saved successfully", attendance });
  } catch (err) {
    console.error("❌ Attendance save error:", err);
    res.status(500).json({ error: "Server error while saving attendance" });
  }
});


// In attendanceRoutes.js
router.get('/site/:siteId/today', async (req, res) => {
  try {
    const { siteId } = req.params;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      siteId,
      timestamp: { $gte: start, $lte: end },
    });

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});



module.exports = router;
