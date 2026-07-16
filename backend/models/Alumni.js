const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    graduationYear: { type: String },
    department: { type: String },
    currentJob: { type: String },
    location: { type: String },
    university: { type: String, default: 'BAUST' },
    role: { type: String, default: 'alumni' },
    bio: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alumni', alumniSchema);
