const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');

router.post('/assign', async (req, res) => {
  const { siteId, assignedTo, task, assignedBy } = req.body;

  if (!siteId || !assignedTo || !task || !assignedBy) {
    return res.status(400).json({ error: 'siteId, assignedTo, task, and assignedBy are required.' });
  }

  try {
    const newTask = new Task({ siteId, assignedTo, task, assignedBy });
    await newTask.save();
    res.status(200).json({ message: '✅ Task assigned successfully.' });
  } catch (err) {
    console.error('❌ Failed to assign task:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tasks?email=&siteId=&date=
router.get('/', async (req, res) => {
  try {
    const { email, siteId, date } = req.query;

    const query = {};
    if (email) query.assignedTo = email;      // email of worker
    if (siteId) query.siteId = siteId;       // filter by site
    if (date) {
      const localDate = new Date(date);
      const start = new Date(localDate.setHours(0, 0, 0, 0));
      const end = new Date(localDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: start, $lte: end };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('❌ Error fetching filtered tasks:', err);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});


// ✅ Mark a task as completed
router.post('/complete', async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  try {
    await Task.findByIdAndUpdate(taskId, { status: 'done' });
    res.json({ message: 'Task marked as completed.' });
  } catch (err) {
    console.error('❌ Error completing task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ✅ Download Daily Progress Report (DPR)
router.get('/dpr/download', async (req, res) => {
  try {
    const rawDate = req.query.date || new Date().toISOString().split('T')[0];
    const start = new Date(`${rawDate}T00:00:00`);
    const end = new Date(`${rawDate}T23:59:59.999`);

    const tasks = await Task.find({ createdAt: { $gte: start, $lte: end } });

    const report = tasks.map(t => (
      `Worker: ${t.email}\nTask: ${t.task}\nStatus: ${t.status}\nAssigned By: ${t.assignedBy}\n\n`
    )).join('');

    const filePath = path.join(__dirname, `../dpr-${rawDate}.txt`);
    fs.writeFileSync(filePath, report);

    res.download(filePath, `DPR-${rawDate}.txt`);
  } catch (err) {
    console.error('❌ DPR generation error:', err);
    res.status(500).json({ error: 'Failed to generate DPR' });
  }
});

// ✅ Get all tasks
router.get('/all', async (req, res) => {
  try {
    const allTasks = await Task.find().sort({ createdAt: -1 });
    res.json(allTasks);
  } catch (err) {
    console.error('❌ Error fetching all tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}); 
// ✅ Get tasks for a specific email (with optional date filter)
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { date } = req.query;

    const query = { email };

    if (date) {
      // Fix for correct local timezone support
      const localDate = new Date(date);
      const start = new Date(localDate.setHours(0, 0, 0, 0));
      const end = new Date(localDate.setHours(23, 59, 59, 999));

      query.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('❌ Error fetching tasks by date:', err);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

router.get("/site/:siteId", async (req, res) => {
  try {
    const { siteId } = req.params;  // Extract siteId from route parameters
    const tasks = await Task.find({ siteId });
    res.json(Array.isArray(tasks) ? tasks : []);
  } catch (err) {
    console.error("❌ Error fetching site tasks:", err);
    res.status(500).json({ error: "Error fetching site tasks" });
  }
});




module.exports = router;
