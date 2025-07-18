const express = require('express');
const router = express.Router();
const Face = require('../models/Face');
const Attendance = require('../models/Attendance')

// ✅ Save face descriptor
router.post('/save-descriptor', async (req, res) => {
  const { email, descriptor } = req.body;

  console.log("📥 Saving face:", email);
  console.log("Descriptor Type:", typeof descriptor);
  console.log("Length:", descriptor?.length);

  // Validate inputs
  if (!email || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ error: 'Invalid email or descriptor format' });
  }

  try {
    let user = await Face.findOne({ email });

    if (!user) {
      user = new Face({ email, descriptor });
    } else {
      user.descriptor = descriptor; // update existing descriptor
    }

    await user.save();
    res.status(200).json({ message: "✅ Saved face descriptor" });
  } catch (err) {
    console.error("❌ Error saving descriptor:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/attendance', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  const today = new Date().toISOString().split('T')[0]; // e.g., '2025-07-17'

  try {
    // Check if already marked today
    const existing = await Attendance.findOne({
      email,
      checkIn: {
        $gte: new Date(`${today}T00:00:00.000Z`),
        $lte: new Date(`${today}T23:59:59.999Z`)
      }
    });

    if (existing) {
      return res.status(200).json({ message: 'Attendance already marked for today' });
    }

    // Save new attendance
    const attendance = new Attendance({
      email,
      checkIn: new Date()
    });

    await attendance.save();
    res.status(200).json({ message: '✅ Attendance marked successfully' });

  } catch (err) {
    console.error("❌ Error marking attendance:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ Get all saved descriptors
router.get('/descriptors', async (req, res) => {
  try {
    const all = await Face.find();
    res.status(200).json(all);
  } catch (err) {
    console.error("❌ Failed to fetch descriptors:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
