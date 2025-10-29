// routes/workerRoutes.js
const express = require("express");
const Worker = require("../models/Worker");
const upload = require("../utils/multer");
const router = express.Router();

/**
 * ✅ Add Worker (with Cloudinary photo upload)
 */
router.post("/add-worker", upload.single("photo"), async (req, res) => {
  try {
    const { name, email, status } = req.body;
    const photo = req.file?.path || null; // Cloudinary returns a public URL

    const worker = new Worker({
      name,
      email,
      status: status || "active",
      photo,
    });

    await worker.save();
    console.log("✅ Worker added:", worker);
    res.status(201).json({ message: "Worker added successfully", worker });
  } catch (error) {
    console.error("❌ Error adding worker:", error);
    res.status(500).json({ message: "Error adding worker" });
  }
});

/**
 * ✅ Get all workers
 */
router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (err) {
    console.error("❌ Error fetching workers:", err);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});

/**
 * ✅ Update Worker (with optional Cloudinary re-upload)
 */
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const { name, email, status } = req.body;
    const updateData = { name, email, status };

    if (req.file) {
      // Use Cloudinary URL (not local path)
      updateData.photo = req.file.path;
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedWorker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    console.log("✅ Worker updated:", updatedWorker);
    res.json({ message: "Worker updated successfully", updatedWorker });
  } catch (err) {
    console.error("❌ Error updating worker:", err);
    res.status(500).json({ error: "Failed to update worker" });
  }
});

/**
 * ✅ Delete Worker
 */
router.delete("/:id", async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }
    res.json({ message: "Worker deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting worker:", err);
    res.status(500).json({ error: "Failed to delete worker" });
  }
});

module.exports = router;
