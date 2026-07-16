const express = require('express');
const router = express.Router();
const Alumni = require('../models/Alumni');

// Get all alumni
router.get('/', async (req, res) => {
  try {
    const alumni = await Alumni.find().sort({ createdAt: -1 });
    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alumni', error: error.message });
  }
});

// Create a new alumni record
router.post('/', async (req, res) => {
  try {
    const alumni = new Alumni(req.body);
    await alumni.save();
    res.status(201).json(alumni);
  } catch (error) {
    res.status(400).json({ message: 'Error creating alumni', error: error.message });
  }
});

// Get single alumni by id
router.get('/:id', async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alumni', error: error.message });
  }
});

// Update alumni
router.put('/:id', async (req, res) => {
  try {
    const alumni = await Alumni.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
    res.json(alumni);
  } catch (error) {
    res.status(400).json({ message: 'Error updating alumni', error: error.message });
  }
});

// Delete alumni
router.delete('/:id', async (req, res) => {
  try {
    const alumni = await Alumni.findByIdAndDelete(req.params.id);
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
    res.json({ message: 'Alumni deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alumni', error: error.message });
  }
});

module.exports = router;
