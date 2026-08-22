const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const dataPath = path.join(__dirname, 'data', 'siteData.json');
const publicDir = __dirname;
const connectionString = process.env.DATABASE_URL || null;
const pool = connectionString ? new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}) : null;

const defaultState = {
  admissions: [
    {
      student: 'Arjun V',
      parent: 'Vijay',
      phone: '+91 98200 12121',
      className: 'Grade 9',
      date: '12 Aug 2025',
      status: 'New',
      notes: 'Interested in science stream',
      remarks: 'Follow-up on Friday'
    },
    {
      student: 'Meera P',
      parent: 'Priya',
      phone: '+91 98888 43210',
      className: 'Grade 7',
      date: '10 Aug 2025',
      status: 'Contacted',
      notes: 'Asked for campus tour',
      remarks: 'Tour scheduled'
    },
    {
      student: 'Nisha R',
      parent: 'Raja',
      phone: '+91 90300 78912',
      className: 'Grade 11',
      date: '08 Aug 2025',
      status: 'Visit Scheduled',
      notes: 'Documents pending',
      remarks: 'Need counseling'
    },
    {
      student: 'Dhruv S',
      parent: 'Shankar',
      phone: '+91 90567 29081',
      className: 'Grade 12',
      date: '04 Aug 2025',
      status: 'Admission Confirmed',
      notes: 'Fee process in progress',
      remarks: 'Ready for enrollment'
    }
  ],
  content: [
    { title: 'Science Expo 2025', description: 'Scheduled for 24 Sep', date: '12 Aug 2025' },
    { title: 'Holiday Notice', description: 'Monsoon break on 15 Aug', date: '10 Aug 2025' },
    { title: 'Parent Orientation', description: 'Campus briefing for parents on 18 Sep', date: '14 Aug 2025' }
  ],
  gallery: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80'
  ],
  documents: [
    { name: 'Academic Calendar.pdf', icon: 'fa-file-pdf' },
    { name: 'Faculty Roster.docx', icon: 'fa-file-word' },
    { name: 'Disclosures.csv', icon: 'fa-file-csv' }
  ]
};

const normalizeState = (state) => ({
  admissions: Array.isArray(state?.admissions) ? state.admissions : defaultState.admissions,
  content: Array.isArray(state?.content) ? state.content : defaultState.content,
  gallery: Array.isArray(state?.gallery) ? state.gallery : defaultState.gallery,
  documents: Array.isArray(state?.documents) ? state.documents : defaultState.documents
});

const ensureDataFile = () => {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(defaultState, null, 2), 'utf8');
  }
};

const readJsonState = () => {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    return JSON.parse(JSON.stringify(defaultState));
  }
};

const writeJsonState = (state) => {
  const normalized = normalizeState(state);
  fs.writeFileSync(dataPath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
};

const initializeDatabase = async () => {
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_state (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL
      )
    `);

    const result = await pool.query("SELECT data FROM site_state WHERE id = 'default' LIMIT 1");
    if (result.rows.length === 0) {
      await pool.query("INSERT INTO site_state (id, data) VALUES ('default', $1)", [JSON.stringify(defaultState)]);
    }
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  }
};

const readDatabaseState = async () => {
  if (!pool) return null;

  try {
    const result = await pool.query("SELECT data FROM site_state WHERE id = 'default' LIMIT 1");
    if (result.rows.length === 0) {
      await pool.query("INSERT INTO site_state (id, data) VALUES ('default', $1)", [JSON.stringify(defaultState)]);
      return JSON.parse(JSON.stringify(defaultState));
    }

    return normalizeState(result.rows[0].data);
  } catch (error) {
    console.error('Database read failed:', error.message);
    return null;
  }
};

const writeDatabaseState = async (state) => {
  if (!pool) return null;

  const normalized = normalizeState(state);
  try {
    await pool.query(
      `INSERT INTO site_state (id, data)
       VALUES ('default', $1)
       ON CONFLICT (id)
       DO UPDATE SET data = EXCLUDED.data`,
      [JSON.stringify(normalized)]
    );
    return normalized;
  } catch (error) {
    console.error('Database write failed:', error.message);
    return null;
  }
};

const readState = async () => {
  if (pool) {
    const dbState = await readDatabaseState();
    if (dbState) return dbState;
  }

  return readJsonState();
};

const writeState = async (state) => {
  if (pool) {
    const dbState = await writeDatabaseState(state);
    if (dbState) return dbState;
  }

  return writeJsonState(state);
};

app.use(express.json({ limit: '20mb' }));
app.use(express.static(publicDir, {
  index: false,
  extensions: ['html']
}));

const serveStaticAsset = (filename, contentType) => (req, res) => {
  const filePath = path.join(publicDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Not found');
  }

  res.setHeader('Content-Type', contentType);
  res.sendFile(filePath);
};

app.get('/script.js', serveStaticAsset('script.js', 'application/javascript; charset=utf-8'));
app.get('/admin.js', serveStaticAsset('admin.js', 'application/javascript; charset=utf-8'));
app.get('/styles.css', serveStaticAsset('styles.css', 'text/css; charset=utf-8'));
app.get('/admin.css', serveStaticAsset('admin.css', 'text/css; charset=utf-8'));
app.get('/uma-logo.png', serveStaticAsset('uma-logo.png', 'image/png'));

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'UMA school portal is running' });
});

app.get('/api/state', async (req, res) => {
  res.json(await readState());
});

app.put('/api/state', async (req, res) => {
  const next = req.body && typeof req.body === 'object' ? req.body : {};
  const saved = await writeState(next);
  res.json(saved);
});

app.post('/api/admissions', async (req, res) => {
  const payload = req.body || {};
  const state = await readState();
  const entry = {
    student: String(payload.studentName || '').trim(),
    parent: String(payload.parentName || '').trim(),
    phone: String(payload.mobile || '').trim(),
    className: String(payload.classApplying || '').trim(),
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'New',
    notes: 'Submitted via website enquiry form',
    remarks: 'Awaiting review'
  };

  state.admissions = [entry, ...state.admissions];
  const saved = await writeState(state);
  res.status(201).json(saved);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

const startServer = async () => {
  await initializeDatabase();
  if (require.main === module) {
    app.listen(port, () => {
      console.log(`UMA school portal running on http://localhost:${port}`);
      if (connectionString) {
        console.log('Production database mode enabled via DATABASE_URL');
      } else {
        console.log('Local JSON fallback mode enabled');
      }
    });
  }
};

startServer();
module.exports = app;
