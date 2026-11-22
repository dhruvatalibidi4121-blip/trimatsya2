const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  });
}

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = path.join(PUBLIC, 'uploads');
const DATA = path.join(ROOT, 'data');

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });

const db = new DatabaseSync(path.join(DATA, 'trimatsya.db'));
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  lat REAL,
  lng REAL,
  language TEXT DEFAULT 'en',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  species TEXT NOT NULL,
  local_name TEXT,
  quantity_kg REAL NOT NULL,
  item_condition TEXT NOT NULL,
  location TEXT NOT NULL,
  price_per_kg REAL NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  category TEXT,
  verified INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available',
  collection_requested INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'fresh',
  total_quantity REAL NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Requested',
  delivery_location TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  quantity_kg REAL NOT NULL,
  price_per_kg REAL NOT NULL,
  fisherman_id INTEGER NOT NULL,
  fisherman_payment REAL NOT NULL,
  fee_per_kg REAL NOT NULL,
  transport_per_kg REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  fisherman_id INTEGER NOT NULL,
  quantity_kg REAL NOT NULL,
  amount REAL NOT NULL,
  fee_amount REAL NOT NULL,
  transport_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  method TEXT DEFAULT 'Bank transfer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS waste_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  processor_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  quantity_kg REAL NOT NULL,
  scheduled_at TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Requested',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS logistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  waste_request_id INTEGER,
  type TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  transporter TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Requested',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS market_prices (
  species TEXT PRIMARY KEY,
  local_name TEXT,
  price_per_kg REAL NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const SPECIES_IMAGES = {
  Mackerel: '/images/mackerel.jpg',
  Sardines: '/images/fish-market-ram.jpg',
  'Seer Fish': '/images/seer-fish.jpg',
  Pomfret: '/images/pomfret.jpg',
  Prawns: '/images/prawns.jpg',
  Tuna: '/images/tuna.jpg',
  Anchovies: '/images/anchovies.jpg',
  'Fish Offcuts': '/images/dry-fish-sorting.jpg',
  'Fish Viscera': '/images/fish-oil-capsules.jpg',
  'Fish Frames': '/images/fishmeal-factory.jpg',
  'Processing Residue': '/images/compost-india.jpg',
  'Fish Skin & Scales': '/images/fish-sauce-factory.jpg'
};

const SPECIES_ALIASES = {
  bangude: 'Mackerel',
  mackerel: 'Mackerel',
  mathi: 'Sardines',
  sardine: 'Sardines',
  sardines: 'Sardines',
  anjal: 'Seer Fish',
  seer: 'Seer Fish',
  kingfish: 'Seer Fish',
  pomfret: 'Pomfret',
  prawn: 'Prawns',
  prawns: 'Prawns',
  shrimp: 'Prawns',
  tuna: 'Tuna',
  anchovy: 'Anchovies',
  anchovies: 'Anchovies',
  nethili: 'Anchovies'
};

const LOCATION_COORDS = {
  'Mangaluru Harbour': [12.9141, 74.856],
  'Panambur Fishing Jetty': [12.9178, 74.8624],
  'Kulai Fish Market': [12.887, 74.879],
  'Kasaragod Harbour': [12.4975, 74.9898],
  'Mangaluru': [12.9141, 74.856],
  'Baikampady Industrial Area': [12.8585, 74.8529]
};

function coordsFor(location) {
  return LOCATION_COORDS[location] || [12.9141, 74.856];
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function get(sql, ...params) {
  return db.prepare(sql).get(...params);
}

function all(sql, ...params) {
  return db.prepare(sql).all(...params);
}

function run(sql, ...params) {
  return db.prepare(sql).run(...params);
}

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    location: row.location,
    language: row.language || 'en',
    createdAt: row.created_at
  };
}

function listingWithMeta(row) {
  if (!row) return null;
  return {
    ...row,
    verified: Boolean(row.verified),
    collectionRequested: Boolean(row.collection_requested),
    marketPrice: row.market_price ?? row.price_per_kg,
    image: row.image || SPECIES_IMAGES[row.species] || '/images/fish-market-vizag.jpg'
  };
}

function parseCookies(header) {
  const result = {};
  String(header || '').split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  });
  return result;
}

function currentUser(req) {
  const token = parseCookies(req.headers.cookie).tm_session;
  if (!token) return null;
  return get('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?', token) || null;
}

function auth(req, res, next) {
  req.user = currentUser(req);
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have access to this section.' });
    next();
  };
}

function setSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  run('INSERT INTO sessions (token, user_id) VALUES (?, ?)', token, userId);
  res.setHeader('Set-Cookie', `tm_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

function clean(value, max = 300) {
  return String(value ?? '').trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

async function saveImage(value, fallback) {
  const source = String(value || '').trim();
  if (!source) return fallback;
  try {
    const match = source.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/i);
    let buffer;
    let ext;
    if (match) {
      ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
    } else if (/^https:\/\//i.test(source)) {
      const response = await fetch(source, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) return fallback;
      const type = response.headers.get('content-type') || '';
      if (!type.startsWith('image/')) return fallback;
      ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg';
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      return fallback;
    }
    if (!buffer.length || buffer.length > 8 * 1024 * 1024) return fallback;
    const filename = `${crypto.randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS, filename), buffer);
    return `/uploads/${filename}`;
  } catch {
    return fallback;
  }
}

function listingQuery(where = '', params = [], order = 'l.created_at DESC, l.id DESC') {
  return all(`
    SELECT l.*, u.name AS seller_name, u.phone AS seller_phone, u.location AS seller_location,
           mp.price_per_kg AS market_price
    FROM listings l
    JOIN users u ON u.id = l.user_id
    LEFT JOIN market_prices mp ON mp.species = l.species
    ${where}
    ORDER BY ${order}
  `, ...params).map(listingWithMeta);
}

