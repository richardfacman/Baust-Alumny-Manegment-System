const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const sourceDataDir = path.join(__dirname, '..', '..', 'BAUST', 'BAUST', 'data');
const dataDir = process.env.VERCEL ? path.join('/tmp', 'baust-data') : sourceDataDir;

const stores = {
  alumni: path.join(dataDir, 'alumni.json'),
  events: path.join(dataDir, 'events.json'),
  news: path.join(dataDir, 'news.json'),
  settings: path.join(dataDir, 'settings.json'),
  notifications: path.join(dataDir, 'notifications.json'),
  activities: path.join(dataDir, 'activities.json'),
};

function ensureStore(filePath, fallback) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    const sourceFilePath = path.join(sourceDataDir, path.basename(filePath));
    const initialData = fs.existsSync(sourceFilePath)
      ? fs.readFileSync(sourceFilePath, 'utf8')
      : JSON.stringify(fallback, null, 2);
    fs.writeFileSync(filePath, initialData, 'utf8');
  }
}

function readJson(name, fallback = []) {
  const filePath = stores[name];
  ensureStore(filePath, fallback);
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return parsed || fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(name, value) {
  ensureStore(stores[name], Array.isArray(value) ? [] : {});
  fs.writeFileSync(stores[name], JSON.stringify(value, null, 2), 'utf8');
}

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function addActivity(type, message, entity) {
  const activities = readJson('activities');
  activities.unshift({ id: id('act'), type, message, entity, createdAt: now() });
  writeJson('activities', activities.slice(0, 80));
}

function addNotification(title, message, type = 'info') {
  const notifications = readJson('notifications');
  notifications.unshift({ id: id('noti'), title, message, type, read: false, createdAt: now() });
  writeJson('notifications', notifications.slice(0, 80));
}

function normalizeAlumni(payload, existing = {}) {
  const fullName = String(payload.fullName || payload.name || `${payload.firstName || ''} ${payload.lastName || ''}`).trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = String(payload.firstName || parts[0] || existing.firstName || '').trim();
  const lastName = String(payload.lastName || parts.slice(1).join(' ') || existing.lastName || '').trim();
  const email = String(payload.email || existing.email || '').trim().toLowerCase();
  const graduationYear = String(payload.graduationYear || payload.year || existing.graduationYear || '').trim();

  return {
    ...existing,
    _id: existing._id || id('alu'),
    firstName,
    lastName,
    fullName: fullName || `${firstName} ${lastName}`.trim(),
    email,
    phone: String(payload.phone || payload.contact || existing.phone || '').trim(),
    studentId: String(payload.studentId || existing.studentId || '').trim(),
    department: String(payload.department || existing.department || '').trim(),
    program: String(payload.program || existing.program || '').trim(),
    graduationYear,
    batch: String(payload.batch || existing.batch || '').trim(),
    currentJob: String(payload.currentJob || existing.currentJob || '').trim(),
    company: String(payload.company || existing.company || '').trim(),
    location: String(payload.location || existing.location || '').trim(),
    linkedin: String(payload.linkedin || existing.linkedin || '').trim(),
    avatar: String(payload.avatar || existing.avatar || '').trim(),
    status: String(payload.status || existing.status || 'pending').toLowerCase(),
    bio: String(payload.bio || existing.bio || '').trim(),
    university: String(payload.university || existing.university || 'BAUST').trim(),
    role: String(payload.role || existing.role || 'alumni').trim(),
    createdAt: existing.createdAt || now(),
    updatedAt: now(),
  };
}

function validateAlumni(alumni, all, currentId) {
  const errors = {};
  if (!alumni.firstName) errors.firstName = 'First name is required.';
  if (!alumni.lastName) errors.lastName = 'Last name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alumni.email)) errors.email = 'Valid email is required.';
  if (alumni.graduationYear && !/^\d{4}$/.test(alumni.graduationYear)) errors.graduationYear = 'Graduation year must be four digits.';
  if (all.some((entry) => entry._id !== currentId && entry.email === alumni.email)) errors.email = 'Email already exists.';
  if (alumni.studentId && all.some((entry) => entry._id !== currentId && entry.studentId === alumni.studentId)) errors.studentId = 'Student ID already exists.';
  return errors;
}

function normalizeEvent(payload, existing = {}) {
  return {
    ...existing,
    id: existing.id || id('evt'),
    title: String(payload.title || existing.title || '').trim(),
    date: String(payload.date || existing.date || '').trim(),
    time: String(payload.time || existing.time || '').trim(),
    venue: String(payload.venue || existing.venue || '').trim(),
    description: String(payload.description || existing.description || '').trim(),
    image: String(payload.image || existing.image || '').trim(),
    capacity: Number(payload.capacity || existing.capacity || 0),
    status: String(payload.status || existing.status || 'draft').toLowerCase(),
    participants: Array.isArray(payload.participants) ? payload.participants : existing.participants || [],
    createdAt: existing.createdAt || now(),
    updatedAt: now(),
  };
}

function normalizeNews(payload, existing = {}) {
  return {
    ...existing,
    id: existing.id || id('news'),
    title: String(payload.title || existing.title || '').trim(),
    category: String(payload.category || existing.category || 'General').trim(),
    author: String(payload.author || existing.author || 'Admin').trim(),
    content: String(payload.content || payload.description || existing.content || '').trim(),
    image: String(payload.image || existing.image || '').trim(),
    status: String(payload.status || existing.status || 'draft').toLowerCase(),
    publishDate: String(payload.publishDate || existing.publishDate || '').trim(),
    createdAt: existing.createdAt || now(),
    updatedAt: now(),
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = String(item[key] || 'Unknown').trim() || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function csvEscape(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

function seedIfEmpty() {
  const alumni = readJson('alumni');
  if (!alumni.length) {
    writeJson('alumni', [
      normalizeAlumni({ firstName: 'Ayesha', lastName: 'Rahman', email: 'ayesha.rahman@example.com', department: 'CSE', graduationYear: '2022', batch: '14', status: 'active', currentJob: 'Software Engineer', company: 'TechWave', location: 'Dhaka' }),
      normalizeAlumni({ firstName: 'Mahmud', lastName: 'Hasan', email: 'mahmud.hasan@example.com', department: 'EEE', graduationYear: '2021', batch: '13', status: 'pending', currentJob: 'Project Engineer', company: 'PowerGrid', location: 'Saidpur' }),
    ]);
  }
  if (!readJson('events').length) {
    writeJson('events', [
      normalizeEvent({ title: 'Annual Alumni Reunion', date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10), time: '17:00', venue: 'BAUST Auditorium', capacity: 300, status: 'published', description: 'Annual reunion and networking evening.' }),
    ]);
  }
  if (!readJson('news').length) {
    writeJson('news', [
      normalizeNews({ title: 'Alumni Association Launches Mentorship Program', category: 'Announcement', status: 'published', publishDate: new Date().toISOString().slice(0, 10), content: 'Senior alumni can now mentor current students and fresh graduates.' }),
    ]);
  }
  if (!Object.keys(readJson('settings', {})).length) {
    writeJson('settings', {
      associationName: 'BAUST Alumni Association',
      contactEmail: 'alumni@baust.edu.bd',
      phone: '+880 1234 567890',
      address: 'BAUST Campus, Saidpur',
      website: 'https://baust.edu.bd',
      adminName: 'Admin',
      adminEmail: 'admin@baust.edu.bd',
      notifications: { newAlumni: true, events: true, system: true },
      version: '1.0.0',
    });
  }
}

seedIfEmpty();

router.get('/dashboard', (req, res) => {
  const alumni = readJson('alumni').map((entry) => normalizeAlumni(entry, entry));
  const events = readJson('events').map((entry) => normalizeEvent(entry, entry));
  const news = readJson('news').map((entry) => normalizeNews(entry, entry));
  const activities = readJson('activities').slice(0, 8);
  const today = new Date().toISOString().slice(0, 10);

  const growth = countBy(alumni, 'graduationYear');
  const stats = {
    totalAlumni: alumni.length,
    activeAlumni: alumni.filter((entry) => entry.status === 'active').length,
    pendingAlumni: alumni.filter((entry) => entry.status === 'pending').length,
    totalEvents: events.length,
    upcomingEvents: events.filter((entry) => entry.date >= today).length,
    totalNews: news.length,
    eventRegistrations: events.reduce((sum, event) => sum + (event.participants || []).length, 0),
  };

  res.json({
    stats,
    recentRegistrations: alumni.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    recentActivities: activities,
    charts: {
      alumniGrowth: Object.entries(growth).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value })),
      alumniByYear: Object.entries(countBy(alumni, 'graduationYear')).map(([label, value]) => ({ label, value })),
      alumniByDepartment: Object.entries(countBy(alumni, 'department')).map(([label, value]) => ({ label, value })),
      alumniByLocation: Object.entries(countBy(alumni, 'location')).map(([label, value]) => ({ label, value })),
      eventParticipation: events.map((event) => ({ label: event.title, value: (event.participants || []).length })),
      alumniStatus: Object.entries(countBy(alumni, 'status')).map(([label, value]) => ({ label, value })),
    },
  });
});

