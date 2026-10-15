import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pomofocus_super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or expired' });
    }
    req.user = user;
    next();
  });
};

// ----------------- AUTH ENDPOINTS -----------------

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const stmt = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    const info = stmt.run(name.trim(), cleanEmail, passwordHash);
    const userId = info.lastInsertRowid;

    // Initialize user data record
    db.prepare('INSERT INTO user_data (user_id) VALUES (?)').run(userId);

    const token = jwt.sign({ id: userId, email: cleanEmail, name }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      token,
      user: { id: userId, name, email: cleanEmail },
      data: { tasks: [], templates: [], settings: null, pomodoroCount: 0 },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '30d',
    });

    // Fetch synced data
    const row = db.prepare('SELECT * FROM user_data WHERE user_id = ?').get(user.id);
    let userData = { tasks: [], templates: [], settings: null, pomodoroCount: 0 };
    if (row) {
      try {
        userData = {
          tasks: JSON.parse(row.tasks_json || '[]'),
          templates: JSON.parse(row.templates_json || '[]'),
          settings: row.settings_json ? JSON.parse(row.settings_json) : null,
          pomodoroCount: row.pomodoro_count || 0,
        };
      } catch (e) {
        console.warn('JSON parse error loading user data');
      }
    }

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      data: userData,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Verify & Get Current User profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const row = db.prepare('SELECT * FROM user_data WHERE user_id = ?').get(user.id);
  let userData = { tasks: [], templates: [], settings: null, pomodoroCount: 0 };
  if (row) {
    try {
      userData = {
        tasks: JSON.parse(row.tasks_json || '[]'),
        templates: JSON.parse(row.templates_json || '[]'),
        settings: row.settings_json ? JSON.parse(row.settings_json) : null,
        pomodoroCount: row.pomodoro_count || 0,
      };
    } catch (e) {
      console.warn('JSON parse error');
    }
  }

  res.json({
    user,
    data: userData,
  });
});

// ----------------- SYNC DATA ENDPOINTS (FOR MULTIPLE SYSTEMS) -----------------

// Push updated tasks, templates, count, and settings to database
app.post('/api/sync', authenticateToken, (req, res) => {
  try {
    const { tasks, templates, settings, pomodoroCount } = req.body;

    const stmt = db.prepare(`
      INSERT INTO user_data (user_id, tasks_json, templates_json, settings_json, pomodoro_count, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        tasks_json = excluded.tasks_json,
        templates_json = excluded.templates_json,
        settings_json = excluded.settings_json,
        pomodoro_count = excluded.pomodoro_count,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      req.user.id,
      JSON.stringify(tasks || []),
      JSON.stringify(templates || []),
      JSON.stringify(settings || {}),
      pomodoroCount || 0
    );

    res.json({ success: true, message: 'Data synced across systems successfully' });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// ----------------- HEALTH & SYSTEM ENDPOINTS -----------------

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    app: 'Pomofocus Pro with SQLite Sync',
  });
});

app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// Serve Vite compiled static production build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for Single Page Application routing (Express 5 syntax)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Render Keep-Alive self-pinger (pings every 10 min)
const PING_INTERVAL_MS = 10 * 60 * 1000;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

if (RENDER_EXTERNAL_URL) {
  console.log(`Self-ping keep-alive activated targeting: ${RENDER_EXTERNAL_URL}/health`);
  setInterval(() => {
    fetch(`${RENDER_EXTERNAL_URL}/health`)
      .then((res) => console.log(`[Keep-Alive] Pinged ${RENDER_EXTERNAL_URL}/health - Status: ${res.status}`))
      .catch((err) => console.warn('[Keep-Alive] Ping warning:', err.message));
  }, PING_INTERVAL_MS);
}

app.listen(PORT, () => {
  console.log(`Server & Database active on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
