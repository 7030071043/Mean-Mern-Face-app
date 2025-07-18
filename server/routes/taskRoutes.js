const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');

// ✅ Assign a task (prevents empty values)
router.post('/assign', async (req, res) => {
  const { email, task, assignedBy } = req.body;
  if (!email || !task || !assignedBy) {
    return res.status(400).json({ error: 'Email, task, and assignedBy are required.' });
  }

  try {
    const newTask = new Task({ email, task, assignedBy });
    await newTask.save();
    res.status(200).json({ message: 'Task assigned successfully.' });
  } catch (err) {
    console.error('❌ Failed to assign task:', err);
    res.status(500).json({ error: 'Server error' });
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
module.exports = router;
