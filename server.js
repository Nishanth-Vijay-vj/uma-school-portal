const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000
    })
  : null;

const defaultState = {
  admissions: [
    { student: 'Arjun V', parent: 'Vijay', phone: '+91 98200 12121', className: 'Grade 9', date: '12 Aug 2025', status: 'New', notes: 'Interested in science stream', remarks: 'Follow-up on Friday' },
    { student: 'Meera P', parent: 'Priya', phone: '+91 98888 43210', className: 'Grade 7', date: '10 Aug 2025', status: 'Contacted', notes: 'Asked for campus tour', remarks: 'Tour scheduled' },
    { student: 'Nisha R', parent: 'Raja', phone: '+91 90300 78912', className: 'Grade 11', date: '08 Aug 2025', status: 'Visit Scheduled', notes: 'Documents pending', remarks: 'Need counseling' },
    { student: 'Dhruv S', parent: 'Shankar', phone: '+91 90567 29081', className: 'Grade 12', date: '04 Aug 2025', status: 'Admission Confirmed', notes: 'Fee process in progress', remarks: 'Ready for enrollment' }
  ],
  content: [
    { title: 'Science Expo 2025', description: 'Scheduled for 24 Sep', date: '12 Aug 2025' },
    { title: 'Holiday Notice', description: 'Monsoon break on 15 Aug', date: '10 Aug 2025' },
    { title: 'Parent Orientation', description: 'Campus briefing for parents on 18 Sep', date: '14 Aug 2025' }
  ],
  gallery: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80'
  ],
  documents: [
    { name: 'Academic Calendar.pdf', icon: 'fa-file-pdf', dataUrl: '' },
    { name: 'Faculty Roster.docx', icon: 'fa-file-word', dataUrl: '' },
    { name: 'Disclosures.csv', icon: 'fa-file-csv', dataUrl: '' }
  ]
};

const clone = value => JSON.parse(JSON.stringify(value));
const asText = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const normalizeState = state => ({
  admissions: Array.isArray(state?.admissions) ? state.admissions.map(row => ({
    student: asText(row.student, 120), parent: asText(row.parent, 120), phone: asText(row.phone, 30),
    className: asText(row.className, 50), date: asText(row.date, 40), status: asText(row.status, 50),
    notes: asText(row.notes, 500), remarks: asText(row.remarks, 500)
  })).slice(0, 2000) : clone(defaultState.admissions),
  content: Array.isArray(state?.content) ? state.content.map(item => ({
    title: asText(item.title, 160), description: asText(item.description, 1000), date: asText(item.date, 40)
  })).slice(0, 200) : clone(defaultState.content),
  gallery: Array.isArray(state?.gallery) ? state.gallery.filter(item => typeof item === 'string' && (item.startsWith('https://') || item.startsWith('data:image/'))).slice(0, 100) : clone(defaultState.gallery),
  documents: Array.isArray(state?.documents) ? state.documents.map(doc => ({
    name: asText(doc.name, 180), icon: asText(doc.icon, 50) || 'fa-file', dataUrl: typeof doc.dataUrl === 'string' ? doc.dataUrl : ''
  })).slice(0, 100) : clone(defaultState.documents)
});

let initializationPromise;
const ensureDatabase = () => {
  if (!pool) return Promise.resolve(false);
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS site_state (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query(
        `INSERT INTO site_state (id, data) VALUES ('default', $1::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(defaultState)]
      );
      return true;
    })().catch(error => {
      initializationPromise = undefined;
      throw error;
    });
  }
  return initializationPromise;
};

const localFile = path.join(ROOT, 'data', 'siteData.json');
const readLocal = () => {
  try { return normalizeState(JSON.parse(fs.readFileSync(localFile, 'utf8'))); }
  catch { return clone(defaultState); }
};
const writeLocal = state => {
  fs.mkdirSync(path.dirname(localFile), { recursive: true });
  fs.writeFileSync(localFile, JSON.stringify(state, null, 2));
  return state;
};

const requireStorage = async () => {
  if (!pool) {
    if (IS_VERCEL) throw new Error('DATABASE_URL is missing in this Vercel deployment');
    return false;
  }
  await ensureDatabase();
  return true;
};
const readState = async () => {
  if (!(await requireStorage())) return readLocal();
  const result = await pool.query("SELECT data FROM site_state WHERE id='default'");
  return normalizeState(result.rows[0]?.data || defaultState);
};
const writeState = async input => {
  const state = normalizeState(input);
  if (!(await requireStorage())) return writeLocal(state);
  const result = await pool.query(
    `INSERT INTO site_state (id, data, updated_at) VALUES ('default', $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=NOW()
     RETURNING data, updated_at`,
    [JSON.stringify(state)]
  );
  return { state: normalizeState(result.rows[0].data), updatedAt: result.rows[0].updated_at };
};

app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
});
app.use(express.static(ROOT, { index: false, maxAge: IS_VERCEL ? '1h' : 0 }));

app.get('/health', async (req, res) => {
  try {
    const connected = await requireStorage();
    if (connected) await pool.query('SELECT 1');
    res.json({ ok: true, databaseConfigured: Boolean(pool), databaseConnected: Boolean(connected), storage: connected ? 'neon-postgresql' : 'local-json' });
  } catch (error) {
    res.status(503).json({ ok: false, databaseConfigured: Boolean(pool), databaseConnected: false, error: error.message });
  }
});
app.get('/api/state', async (req, res) => {
  try { res.json(await readState()); }
  catch (error) { console.error(error); res.status(503).json({ message: 'Unable to read Neon database', error: error.message }); }
});
app.put('/api/state', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ message: 'A valid state object is required' });
    const saved = await writeState(req.body);
    res.json(saved.state || saved);
  } catch (error) { console.error(error); res.status(503).json({ message: 'Unable to save to Neon database', error: error.message }); }
});
app.post('/api/admissions', async (req, res) => {
  try {
    const body = req.body || {};
    if (!asText(body.studentName) || !asText(body.parentName) || !asText(body.mobile)) return res.status(400).json({ message: 'Student name, parent name and mobile number are required' });
    const state = await readState();
    state.admissions.unshift({
      student: asText(body.studentName, 120), parent: asText(body.parentName, 120), phone: asText(body.mobile, 30),
      className: asText(body.classApplying, 50), date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date()),
      status: 'New', notes: asText(body.message, 500) || 'Submitted via website enquiry form', remarks: 'Awaiting review'
    });
    const saved = await writeState(state);
    res.status(201).json(saved.state || saved);
  } catch (error) { console.error(error); res.status(503).json({ message: 'Unable to save admission enquiry', error: error.message }); }
});
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get(['/admin', '/admin.html'], (req, res) => res.sendFile(path.join(ROOT, 'admin.html')));
app.use((req, res) => res.status(404).send('Not found'));

if (require.main === module) {
  app.listen(PORT, () => console.log(`UMA portal running at http://localhost:${PORT}`));
}
module.exports = app;