router.get('/alumni/export', (req, res) => {
  const rows = readJson('alumni').map((entry) => normalizeAlumni(entry, entry));
  const header = ['Name', 'Email', 'Phone', 'Student ID', 'Department', 'Program', 'Graduation Year', 'Batch', 'Job', 'Company', 'Location', 'Status', 'Created At'];
  const lines = rows.map((entry) => [
    entry.fullName, entry.email, entry.phone, entry.studentId, entry.department, entry.program, entry.graduationYear, entry.batch,
    entry.currentJob, entry.company, entry.location, entry.status, entry.createdAt,
  ].map(csvEscape).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="alumni-export.csv"');
  res.send([header.map(csvEscape).join(','), ...lines].join('\n'));
});

router.get('/alumni', (req, res) => {
  let rows = readJson('alumni').map((entry) => normalizeAlumni(entry, entry));
  const q = String(req.query.q || '').toLowerCase();
  const status = String(req.query.status || '');
  const department = String(req.query.department || '');
  const sort = String(req.query.sort || 'createdAt');
  const direction = String(req.query.direction || 'desc') === 'asc' ? 1 : -1;
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 100);

  if (q) rows = rows.filter((entry) => [entry.fullName, entry.email, entry.department, entry.studentId, entry.location].join(' ').toLowerCase().includes(q));
  if (status) rows = rows.filter((entry) => entry.status === status);
  if (department) rows = rows.filter((entry) => entry.department === department);

  rows.sort((a, b) => String(a[sort] || '').localeCompare(String(b[sort] || '')) * direction);
  const total = rows.length;
  const start = (page - 1) * pageSize;
  res.json({ rows: rows.slice(start, start + pageSize), total, page, pageSize });
});

