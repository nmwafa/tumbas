import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const loginAttempts = new Map();

const getClientKey = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  return (forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip) || 'unknown';
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const targetDir = path.join(__dirname, 'img');
    await fs.mkdir(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, safeName);
  }
});

const upload = multer({ storage });

app.use(express.json());

app.use((req, res, next) => {
  if (req.path === '/admin.html') {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }

  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(session({
  secret: 'purworejo-secret-key-1945',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Helper Baca & Tulis JSON
const readData = async (file) => JSON.parse(await fs.readFile(path.join(__dirname, 'data', file), 'utf-8'));
const writeData = async (file, data) => fs.writeFile(path.join(__dirname, 'data', file), JSON.stringify(data, null, 2));

// Middleware Proteksi Halaman Admin
const requireAuth = (req, res, next) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// --- ENDPOINT PUBLIK ---
app.get('/api/products', async (req, res) => {
  const products = await readData('products.json');
  res.json(products);
});

app.post('/api/products/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File gambar tidak ditemukan' });
  }

  res.json({ image: `/img/${req.file.filename}` });
});

app.get('/4dm1n', (req, res) => {
  if (req.session.admin) {
    return res.redirect('/4dm1n/dashboard');
  }

  res.sendFile(path.join(__dirname, 'views', 'admin-login.html'));
});

app.get('/4dm1n/dashboard', (req, res) => {
  if (!req.session.admin) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }

  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// --- ENDPOINT AUTENTIKASI ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const clientKey = getClientKey(req);
  const failedAttempts = loginAttempts.get(clientKey) || 0;

  if (failedAttempts >= 3) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' });
  }

  const users = await readData('users.json');
  const user = users.find(u => u.username === username);

  if (user && await bcrypt.compare(password, user.password)) {
    loginAttempts.delete(clientKey);
    req.session.admin = { id: user.id, name: user.name };
    return res.json({ success: true, name: user.name });
  }

  const nextFailedAttempts = failedAttempts + 1;
  loginAttempts.set(clientKey, nextFailedAttempts);

  if (nextFailedAttempts >= 3) {
    return res.status(429).json({ error: 'Percobaan login salah melebihi batas. Silakan coba lagi nanti.' });
  }

  res.status(401).json({ error: `Username atau password salah (${nextFailedAttempts}/3)` });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ loggedIn: !!req.session.admin, user: req.session.admin || null });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// --- ENDPOINT CRUD ADMIN ---
app.post('/api/products', requireAuth, async (req, res) => {
  const products = await readData('products.json');
  const newProduct = { id: `prod_${Date.now()}`, ...req.body };
  products.push(newProduct);
  await writeData('products.json', products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  let products = await readData('products.json');
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  products[index] = { ...products[index], ...req.body };
  await writeData('products.json', products);
  res.json(products[index]);
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  let products = await readData('products.json');
  products = products.filter(p => p.id !== req.params.id);
  await writeData('products.json', products);
  res.json({ success: true });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => console.log(`Server aktif di http://localhost:${PORT}`));