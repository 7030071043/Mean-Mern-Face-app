const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const Attendance = require('../models/Attendance');

// POST /api/sites
router.post('/', async (req, res) => {
  try {
    const { name, location, description } = req.body;
    const newSite = new Site({ name, location, description });
    await newSite.save();
    res.status(201).json({ message: 'Site created successfully', site: newSite });
  } catch (err) {
    console.error('❌ Error creating site:', err);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// DELETE /api/sites/:siteId
router.delete('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    await Site.findByIdAndDelete(siteId);
    res.status(200).json({ message: 'Site deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

// GET /api/sites
router.get('/', async (req, res) => {
  try {
    const sites = await Site.find();
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

 
 


module.exports = router;