router.post('/alumni', (req, res) => {
  const rows = readJson('alumni').map((entry) => normalizeAlumni(entry, entry));
  const alumni = normalizeAlumni(req.body);
  const errors = validateAlumni(alumni, rows);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  rows.unshift(alumni);
  writeJson('alumni', rows);
  addActivity('alumni', `Added alumni ${alumni.fullName}`, alumni._id);
  addNotification('New alumni added', `${alumni.fullName} was added to the directory.`, 'success');
  res.status(201).json(alumni);
});

router.get('/alumni/:id', (req, res) => {
  const alumni = readJson('alumni').map((entry) => normalizeAlumni(entry, entry)).find((entry) => entry._id === req.params.id);
  if (!alumni) return res.status(404).json({ message: 'Alumni not found.' });
  res.json(alumni);
});

router.put('/alumni/:id', (req, res) => {
  const rows = readJson('alumni').map((entry) => normalizeAlumni(entry, entry));
  const index = rows.findIndex((entry) => entry._id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Alumni not found.' });
  const alumni = normalizeAlumni(req.body, rows[index]);
  const errors = validateAlumni(alumni, rows, req.params.id);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  rows[index] = alumni;
  writeJson('alumni', rows);
  addActivity('alumni', `Updated alumni ${alumni.fullName}`, alumni._id);
  res.json(alumni);
});

router.delete('/alumni/:id', (req, res) => {
  const rows = readJson('alumni');
  const target = rows.find((entry) => entry._id === req.params.id);
  const nextRows = rows.filter((entry) => entry._id !== req.params.id);
  if (nextRows.length === rows.length) return res.status(404).json({ message: 'Alumni not found.' });
  writeJson('alumni', nextRows);
  addActivity('alumni', `Deleted alumni ${target.fullName || target.email}`, req.params.id);
  res.json({ message: 'Alumni deleted.' });
});

router.post('/alumni/bulk', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const action = String(req.body.action || '');
  let rows = readJson('alumni').map((entry) => normalizeAlumni(entry, entry));
  if (action === 'delete') rows = rows.filter((entry) => !ids.includes(entry._id));
  if (['active', 'inactive', 'pending', 'rejected'].includes(action)) {
    rows = rows.map((entry) => ids.includes(entry._id) ? { ...entry, status: action, updatedAt: now() } : entry);
  }
  writeJson('alumni', rows);
  addActivity('bulk', `Bulk ${action} applied to ${ids.length} alumni`, 'alumni');
  res.json({ message: 'Bulk action completed.' });
});