function seed() {
  const count = get('SELECT COUNT(*) AS count FROM users').count;
  if (count > 0) return;

  const u = (name, email, password, role, location, phone) => {
    const [lat, lng] = coordsFor(location);
    const info = run(
      'INSERT INTO users (name,email,password_hash,role,phone,location,lat,lng,language) VALUES (?,?,?,?,?,?,?,?,?)',
      name, email, hashPassword(password), role, phone, location, lat, lng, 'en'
    );
    return Number(info.lastInsertRowid);
  };

  const admin = u('TRI-MATSYA Admin', 'admin@trimatsya.in', 'admin123', 'admin', 'Mangaluru', '+91 90000 00001');
  const ravi = u('Ravi Poojary', 'ravi@demo.in', 'fish123', 'fisherman', 'Mangaluru Harbour', '+91 94480 10001');
  const anil = u('Anil Naik', 'anil@demo.in', 'fish123', 'fisherman', 'Panambur Fishing Jetty', '+91 94480 10002');
  const sheela = u('Sheela D’Souza', 'sheela@demo.in', 'fish123', 'fisherman', 'Kulai Fish Market', '+91 94480 10003');
  const manjunath = u('Manjunath Gowda', 'manjunath@demo.in', 'fish123', 'fisherman', 'Kasaragod Harbour', '+91 94480 10004');
  const buyer = u('Coastal Spice Restaurant', 'buyer@demo.in', 'buyer123', 'buyer', 'Mangaluru', '+91 98450 20001');
  const buyer2 = u('Sea Pearl Hotels', 'hotel@demo.in', 'buyer123', 'buyer', 'Mangaluru', '+91 98450 20002');
  const processor = u('Ocean Agri Industries', 'processor@demo.in', 'process123', 'processor', 'Baikampady Industrial Area', '+91 98450 30001');
  const processor2 = u('Coastal Bio-Resources', 'research@demo.in', 'process123', 'processor', 'Mangaluru', '+91 98450 30002');

  const prices = [
    ['Mackerel', 'Bangude', 180],
    ['Sardines', 'Mathi', 100],
    ['Seer Fish', 'Anjal', 540],
    ['Pomfret', 'Avoli', 480],
    ['Prawns', 'Kemba', 640],
    ['Tuna', 'Churumi', 255],
    ['Anchovies', 'Nethili', 84]
  ];
  prices.forEach(([species, localName, price]) => {
    run('INSERT INTO market_prices (species,local_name,price_per_kg) VALUES (?,?,?)', species, localName, price);
  });

  const fresh = [
    [ravi, 'Mackerel', 100, 168, 'Fresh', 'Mangaluru Harbour', 'Box-packed, ice-chilled catch landed this morning.'],
    [anil, 'Mackerel', 150, 172, 'Fresh', 'Panambur Fishing Jetty', 'Single-day catch, graded and iced at the harbour.'],
    [sheela, 'Mackerel', 120, 170, 'Chilled', 'Kulai Fish Market', 'Uniform size, verified at the collection point.'],
    [manjunath, 'Mackerel', 130, 169, 'Fresh', 'Kasaragod Harbour', 'Clean catch ready for same-day collection.'],
    [anil, 'Sardines', 220, 92, 'Fresh', 'Panambur Fishing Jetty', 'Bulk sardine catch suitable for restaurants and processors.'],
    [ravi, 'Seer Fish', 60, 520, 'Chilled', 'Mangaluru Harbour', 'Premium quality, carefully handled on board.'],
    [sheela, 'Pomfret', 45, 460, 'Chilled', 'Kulai Fish Market', 'White pomfret, size graded and ice packed.'],
    [manjunath, 'Prawns', 80, 610, 'Fresh', 'Kasaragod Harbour', 'Head-on prawns, washed and chilled.'],
    [ravi, 'Tuna', 180, 240, 'Fresh', 'Mangaluru Harbour', 'Ocean-caught tuna, suitable for processing.'],
    [anil, 'Anchovies', 140, 76, 'Fresh', 'Panambur Fishing Jetty', 'Clean anchovies for bulk buyers.']
  ];
  fresh.forEach(([userId, species, quantity, price, condition, location, description], index) => {
    run(
      'INSERT INTO listings (user_id,type,species,local_name,quantity_kg,item_condition,location,price_per_kg,image,description,category,verified,status,collection_requested,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      userId, 'fresh', species, prices.find((p) => p[0] === species)?.[1] || '', quantity, condition, location, price,
      SPECIES_IMAGES[species], description, 'Fresh fish', index < 8 ? 1 : 0, 'available', 0,
      new Date(Date.now() - (index + 1) * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    );
  });

  const waste = [
    [ravi, 'Fish Offcuts', 300, 14, 'Fishmeal', 'Fresh trimmings, segregated at source', '/images/dry-fish-sorting.jpg', 'approved', 1],
    [sheela, 'Processing Residue', 500, 8, 'Organic Fertilizer', 'Non-food-grade processing residue, approved for composting', '/images/compost-india.jpg', 'approved', 1],
    [anil, 'Fish Viscera', 120, 22, 'Fish Oil', 'Segregated for authorized oil extraction', '/images/fish-oil-capsules.jpg', 'approved', 1],
    [manjunath, 'Fish Frames', 260, 12, 'Fishmeal', 'Frames from mechanical filleting, chilled', '/images/fishmeal-factory.jpg', 'approved', 1],
    [ravi, 'Fish Skin & Scales', 150, 10, 'Biomedical Research', 'Clean by-product for authorized research evaluation', '/images/fish-sauce-factory.jpg', 'approved', 1],
    [sheela, 'Fish Offcuts', 80, 0, 'Biomedical Research', 'Awaiting authorized inspection before any use', '/images/lab-research.jpg', 'in inspection', 0]
  ];
  waste.forEach(([userId, species, quantity, price, category, description, image, status, verified], index) => {
    run(
      'INSERT INTO listings (user_id,type,species,local_name,quantity_kg,item_condition,location,price_per_kg,image,description,category,verified,status,collection_requested,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      userId, 'waste', species, '', quantity, 'Non-food-grade', coordsFor('Mangaluru Harbour') ? 'Mangaluru Harbour' : 'Mangaluru', price,
      image, description, category, verified, status, 0,
      new Date(Date.now() - (index + 2) * 7200 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    );
  });

  const orderSeeds = [
    { buyer: buyer, daysAgo: 150, items: [[1, 100]], location: 'Mangaluru', status: 'Delivered' },
    { buyer: buyer2, daysAgo: 120, items: [[2, 90], [3, 60]], location: 'Mangaluru', status: 'Delivered' },
    { buyer: buyer, daysAgo: 85, items: [[5, 120]], location: 'Kulai', status: 'Delivered' },
    { buyer: buyer2, daysAgo: 45, items: [[6, 35]], location: 'Mangaluru', status: 'In transit' },
    { buyer: buyer, daysAgo: 12, items: [[7, 25]], location: 'Mangaluru', status: 'Confirmed' }
  ];

  orderSeeds.forEach((seedOrder, orderIndex) => {
    const created = new Date(Date.now() - seedOrder.daysAgo * 86400 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    let total = 0;
    let quantity = 0;
    const itemRows = seedOrder.items.map(([listingId, qty]) => {
      const listing = get('SELECT * FROM listings WHERE id = ?', listingId);
      const market = get('SELECT price_per_kg FROM market_prices WHERE species = ?', listing.species)?.price_per_kg || listing.price_per_kg;
      const fee = money(market * 0.02);
      const transport = 4;
      const payment = money((market - fee - transport) * qty);
      total += market * qty;
      quantity += qty;
      return { listing, qty, market, fee, transport, payment };
    });
    const info = run(
      'INSERT INTO orders (buyer_id,type,total_quantity,total_amount,status,delivery_location,created_at) VALUES (?,?,?,?,?,?,?)',
      seedOrder.buyer, 'fresh', quantity, money(total), seedOrder.status, seedOrder.location, created
    );
    const orderId = Number(info.lastInsertRowid);
    itemRows.forEach((row, itemIndex) => {
      const itemInfo = run(
        'INSERT INTO order_items (order_id,listing_id,quantity_kg,price_per_kg,fisherman_id,fisherman_payment,fee_per_kg,transport_per_kg) VALUES (?,?,?,?,?,?,?,?)',
        orderId, row.listing.id, row.qty, row.market, row.listing.user_id, row.payment, row.fee, row.transport
      );
      const itemId = Number(itemInfo.lastInsertRowid);
      run(
        'INSERT INTO payments (order_id,item_id,fisherman_id,quantity_kg,amount,fee_amount,transport_amount,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        orderId, itemId, row.listing.user_id, row.qty, row.payment, money(row.fee * row.qty), money(row.transport * row.qty),
        seedOrder.status === 'Delivered' ? 'Paid' : 'Pending', created
      );
    });
    run(
      'INSERT INTO logistics (order_id,type,pickup_location,destination,transporter,status,created_at) VALUES (?,?,?,?,?,?,?)',
      orderId, 'fresh', 'Mangaluru Harbour', seedOrder.location, 'Coastal Cold Chain', seedOrder.status, created
    );
    if (orderIndex === 0) {
      const wInfo = run(
        'INSERT INTO waste_requests (processor_id,listing_id,quantity_kg,scheduled_at,notes,status,created_at) VALUES (?,?,?,?,?,?,?)',
        processor, 11, 300, new Date(Date.now() - 140 * 86400 * 1000).toISOString().slice(0, 10), 'Fishmeal production batch', 'Delivered', created
      );
      run(
        'INSERT INTO logistics (waste_request_id,type,pickup_location,destination,transporter,status,created_at) VALUES (?,?,?,?,?,?,?)',
        Number(wInfo.lastInsertRowid), 'waste', 'Mangaluru Harbour', 'Baikampady Industrial Area', 'Green Cycle Logistics', 'Delivered', created
      );
    }
  });

  run('INSERT INTO messages (name,email,subject,message) VALUES (?,?,?,?)', 'Demo Partner', 'partner@example.com', 'Partnership enquiry', 'We would like to discuss a bulk supply partnership.');
  void admin;
  void processor2;
}

seed();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '12mb' }));
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d' }));
app.use(express.static(PUBLIC, { index: false, maxAge: '1h' }));
app.use(auth);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/me', (req, res) => res.json({ user: publicUser(req.user) }));

