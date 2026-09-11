const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Alumni = require('../models/Alumni');

const router = express.Router();
const sourceDataDir = path.join(__dirname, '..', '..', 'BAUST', 'BAUST', 'data');
const dataDir = process.env.VERCEL ? path.join('/tmp', 'baust-data') : sourceDataDir;
const alumniFilePath = path.join(dataDir, 'alumni.json');

function databaseConnected() {
  return mongoose.connection.readyState === 1;
}

function ensureAlumniStore() {
  const alumniDir = path.dirname(alumniFilePath);
  if (!fs.existsSync(alumniDir)) {
    fs.mkdirSync(alumniDir, { recursive: true });
  }
  if (!fs.existsSync(alumniFilePath)) {
    const sourceFilePath = path.join(sourceDataDir, 'alumni.json');
    const initialData = fs.existsSync(sourceFilePath) ? fs.readFileSync(sourceFilePath, 'utf8') : '[]';
    fs.writeFileSync(alumniFilePath, initialData, 'utf8');
  }
}

function readAlumni() {
  ensureAlumniStore();
  try {
    const alumni = JSON.parse(fs.readFileSync(alumniFilePath, 'utf8'));
    return Array.isArray(alumni) ? alumni : [];
  } catch (error) {
    return [];
  }
}

function writeAlumni(alumni) {
  ensureAlumniStore();
  fs.writeFileSync(alumniFilePath, JSON.stringify(alumni, null, 2), 'utf8');
}

function createLocalAlumni(payload) {
  const now = new Date().toISOString();
  return {
    _id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    firstName: String(payload.firstName || '').trim(),
    lastName: String(payload.lastName || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    password: payload.password || '',
    graduationYear: payload.graduationYear || '',
    department: payload.department || '',
    currentJob: payload.currentJob || '',
    location: payload.location || '',
    university: payload.university || 'BAUST',
    role: payload.role || 'alumni',
    bio: payload.bio || '',
    createdAt: now,
    updatedAt: now,
  };
}

// Get all alumni
router.get('/', async (req, res) => {
  try {
    if (!databaseConnected()) {
      return res.json(readAlumni().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }

    const alumni = await Alumni.find().sort({ createdAt: -1 });
    return res.json(alumni);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching alumni', error: error.message });
  }
});

// Create a new alumni record
router.post('/', async (req, res) => {
  try {
    if (!databaseConnected()) {
      const alumni = readAlumni();
      const newAlumni = createLocalAlumni(req.body);

      if (!newAlumni.firstName || !newAlumni.lastName || !newAlumni.email) {
        return res.status(400).json({ message: 'First name, last name, and email are required' });
      }
      if (alumni.some((entry) => entry.email === newAlumni.email)) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      alumni.push(newAlumni);
      writeAlumni(alumni);
      return res.status(201).json(newAlumni);
    }

    const alumni = new Alumni(req.body);
    await alumni.save();
    return res.status(201).json(alumni);
  } catch (error) {
    return res.status(400).json({ message: 'Error creating alumni', error: error.message });
  }
});

// Get single alumni by id
router.get('/:id', async (req, res) => {
  try {
    if (!databaseConnected()) {
      const alumni = readAlumni().find((entry) => entry._id === req.params.id);
      if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
      return res.json(alumni);
    }

    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
    return res.json(alumni);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching alumni', error: error.message });
  }
});

// Update alumni
router.put('/:id', async (req, res) => {
  try {
    if (!databaseConnected()) {
      const alumni = readAlumni();
      const index = alumni.findIndex((entry) => entry._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Alumni not found' });

      alumni[index] = {
        ...alumni[index],
        ...req.body,
        _id: alumni[index]._id,
        email: req.body.email ? String(req.body.email).trim().toLowerCase() : alumni[index].email,
        updatedAt: new Date().toISOString(),
      };
      writeAlumni(alumni);
      return res.json(alumni[index]);
    }

    const alumni = await Alumni.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
    return res.json(alumni);
  } catch (error) {
    return res.status(400).json({ message: 'Error updating alumni', error: error.message });
  }
});

// Delete alumni
router.delete('/:id', async (req, res) => {
  try {
    if (!databaseConnected()) {
      const alumni = readAlumni();
      const nextAlumni = alumni.filter((entry) => entry._id !== req.params.id);
      if (nextAlumni.length === alumni.length) return res.status(404).json({ message: 'Alumni not found' });

      writeAlumni(nextAlumni);
      return res.json({ message: 'Alumni deleted' });
    }

    const alumni = await Alumni.findByIdAndDelete(req.params.id);
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
    return res.json({ message: 'Alumni deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting alumni', error: error.message });
  }
});

module.exports = router;