function collectionRoutes(name, normalize, label) {
  router.get(`/${name}`, (req, res) => res.json(readJson(name).map((entry) => normalize(entry, entry))));
  router.post(`/${name}`, (req, res) => {
    const rows = readJson(name).map((entry) => normalize(entry, entry));
    const item = normalize(req.body);
    if (!item.title) return res.status(400).json({ message: `${label} title is required.` });
    rows.unshift(item);
    writeJson(name, rows);
    addActivity(name, `Created ${label.toLowerCase()} ${item.title}`, item.id);
    res.status(201).json(item);
  });
  router.put(`/${name}/:id`, (req, res) => {
    const rows = readJson(name).map((entry) => normalize(entry, entry));
    const index = rows.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: `${label} not found.` });
    const item = normalize(req.body, rows[index]);
    rows[index] = item;
    writeJson(name, rows);
    addActivity(name, `Updated ${label.toLowerCase()} ${item.title}`, item.id);
    res.json(item);
  });
  router.delete(`/${name}/:id`, (req, res) => {
    const rows = readJson(name);
    const target = rows.find((entry) => entry.id === req.params.id);
    const nextRows = rows.filter((entry) => entry.id !== req.params.id);
    if (rows.length === nextRows.length) return res.status(404).json({ message: `${label} not found.` });
    writeJson(name, nextRows);
    addActivity(name, `Deleted ${label.toLowerCase()} ${target.title}`, req.params.id);
    res.json({ message: `${label} deleted.` });
  });
}

collectionRoutes('events', normalizeEvent, 'Event');
collectionRoutes('news', normalizeNews, 'News');

router.get('/settings', (req, res) => res.json(readJson('settings', {})));
router.put('/settings', (req, res) => {
  const settings = { ...readJson('settings', {}), ...req.body, updatedAt: now() };
  writeJson('settings', settings);
  addActivity('settings', 'Updated system settings', 'settings');
  res.json(settings);
});

router.get('/notifications', (req, res) => res.json(readJson('notifications')));
router.post('/notifications/read', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : null;
  const rows = readJson('notifications').map((entry) => ids === null || ids.includes(entry.id) ? { ...entry, read: true } : entry);
  writeJson('notifications', rows);
  res.json({ message: 'Notifications updated.' });
});

router.get('/search', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  if (!q) return res.json([]);
  const alumni = readJson('alumni').map((entry) => normalizeAlumni(entry, entry)).filter((entry) => [entry.fullName, entry.email, entry.department].join(' ').toLowerCase().includes(q)).slice(0, 5)
    .map((entry) => ({ type: 'Alumni', title: entry.fullName, subtitle: entry.email, target: `alumni:${entry._id}` }));
  const events = readJson('events').filter((entry) => [entry.title, entry.venue].join(' ').toLowerCase().includes(q)).slice(0, 5)
    .map((entry) => ({ type: 'Event', title: entry.title, subtitle: entry.date, target: `events:${entry.id}` }));
  const news = readJson('news').filter((entry) => [entry.title, entry.category].join(' ').toLowerCase().includes(q)).slice(0, 5)
    .map((entry) => ({ type: 'News', title: entry.title, subtitle: entry.category, target: `news:${entry.id}` }));
  res.json([...alumni, ...events, ...news].slice(0, 10));
});

module.exports = router;