app.post('/api/register', (req, res) => {
  const { name, email, password, role, phone, location, language } = req.body || {};
  const allowed = ['fisherman', 'buyer', 'processor'];
  if (!clean(name, 120) || !validEmail(email) || String(password || '').length < 6) {
    return res.status(400).json({ error: 'Enter a name, valid email and a password of at least 6 characters.' });
  }
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Choose a valid account type.' });
  if (get('SELECT id FROM users WHERE email = ?', String(email).toLowerCase())) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const [lat, lng] = coordsFor(clean(location));
  const info = run(
    'INSERT INTO users (name,email,password_hash,role,phone,location,lat,lng,language) VALUES (?,?,?,?,?,?,?,?,?)',
    clean(name, 120), String(email).toLowerCase().trim(), hashPassword(String(password)), role, clean(phone, 40),
    clean(location, 120), lat, lng, ['en', 'kn', 'ml', 'ta', 'hi'].includes(language) ? language : 'en'
  );
  setSession(res, Number(info.lastInsertRowid));
  res.status(201).json({ user: publicUser(get('SELECT * FROM users WHERE id = ?', Number(info.lastInsertRowid))) });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = get('SELECT * FROM users WHERE email = ?', String(email || '').toLowerCase().trim());
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  setSession(res, user.id);
  res.json({ user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie).tm_session;
  if (token) run('DELETE FROM sessions WHERE token = ?', token);
  res.setHeader('Set-Cookie', 'tm_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.patch('/api/me', requireAuth, (req, res) => {
  const body = req.body || {};
  const fields = [];
  const params = [];
  const set = (key, value) => {
    fields.push(`${key} = ?`);
    params.push(value);
  };
  if (body.name !== undefined) {
    const name = clean(body.name, 120);
    if (!name) return res.status(400).json({ error: 'Name cannot be empty.' });
    set('name', name);
  }
  if (body.phone !== undefined) set('phone', clean(body.phone, 40));
  if (body.location !== undefined) {
    const location = clean(body.location, 120);
    const [lat, lng] = coordsFor(location);
    set('location', location);
    set('lat', lat);
    set('lng', lng);
  }
  if (body.language !== undefined) {
    if (!['en', 'kn', 'ml', 'ta', 'hi'].includes(body.language)) {
      return res.status(400).json({ error: 'Choose a supported language.' });
    }
    set('language', body.language);
  }
  if (fields.length) {
    params.push(req.user.id);
    run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...params);
  }
  res.json({ user: publicUser(get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

app.get('/api/processing-partners', (req, res) => {
  const partners = all(`
    SELECT u.id, u.name, u.location, u.email, u.phone,
           COUNT(wr.id) AS request_count,
           SUM(CASE WHEN wr.status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_count,
           GROUP_CONCAT(DISTINCT l.category) AS categories
    FROM users u
    LEFT JOIN waste_requests wr ON wr.processor_id = u.id
    LEFT JOIN listings l ON l.id = wr.listing_id
    WHERE u.role = 'processor'
    GROUP BY u.id
    ORDER BY u.name
  `).map((partner) => ({
    ...partner,
    categories: partner.categories ? partner.categories.split(',') : []
  }));
  res.json({ partners });
});

app.get('/api/market-prices', (req, res) => {
  res.json({ prices: all('SELECT * FROM market_prices ORDER BY species') });
});

app.get('/api/listings', (req, res) => {
  const { type, species, location, q, sort, quality } = req.query;
  const where = [];
  const params = [];
  if (type === 'fresh' || type === 'waste') {
    where.push('l.type = ?');
    params.push(type);
  }
  if (species) {
    where.push('l.species = ?');
    params.push(clean(species, 80));
  }
  if (location) {
    where.push('LOWER(l.location) LIKE ?');
    params.push(`%${clean(location, 80).toLowerCase()}%`);
  }
  if (q) {
    where.push('(LOWER(l.species) LIKE ? OR LOWER(l.local_name) LIKE ? OR LOWER(l.location) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(l.category) LIKE ?)');
    const term = `%${clean(q, 80).toLowerCase()}%`;
    params.push(term, term, term, term, term);
  }
  if (quality === 'verified') where.push('l.verified = 1');
  if (quality === 'fresh' || quality === 'chilled') {
    where.push('LOWER(l.item_condition) LIKE ?');
    params.push(`%${quality}%`);
  }
  const order = sort === 'price-asc' ? 'l.price_per_kg ASC' : sort === 'price-desc' ? 'l.price_per_kg DESC' : sort === 'quantity' ? 'l.quantity_kg DESC' : 'l.created_at DESC, l.id DESC';
  res.json({ listings: listingQuery(where.length ? `WHERE ${where.join(' AND ')}` : '', params, order) });
});

app.get('/api/listings/:id', (req, res) => {
  const listing = listingQuery('WHERE l.id = ?', [req.params.id])[0];
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  res.json({ listing });
});

app.post('/api/listings', requireRole('fisherman', 'admin'), async (req, res) => {
  const body = req.body || {};
  const type = body.type === 'waste' ? 'waste' : 'fresh';
  const species = clean(body.species, 100);
  const quantity = Number(body.quantity);
  const price = Number(body.price);
  if (!species || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'Enter a species, quantity and valid price.' });
  }
  const location = clean(body.location, 140) || req.user.location || 'Mangaluru Harbour';
  const fallback = SPECIES_IMAGES[species] || (type === 'waste' ? '/images/fish-processing.jpg' : '/images/fish-market-vizag.jpg');
  const image = await saveImage(body.image, fallback);
  const category = clean(body.category, 100) || (type === 'waste' ? 'Fish By-product' : 'Fresh fish');
  const condition = clean(body.condition, 100) || (type === 'waste' ? 'Non-food-grade' : 'Fresh');
  const info = run(
    'INSERT INTO listings (user_id,type,species,local_name,quantity_kg,item_condition,location,price_per_kg,image,description,category,verified,status,collection_requested) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    req.user.id, type, species, clean(body.localName, 100), quantity, condition, location, price, image,
    clean(body.description, 600), category, 0, type === 'waste' ? 'registered' : 'available', body.requestCollection ? 1 : 0
  );
  res.status(201).json({ listing: listingQuery('WHERE l.id = ?', [Number(info.lastInsertRowid)])[0] });
});

app.patch('/api/listings/:id', requireAuth, (req, res) => {
  const listing = get('SELECT * FROM listings WHERE id = ?', req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  const isAdmin = req.user.role === 'admin';
  const isOwner = listing.user_id === req.user.id;
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Not allowed.' });
  const body = req.body || {};
  const fields = [];
  const params = [];
  const set = (key, value) => {
    fields.push(`${key} = ?`);
    params.push(value);
  };

  for (const key of ['quantity_kg', 'price_per_kg']) {
    if (body[key] === undefined) continue;
    const value = Number(body[key]);
    if (!Number.isFinite(value) || value < 0 || (key === 'quantity_kg' && value <= 0)) {
      return res.status(400).json({ error: 'Enter a valid quantity and price.' });
    }
    set(key, value);
  }

  if (body.category !== undefined && (isOwner || isAdmin)) set('category', clean(body.category, 100));
  if (body.item_condition !== undefined && (isOwner || isAdmin)) set('item_condition', clean(body.item_condition, 100));
  if (body.collection_requested !== undefined && (isOwner || isAdmin)) set('collection_requested', body.collection_requested ? 1 : 0);

  if (isAdmin) {
    if (body.status !== undefined) set('status', clean(body.status, 40));
    if (body.verified !== undefined) set('verified', body.verified ? 1 : 0);
  } else if (listing.type === 'fresh' && body.status !== undefined) {
    if (body.verified !== undefined) return res.status(403).json({ error: 'Only an administrator can verify listings.' });
    if (!['available', 'sold'].includes(body.status)) {
      return res.status(403).json({ error: 'Fishermen can only mark their own fresh listings available or sold.' });
    }
    set('status', body.status);
  } else if (body.status !== undefined || body.verified !== undefined) {
    return res.status(403).json({ error: 'Only an administrator can verify or approve listings.' });
  }

  if (!fields.length) return res.status(400).json({ error: 'No permitted changes supplied.' });
  params.push(req.params.id);
  run(`UPDATE listings SET ${fields.join(', ')} WHERE id = ?`, ...params);
  res.json({ listing: listingQuery('WHERE l.id = ?', [req.params.id])[0] });
});

app.delete('/api/listings/:id', requireAuth, (req, res) => {
  const listing = get('SELECT * FROM listings WHERE id = ?', req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  if (listing.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed.' });
  run('DELETE FROM listings WHERE id = ?', req.params.id);
  res.json({ ok: true });
});

app.post('/api/orders', requireRole('buyer', 'admin'), async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const deliveryLocation = clean(req.body?.deliveryLocation, 160) || req.user.location || 'Mangaluru';
  if (!items.length) return res.status(400).json({ error: 'Select at least one catch to order.' });

  const prepared = [];
  for (const item of items) {
    const listing = get('SELECT * FROM listings WHERE id = ?', Number(item.listingId));
    const qty = Number(item.quantity);
    if (!listing || listing.type !== 'fresh') return res.status(400).json({ error: 'Fresh fish listings are required for food orders.' });
    if (listing.status !== 'available') return res.status(400).json({ error: `${listing.species} listing is not available.` });
    if (!Number.isFinite(qty) || qty <= 0 || qty > Number(listing.quantity_kg)) {
      return res.status(400).json({ error: `Invalid quantity for ${listing.species}. Available: ${listing.quantity_kg} kg.` });
    }
    const market = get('SELECT price_per_kg FROM market_prices WHERE species = ?', listing.species)?.price_per_kg || listing.price_per_kg;
    const fee = money(Number(market) * 0.02);
    const transport = 4;
    const payment = money((Number(market) - fee - transport) * qty);
    prepared.push({ listing, qty, market: Number(market), fee, transport, payment });
  }

  const totalQuantity = prepared.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = money(prepared.reduce((sum, item) => sum + item.market * item.qty, 0));
  const info = run(
    'INSERT INTO orders (buyer_id,type,total_quantity,total_amount,status,delivery_location) VALUES (?,?,?,?,?,?)',
    req.user.id, 'fresh', totalQuantity, totalAmount, 'Requested', deliveryLocation
  );
  const orderId = Number(info.lastInsertRowid);

  prepared.forEach((item) => {
    const itemInfo = run(
      'INSERT INTO order_items (order_id,listing_id,quantity_kg,price_per_kg,fisherman_id,fisherman_payment,fee_per_kg,transport_per_kg) VALUES (?,?,?,?,?,?,?,?)',
      orderId, item.listing.id, item.qty, item.market, item.listing.user_id, item.payment, item.fee, item.transport
    );
    run(
      'INSERT INTO payments (order_id,item_id,fisherman_id,quantity_kg,amount,fee_amount,transport_amount,status) VALUES (?,?,?,?,?,?,?,?)',
      orderId, Number(itemInfo.lastInsertRowid), item.listing.user_id, item.qty, item.payment,
      money(item.fee * item.qty), money(item.transport * item.qty), 'Pending'
    );
    const remaining = money(Number(item.listing.quantity_kg) - item.qty);
    run('UPDATE listings SET quantity_kg = ?, status = ? WHERE id = ?', remaining, remaining <= 0 ? 'sold' : 'available', item.listing.id);
  });

  run(
    'INSERT INTO logistics (order_id,type,pickup_location,destination,transporter,status) VALUES (?,?,?,?,?,?)',
    orderId, 'fresh', prepared[0].listing.location, deliveryLocation, 'Coastal Cold Chain', 'Requested'
  );
  res.status(201).json({ orderId, message: 'Order placed. Track it in your dashboard.' });
});

app.get('/api/orders', requireAuth, (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = all(`
      SELECT o.*, u.name AS buyer_name,
             (SELECT GROUP_CONCAT(oi.quantity_kg || ' kg ' || l.species, ', ') FROM order_items oi JOIN listings l ON l.id = oi.listing_id WHERE oi.order_id = o.id) AS items
      FROM orders o JOIN users u ON u.id = o.buyer_id ORDER BY o.created_at DESC
    `);
  } else if (req.user.role === 'buyer') {
    rows = all(`
      SELECT o.*, u.name AS buyer_name,
             (SELECT GROUP_CONCAT(oi.quantity_kg || ' kg ' || l.species, ', ') FROM order_items oi JOIN listings l ON l.id = oi.listing_id WHERE oi.order_id = o.id) AS items
      FROM orders o JOIN users u ON u.id = o.buyer_id WHERE o.buyer_id = ? ORDER BY o.created_at DESC
    `, req.user.id);
  } else {
    rows = all(`
      SELECT DISTINCT o.*, u.name AS buyer_name,
             (SELECT GROUP_CONCAT(oi.quantity_kg || ' kg ' || l.species, ', ') FROM order_items oi JOIN listings l ON l.id = oi.listing_id WHERE oi.order_id = o.id) AS items
      FROM orders o JOIN users u ON u.id = o.buyer_id
      JOIN order_items oi ON oi.order_id = o.id WHERE oi.fisherman_id = ? ORDER BY o.created_at DESC
    `, req.user.id);
  }
  res.json({ orders: rows });
});

app.get('/api/orders/:id', requireAuth, (req, res) => {
  const order = get('SELECT * FROM orders WHERE id = ?', req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (req.user.role !== 'admin' && order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Not allowed.' });
  const items = all(`
    SELECT oi.*, l.species, l.image, l.location AS pickup_location, u.name AS fisherman_name
    FROM order_items oi JOIN listings l ON l.id = oi.listing_id JOIN users u ON u.id = oi.fisherman_id
    WHERE oi.order_id = ?
  `, req.params.id);
  res.json({ order, items });
});

app.patch('/api/orders/:id/status', requireAuth, (req, res) => {
  const order = get('SELECT * FROM orders WHERE id = ?', req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (req.user.role !== 'admin' && order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Not allowed.' });
  const status = clean(req.body?.status, 40);
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  run('UPDATE orders SET status = ? WHERE id = ?', status, req.params.id);
  run('UPDATE logistics SET status = ? WHERE order_id = ?', status, req.params.id);
  if (status === 'Delivered') {
    run('UPDATE payments SET status = ? WHERE order_id = ?', 'Paid', req.params.id);
  }
  res.json({ ok: true });
});

app.get('/api/payments', requireAuth, (req, res) => {
  const rows = req.user.role === 'admin'
    ? all(`
        SELECT p.*, u.name AS fisherman_name, o.delivery_location, o.created_at AS order_date
        FROM payments p JOIN users u ON u.id = p.fisherman_id JOIN orders o ON o.id = p.order_id ORDER BY p.created_at DESC
      `)
    : req.user.role === 'fisherman'
      ? all(`
          SELECT p.*, u.name AS fisherman_name, o.delivery_location, o.created_at AS order_date
          FROM payments p JOIN users u ON u.id = p.fisherman_id JOIN orders o ON o.id = p.order_id
          WHERE p.fisherman_id = ? ORDER BY p.created_at DESC
        `, req.user.id)
      : all(`
          SELECT p.*, u.name AS fisherman_name, o.delivery_location, o.created_at AS order_date
          FROM payments p JOIN users u ON u.id = p.fisherman_id JOIN orders o ON o.id = p.order_id
          WHERE o.buyer_id = ? ORDER BY p.created_at DESC
        `, req.user.id);
  res.json({ payments: rows });
});

app.patch('/api/payments/:id', requireRole('admin'), (req, res) => {
  const status = clean(req.body?.status, 40);
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  run('UPDATE payments SET status = ?, method = COALESCE(?, method) WHERE id = ?', status, clean(req.body?.method, 80) || null, req.params.id);
  res.json({ ok: true });
});

app.get('/waste/listings', (req, res) => {
  res.json({ listings: listingQuery("WHERE l.type = 'waste'", []) });
});

app.post('/waste/listings', requireRole('fisherman', 'admin'), async (req, res) => {
  const body = req.body || {};
  const species = clean(body.species_name || body.material_type || body.species, 100) || 'Fish by-product';
  const quantity = Number(body.quantity_kg ?? body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ error: 'Enter a valid quantity.' });
  const location = clean(body.collection_location || body.location, 140) || req.user.location || 'Mangaluru Harbour';
  const category = clean(body.category, 100) || 'fishmeal';
  const condition = clean(body.condition, 100) || 'Non-food-grade';
  const fallback = SPECIES_IMAGES[species] || '/images/fish-processing.jpg';
  const image = await saveImage(body.photo_url || body.image, fallback);
  const info = run(
    'INSERT INTO listings (user_id,type,species,local_name,quantity_kg,item_condition,location,price_per_kg,image,description,category,verified,status,collection_requested) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    req.user.id, 'waste', species, clean(body.species_name || body.localName, 100), quantity, condition, location, 0, image,
    clean(body.notes || body.description, 600), category, 0, 'registered', 0
  );
  const listing = listingQuery('WHERE l.id = ?', [Number(info.lastInsertRowid)])[0];
  res.status(201).json({ listing, message: 'Waste material registered. Inspection required before processing.' });
});

app.post('/api/waste/requests', requireRole('processor', 'admin'), (req, res) => {
  const listing = get('SELECT * FROM listings WHERE id = ?', Number(req.body?.listingId));
  if (!listing || listing.type !== 'waste') return res.status(400).json({ error: 'Industrial material listing not found.' });
  if (listing.status !== 'approved') return res.status(400).json({ error: 'This material is awaiting authorized inspection and cannot be collected yet.' });
  const qty = Number(req.body?.quantity || listing.quantity_kg);
  if (!Number.isFinite(qty) || qty <= 0 || qty > Number(listing.quantity_kg)) return res.status(400).json({ error: 'Invalid material quantity.' });
  const info = run(
    'INSERT INTO waste_requests (processor_id,listing_id,quantity_kg,scheduled_at,notes,status) VALUES (?,?,?,?,?,?)',
    req.user.id, listing.id, qty, clean(req.body?.scheduledAt, 40) || null, clean(req.body?.notes, 400), 'Requested'
  );
  const requestId = Number(info.lastInsertRowid);
  run('UPDATE listings SET collection_requested = 1 WHERE id = ?', listing.id);
  run(
    'INSERT INTO logistics (waste_request_id,type,pickup_location,destination,transporter,status) VALUES (?,?,?,?,?,?)',
    requestId, 'waste', listing.location, req.user.location || 'Processing facility', clean(req.body?.transporter, 120) || 'Green Cycle Logistics', 'Requested'
  );
  res.status(201).json({ requestId, message: 'Collection request sent for confirmation.' });
});

app.get('/api/waste/requests', requireAuth, (req, res) => {
  const rows = req.user.role === 'admin'
    ? all(`
        SELECT wr.*, u.name AS processor_name, l.species, l.category, l.image, l.location, l.user_id AS fisherman_id
        FROM waste_requests wr JOIN users u ON u.id = wr.processor_id JOIN listings l ON l.id = wr.listing_id ORDER BY wr.created_at DESC
      `)
    : req.user.role === 'processor'
      ? all(`
          SELECT wr.*, u.name AS processor_name, l.species, l.category, l.image, l.location, l.user_id AS fisherman_id
          FROM waste_requests wr JOIN users u ON u.id = wr.processor_id JOIN listings l ON l.id = wr.listing_id
          WHERE wr.processor_id = ? ORDER BY wr.created_at DESC
        `, req.user.id)
      : all(`
          SELECT wr.*, u.name AS processor_name, l.species, l.category, l.image, l.location, l.user_id AS fisherman_id
          FROM waste_requests wr JOIN users u ON u.id = wr.processor_id JOIN listings l ON l.id = wr.listing_id
          WHERE l.user_id = ? ORDER BY wr.created_at DESC
        `, req.user.id);
  res.json({ requests: rows });
});

app.patch('/api/waste/requests/:id', requireRole('admin', 'processor'), (req, res) => {
  const request = get('SELECT * FROM waste_requests WHERE id = ?', req.params.id);
  if (!request) return res.status(404).json({ error: 'Collection request not found.' });
  if (req.user.role !== 'admin' && request.processor_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only update your own collection requests.' });
  }
  const status = clean(req.body?.status, 40);
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  run('UPDATE waste_requests SET status = ? WHERE id = ?', status, req.params.id);
  run('UPDATE logistics SET status = ? WHERE waste_request_id = ?', status, req.params.id);
  res.json({ ok: true });
});

app.get('/api/logistics', requireAuth, (req, res) => {
  const rows = req.user.role === 'admin'
    ? all('SELECT * FROM logistics ORDER BY created_at DESC')
    : all(`
        SELECT DISTINCT lg.* FROM logistics lg
        LEFT JOIN orders o ON o.id = lg.order_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN waste_requests wr ON wr.id = lg.waste_request_id
        LEFT JOIN listings l ON l.id = wr.listing_id
        WHERE o.buyer_id = ? OR oi.fisherman_id = ? OR wr.processor_id = ? OR l.user_id = ?
        ORDER BY lg.created_at DESC
      `, req.user.id, req.user.id, req.user.id, req.user.id);
  res.json({ logistics: rows });
});

app.patch('/api/logistics/:id', requireRole('admin'), (req, res) => {
  const status = clean(req.body?.status, 40);
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  const row = get('SELECT * FROM logistics WHERE id = ?', req.params.id);
  if (!row) return res.status(404).json({ error: 'Shipment not found.' });
  run('UPDATE logistics SET status = ? WHERE id = ?', status, req.params.id);
  if (row.order_id) run('UPDATE orders SET status = ? WHERE id = ?', status, row.order_id);
  if (row.waste_request_id) run('UPDATE waste_requests SET status = ? WHERE id = ?', status, row.waste_request_id);
  res.json({ ok: true });
});

app.get('/api/map-data', (req, res) => {
  const users = all("SELECT id,name,role,location,lat,lng FROM users WHERE role IN ('fisherman','buyer','processor') AND lat IS NOT NULL");
  const markers = users.map((user) => ({
    id: user.id,
    name: user.name,
    type: user.role === 'fisherman' ? 'fisherman' : user.role === 'buyer' ? 'buyer' : 'processor',
    location: user.location,
    lat: user.lat,
    lng: user.lng
  }));
  markers.push({ id: 'collection-1', name: 'Mangaluru Collection Point', type: 'collection', location: 'Harbour Junction', lat: 12.9156, lng: 74.8542 });
  markers.push({ id: 'collection-2', name: 'Kulai Aggregation Centre', type: 'collection', location: 'Kulai', lat: 12.8875, lng: 74.8784 });
  res.json({ markers });
});

app.get('/api/dashboard/fisherman', requireRole('fisherman', 'admin'), (req, res) => {
  const userId = req.user.role === 'admin' ? req.params.userId || req.user.id : req.user.id;
  const listings = listingQuery('WHERE l.user_id = ?', [userId]);
  const orders = all(`
    SELECT o.*, u.name AS buyer_name FROM orders o
    JOIN order_items oi ON oi.order_id = o.id JOIN users u ON u.id = o.buyer_id
    WHERE oi.fisherman_id = ? ORDER BY o.created_at DESC
  `, userId);
  const payments = all('SELECT * FROM payments WHERE fisherman_id = ? ORDER BY created_at DESC', userId);
  const buyers = all("SELECT name, location, email FROM users WHERE role IN ('buyer','processor') ORDER BY name");
  const activeListings = listings.filter((listing) => listing.status === 'available').length;
  const expected = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const paid = payments.filter((payment) => payment.status === 'Paid').reduce((sum, payment) => sum + Number(payment.amount), 0);
  res.json({
    stats: { activeListings, expected, paid, orderCount: orders.length, collections: orders.filter((order) => ['Picked up', 'In transit', 'Delivered'].includes(order.status)).length },
    listings, orders, payments, buyers
  });
});

app.get('/api/dashboard/buyer', requireRole('buyer', 'admin'), (req, res) => {
  const userId = req.user.role === 'admin' ? req.user.id : req.user.id;
  const orders = all(`
    SELECT o.*, u.name AS buyer_name,
           (SELECT GROUP_CONCAT(oi.quantity_kg || ' kg ' || l.species, ', ') FROM order_items oi JOIN listings l ON l.id = oi.listing_id WHERE oi.order_id = o.id) AS items
    FROM orders o JOIN users u ON u.id = o.buyer_id WHERE o.buyer_id = ? ORDER BY o.created_at DESC
  `, userId);
  const prices = all('SELECT * FROM market_prices ORDER BY species');
  const spent = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  res.json({
    stats: { openOrders: orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length, spent, orderCount: orders.length, suppliers: new Set(all('SELECT DISTINCT fisherman_id FROM order_items').map((row) => row.fisherman_id)).size },
    orders, prices
  });
});

app.get('/api/dashboard/processor', requireRole('processor', 'admin'), (req, res) => {
  const requests = req.user.role === 'admin'
    ? all('SELECT wr.*, l.species, l.category, l.image, l.location FROM waste_requests wr JOIN listings l ON l.id = wr.listing_id ORDER BY wr.created_at DESC')
    : all('SELECT wr.*, l.species, l.category, l.image, l.location FROM waste_requests wr JOIN listings l ON l.id = wr.listing_id WHERE wr.processor_id = ? ORDER BY wr.created_at DESC', req.user.id);
  const deliveries = req.user.role === 'admin'
    ? all("SELECT * FROM logistics WHERE type = 'waste' ORDER BY created_at DESC")
    : all("SELECT lg.* FROM logistics lg JOIN waste_requests wr ON wr.id = lg.waste_request_id WHERE lg.type = 'waste' AND wr.processor_id = ? ORDER BY lg.created_at DESC", req.user.id);
  res.json({
    stats: {
      availableMaterials: listingQuery("WHERE l.type = 'waste' AND l.status = 'approved'").length,
      requests: requests.length,
      deliveries: deliveries.filter((row) => row.status === 'Delivered').length,
      partners: all("SELECT COUNT(*) AS count FROM users WHERE role = 'processor'")[0].count
    },
    requests, deliveries
  });
});

app.get('/api/dashboard/admin', requireRole('admin'), (req, res) => {
  const stats = {
    fishermen: get("SELECT COUNT(*) AS count FROM users WHERE role = 'fisherman'").count,
    businesses: get("SELECT COUNT(*) AS count FROM users WHERE role IN ('buyer','processor')").count,
    listings: get('SELECT COUNT(*) AS count FROM listings').count,
    orders: get('SELECT COUNT(*) AS count FROM orders').count,
    fishSold: get("SELECT COALESCE(SUM(oi.quantity_kg),0) AS total FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.type = 'fresh'").total,
    revenue: get('SELECT COALESCE(SUM(fee_amount),0) AS total FROM payments').total,
    wasteCollected: get("SELECT COALESCE(SUM(quantity_kg),0) AS total FROM waste_requests WHERE status IN ('Collected','Delivered')").total,
    processors: get("SELECT COUNT(*) AS count FROM users WHERE role = 'processor'").count
  };
  const monthly = all("SELECT substr(created_at,1,7) AS month, COUNT(*) AS count FROM orders GROUP BY month ORDER BY month");
  const species = all("SELECT l.species AS name, SUM(oi.quantity_kg) AS value FROM order_items oi JOIN listings l ON l.id = oi.listing_id GROUP BY l.species ORDER BY value DESC");
  const revenue = all("SELECT substr(created_at,1,7) AS month, SUM(fee_amount) AS value FROM payments GROUP BY month ORDER BY month");
  const users = all('SELECT * FROM users ORDER BY created_at DESC').map(publicUser);
  const listings = listingQuery('');
  const orders = all(`
    SELECT o.*, u.name AS buyer_name,
           (SELECT GROUP_CONCAT(oi.quantity_kg || ' kg ' || l.species, ', ') FROM order_items oi JOIN listings l ON l.id = oi.listing_id WHERE oi.order_id = o.id) AS items
    FROM orders o JOIN users u ON u.id = o.buyer_id ORDER BY o.created_at DESC
  `);
  const payments = all(`
    SELECT p.*, u.name AS fisherman_name FROM payments p JOIN users u ON u.id = p.fisherman_id ORDER BY p.created_at DESC
  `);
  const prices = all('SELECT * FROM market_prices ORDER BY species');
  const logistics = all('SELECT * FROM logistics ORDER BY created_at DESC');
  const wasteRequests = all(`
    SELECT wr.*, u.name AS processor_name, l.species, l.category FROM waste_requests wr
    JOIN users u ON u.id = wr.processor_id JOIN listings l ON l.id = wr.listing_id ORDER BY wr.created_at DESC
  `);
  const messages = all('SELECT * FROM messages ORDER BY created_at DESC');
  res.json({ stats, charts: { monthly, species, revenue }, users, listings, orders, payments, prices, logistics, wasteRequests, messages });
});

app.post('/api/market-prices', requireRole('admin'), (req, res) => {
  const species = clean(req.body?.species, 100);
  const price = Number(req.body?.price);
  if (!species || !Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Enter a species and a valid price.' });
  run(`
    INSERT INTO market_prices (species,local_name,price_per_kg,updated_at) VALUES (?,?,?,datetime('now'))
    ON CONFLICT(species) DO UPDATE SET price_per_kg = excluded.price_per_kg, updated_at = datetime('now')
  `, species, clean(req.body?.localName, 100), price);
  res.json({ ok: true });
});

app.patch('/api/users/:id', requireRole('admin'), (req, res) => {
  const role = clean(req.body?.role, 40);
  if (!['fisherman', 'buyer', 'processor', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
  run('UPDATE users SET role = ? WHERE id = ?', role, req.params.id);
  res.json({ ok: true });
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!clean(name, 120) || !validEmail(email) || !clean(message, 20)) {
    return res.status(400).json({ error: 'Enter your name, a valid email and a message.' });
  }
  run('INSERT INTO messages (name,email,subject,message) VALUES (?,?,?,?)', clean(name, 120), String(email).trim().toLowerCase(), clean(subject, 160) || 'General enquiry', clean(message, 2000));
  res.status(201).json({ message: 'Thank you. Your enquiry has been recorded.' });
});

app.get('/api/integrations', (req, res) => {
  res.json({
    whatsapp: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    n8n: Boolean(process.env.N8N_WEBHOOK_URL),
    contactNumber: process.env.WHATSAPP_CONTACT_NUMBER || ''
  });
});

function extractSpecies(text) {
  const words = String(text || '').toLowerCase().match(/[a-z]+/g) || [];
  for (const word of words) {
    if (SPECIES_ALIASES[word]) return SPECIES_ALIASES[word];
  }
  return null;
}

async function sendWhatsAppMessage(to, text) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID || !to) return { sent: false };
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
    });
    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
}

app.post('/api/webhooks/whatsapp', async (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (verifyToken && req.headers['x-verify-token'] && req.headers['x-verify-token'] !== verifyToken) {
    return res.status(403).json({ error: 'Invalid verification token.' });
  }
  const body = req.body || {};
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0] || {};
  const rawPhone = body.phone || body.from || message.from || '';
  const text = body.message || body.text || message.text?.body || '';
  const digits = String(rawPhone).replace(/\D/g, '');
  const phoneTail = digits.slice(-10);
  if (!phoneTail || !text) return res.status(400).json({ error: 'Phone number and message are required.' });

  const user = all('SELECT * FROM users').find((candidate) => String(candidate.phone || '').replace(/\D/g, '').slice(-10) === phoneTail);
  if (!user || user.role !== 'fisherman') {
    return res.status(200).json({ status: 'registration_required', confirmation: 'Please register as a fisherman on TRI-MATSYA before listing your catch.' });
  }
  const species = extractSpecies(text) || 'Mackerel';
  const quantityMatch = String(text).match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?)?/i);
  const quantity = quantityMatch ? Number(quantityMatch[1]) : 0;
  if (quantity <= 0) {
    return res.status(200).json({ status: 'needs_quantity', confirmation: 'Please include the quantity in kilograms, for example: "I have 50 kg of Bangude fish."' });
  }
  const imageSource = body.imageBase64 || body.image?.base64 || body.imageUrl || body.image?.url || '';
  const fallback = SPECIES_IMAGES[species] || '/images/fish-market-vizag.jpg';
  const image = await saveImage(imageSource, fallback);
  const info = run(
    'INSERT INTO listings (user_id,type,species,local_name,quantity_kg,item_condition,location,price_per_kg,image,description,category,verified,status,collection_requested) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    user.id, 'fresh', species, '', quantity, 'Fresh', user.location || 'Mangaluru Harbour',
    get('SELECT price_per_kg FROM market_prices WHERE species = ?', species)?.price_per_kg || 100,
    image, `Listing created from WhatsApp message: ${clean(text, 300)}`, 'Fresh fish', 0, 'available', 0
  );
  const listingId = Number(info.lastInsertRowid);
  const confirmation = `Listing #${listingId} created: ${quantity} kg of ${species} at ${user.location}. Our team will verify and share the expected price.`;
  const delivery = await sendWhatsAppMessage(digits, confirmation);
  res.status(200).json({ status: 'listing_created', listingId, species, quantity, confirmation, whatsappSent: delivery.sent });
});

app.get('/api/webhooks/whatsapp', (req, res) => {
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const verify = req.query['hub.verify_token'];
  if (token && mode === 'subscribe' && verify === token) return res.status(200).send(challenge);
  res.status(403).json({ error: 'Verification failed.' });
});

app.use((req, res, next) => {
  if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(PUBLIC, 'index.html'));
  }
  next();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`TRI-MATSYA running at http://localhost:${PORT}`);
});
