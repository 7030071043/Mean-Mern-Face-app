const express = require('express');
const router = express.Router();
const Dpr = require('../models/Dpr');
const XLSX = require('xlsx');

// Save DPR
router.post('/save', async (req, res) => {
  try {
    const dpr = new Dpr(req.body);
    await dpr.save();
    res.status(200).json({ message: 'DPR saved successfully' });
  } catch (err) {
    console.error('❌ Error saving DPR:', err);
    res.status(500).json({ error: 'Failed to save DPR' });
  }
});

// Get all DPRs
router.get('/all', async (req, res) => {
  try {
    const dprs = await Dpr.find().sort({ createdAt: -1 });
    res.json(dprs);
  } catch (err) {
    console.error('❌ Error fetching DPRs:', err);
    res.status(500).json({ error: 'Failed to fetch DPRs' });
  }
});

// Get DPR by date
router.get('/by-date', async (req, res) => {
  const { date } = req.query;
  try {
    const dprs = await Dpr.find({ date });
    res.json(dprs);
  } catch (err) {
    console.error('❌ Error fetching DPRs by date:', err);
    res.status(500).json({ error: 'Failed to fetch DPRs' });
  }
});

router.get('/export', async (req, res) => {
  const { date } = req.query;
  try {
    const dprs = await Dpr.find({ date });
    if (!dprs.length) return res.status(404).json({ error: 'No DPRs found' });

    const rows = [];
    dprs.forEach(dpr => {
      const maxLen = Math.max(
        dpr.labourReport.length,
        dpr.toolsUsed.length,
        dpr.deliveryReport.length,
        1
      );

      for (let i = 0; i < maxLen; i++) {
        const labour = dpr.labourReport[i] || {};
        const tool = dpr.toolsUsed[i] || {};
        const delivery = dpr.deliveryReport[i] || {};

        rows.push({
          Project: dpr.projectName,
          Date: dpr.date,
          SubNo: dpr.subNo,
          Weather: dpr.weather,
          Temperature: dpr.temperature,
          Humidity: dpr.humidity,
          Start: dpr.start,
          Finish: dpr.finish,
          Remarks: dpr.remarks,
          TodayWork: dpr.todayWork,
          CompletedWork: dpr.completedWork,
          NextWork: dpr.nextWork,

          Contractor: labour.contractor || '',
          Bigaari: labour.bigaari || '',
          Mistry: labour.mistry || '',
          Baai: labour.baai || '',
          Timings: labour.timings || '',
          Hours: labour.hours || '',

          Tool_SrNo: tool.srNo || '',
          Tool_Unit: tool.unit || '',
          Tool_Qty: tool.qty || '',
          Tool_Description: tool.description || '',

          Delivery_SrNo: delivery.srNo || '',
          Delivery_Unit: delivery.unit || '',
          Delivery_Qty: delivery.qty || '',
          Delivery_Description: delivery.description || ''
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'DPR');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `DPR_${date}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('❌ Error exporting DPR:', err);
    res.status(500).json({ error: 'Failed to export DPR' });
  }
});

module.exports = router;