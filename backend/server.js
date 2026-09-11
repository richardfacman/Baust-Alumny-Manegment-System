const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const dns = require('dns').promises;
const alumniRoutes = require('./routes/alumni');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();
const basePort = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;
const staticSiteDir = path.join(__dirname, '..', 'BAUST', 'BAUST');
const dataDir = process.env.VERCEL ? path.join('/tmp', 'baust-data') : path.join(staticSiteDir, 'data');
const usersFilePath = path.join(dataDir, 'users.json');
const server = http.createServer(app);

function ensureUsersStore() {
  const usersDir = path.dirname(usersFilePath);
  if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
  }
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, '[]', 'utf8');
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const adminToken = process.env.ADMIN_TOKEN || hashPassword('admin:1234:baust-admin');

function readUsers() {
  ensureUsersStore();
  try {
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  ensureUsersStore();
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
}

function registerUser(payload) {
  const firstName = String(payload.firstName || payload.fname || payload.firstname || '').trim();
  const lastName = String(payload.lastName || payload.lname || payload.lastname || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  if (!firstName || !lastName || !email || !password) {
    return { success: false, status: 400, message: 'Please fill in all required fields.' };
  }

  const users = readUsers();
  if (users.some((user) => user.email === email)) {
    return { success: false, status: 409, message: 'Email already exists.' };
  }

  const user = {
    id: Date.now(),
    firstName,
    lastName,
    email,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);
  return { success: true, status: 200, user };
}

function authenticateUser(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  if (!email || !password) {
    return { success: false, status: 400, message: 'Please provide your email and password.' };
  }

  const users = readUsers();
  const user = users.find((entry) => entry.email === email && entry.password === hashPassword(password));
  if (!user) {
    return { success: false, status: 401, message: 'Invalid email or password.' };
  }

  return {
    success: true,
    status: 200,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  };
}

function authenticateAdmin(payload) {
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '').trim();

  if (username === 'admin' && password === '1234') {
    return { success: true, status: 200, message: 'Admin login successful.', token: adminToken };
  }

  return { success: false, status: 401, message: 'Invalid admin credentials.' };
}

function requireAdmin(req, res, next) {
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : String(req.headers['x-admin-token'] || '');
  if (token !== adminToken) {
    return res.status(401).json({ message: 'Admin authentication required.' });
  }
  return next();
}

async function listenOnAvailablePort(startPort, maxAttempts = 10) {
  let currentPort = startPort;

  while (currentPort < startPort + maxAttempts) {
    try {
      await new Promise((resolve, reject) => {
        const onError = (err) => {
          server.off('listening', resolve);
          reject(err);
        };

        server.once('error', onError);
        server.once('listening', () => {
          server.off('error', onError);
          resolve();
        });

        server.listen(currentPort);
      });

      return currentPort;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        console.warn(`Port ${currentPort} is already in use. Trying port ${currentPort + 1}...`);
        currentPort += 1;
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Unable to bind to any port between ${startPort} and ${startPort + maxAttempts - 1}`);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    message: 'BAUST Alumni Management API is running.',
    staticSite: '/site',
  });
});

app.get('/site', (req, res) => {
  res.sendFile(path.join(staticSiteDir, 'index.html'));
});

app.get('/site/index.php', (req, res) => {
  res.sendFile(path.join(staticSiteDir, 'index.html'));
});

app.get('/site/RegistrationForm.php', (req, res) => {
  res.sendFile(path.join(staticSiteDir, 'registration form.html'));
});

app.get('/site/register.php', (req, res) => {
  res.redirect('/site/registration%20form.html');
});

app.post('/site/register.php', (req, res) => {
  const isSignup = Object.prototype.hasOwnProperty.call(req.body, 'signUp');
  if (isSignup) {
    const result = registerUser(req.body);
    if (!result.success) {
      return res.status(result.status).send(result.message);
    }
    return res.redirect('/site/index.html');
  }

  const loginResult = authenticateUser(req.body);
  if (!loginResult.success) {
    return res.status(loginResult.status).send(loginResult.message);
  }
  return res.redirect('/site/index.html');
});

app.post('/api/auth/register', (req, res) => {
  const result = registerUser(req.body);
  if (!result.success) {
    return res.status(result.status).json({ success: false, message: result.message });
  }
  return res.json({ success: true, message: 'Registration successful.' });
});

app.post('/api/auth/login', (req, res) => {
  const result = authenticateUser(req.body);
  if (!result.success) {
    return res.status(result.status).json({ success: false, message: result.message });
  }
  return res.json({ success: true, user: result.user });
});

app.post('/api/auth/admin-login', (req, res) => {
  const result = authenticateAdmin(req.body);
  if (!result.success) {
    return res.status(result.status).json({ success: false, message: result.message });
  }
  return res.json({ success: true, message: result.message, token: result.token });
});

app.use('/site', express.static(staticSiteDir));
app.use('/api/alumni', alumniRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);

function parseMongoUri(uri) {
  const cleaned = uri.replace(/^mongodb\+srv:\/\//, '').replace(/^mongodb:\/\//, '');
  const [authAndHost, queryString] = cleaned.split('?');
  const [authPart, hostPart] = authAndHost.includes('@') ? authAndHost.split('@') : [null, authAndHost];
  const [username, password] = authPart ? authPart.split(':') : [null, null];
  const slashIndex = hostPart.indexOf('/');
  const hosts = slashIndex >= 0 ? hostPart.slice(0, slashIndex) : hostPart;
  const dbName = slashIndex >= 0 ? hostPart.slice(slashIndex + 1) : '';
  const searchParams = new URLSearchParams(queryString || '');

  return { username, password, hosts, dbName, searchParams };
}

async function resolveAtlasFallbackUri(uri) {
  const { username, password, hosts, dbName, searchParams } = parseMongoUri(uri);
  const domain = hosts.split(',')[0];
  const resolver = new dns.Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);

  const srvName = `_mongodb._tcp.${domain}`;
  const srvRecords = await resolver.resolveSrv(srvName);
  const fallbackHosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');

  if (!searchParams.has('tls')) {
    searchParams.set('tls', 'true');
  }
  if (!searchParams.has('retryWrites')) {
    searchParams.set('retryWrites', 'true');
  }
  if (!searchParams.has('directConnection')) {
    searchParams.set('directConnection', 'false');
  }
  if (username && !searchParams.has('authSource')) {
    searchParams.set('authSource', 'admin');
  }

  const auth = username ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : '';
  const dbPath = dbName ? `/${dbName}` : '';
  return `mongodb://${auth}${fallbackHosts}${dbPath}?${searchParams.toString()}`;
}

async function connectDatabase() {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri, options);
      console.log('Connected to MongoDB Atlas.');
      return conn;
    } catch (error) {
      console.warn('MongoDB Atlas connection failed:', error.message);
      if (mongoUri.startsWith('mongodb+srv://') && /querySrv|ECONNREFUSED|ENOTFOUND/i.test(error.message)) {
        try {
          const fallbackUri = await resolveAtlasFallbackUri(mongoUri);
          console.log('Attempting Atlas connection using fallback URI.');
          const conn = await mongoose.connect(fallbackUri, options);
          console.log('Connected to MongoDB Atlas using fallback host list.');
          return conn;
        } catch (fallbackError) {
          console.warn('Atlas fallback connection failed:', fallbackError.message);
        }
      }
      console.warn('Continuing without MongoDB. Alumni API will use local JSON storage.');
    }
  } else {
    console.warn('No MONGODB_URI found. Alumni API will use local JSON storage.');
  }

  return null;
}

if (process.env.VERCEL) {
  connectDatabase().catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });
} else {
  connectDatabase()
    .then(async () => {
      if (mongoose.connection.readyState === 1) {
        console.log('Connected to MongoDB');
      }
      const activePort = await listenOnAvailablePort(basePort);
      console.log(`Server is running on port ${activePort}`);
      if (mongoose.connection.readyState !== 1) {
        console.log('Using local JSON storage for alumni data.');
      }
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error.message);
      process.exit(1);
    });
}

module.exports = app;
