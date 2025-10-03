const express = require('express');
const router = express.Router();
const Face = require('../models/Face');

// ✅ Save face descriptor
router.post('/save-descriptor', async (req, res) => {
  const { email, descriptor } = req.body;

  console.log("📥 Saving face:", email);

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

// ✅ Get all saved descriptors
router.get('/descriptors', async (req, res) => {
  try {
    const faces = await Face.find();
    // Ensure descriptors are plain arrays
    const formatted = faces.map(f => ({
      email: f.email,
      descriptor: Array.isArray(f.descriptor)
        ? f.descriptor
        : Array.from(f.descriptor)
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Failed to fetch descriptors:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
