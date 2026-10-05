import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import publicRouter from './routes/public.js';
import adminRouter from './routes/admin.js';

// ==================== KONFIGURASI DASAR ====================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// ==================== MIDDLEWARE - PARSING & STATIC FILES ====================

/**
 * Parse JSON payloads dari client
 */
app.use(express.json());

/**
 * Serve public assets (CSS, JS, HTML statis, dll)
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Serve gambar produk dengan cache 24 jam
 * Konfigurasi: immutable (tidak berubah), ETag, Last-Modified headers
 */
app.use('/img', express.static(path.join(__dirname, 'img'), {
  maxAge: 24 * 60 * 60 * 1000,
  immutable: true,
  etag: true,
  lastModified: true
}));

// ==================== MIDDLEWARE - SESSION ====================

/**
 * Konfigurasi session untuk autentikasi admin
 * Secret key sebaiknya diganti dengan environment variable di production
 */
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key-101',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ==================== ROUTING ====================

/**
 * Router untuk rute publik (beranda, produk, dll)
 */
app.use(publicRouter);

/**
 * Router untuk rute admin (login, dashboard, manajemen produk)
 */
app.use(adminRouter);

// ==================== ERROR HANDLING ====================

/**
 * Middleware 404 - Tampilkan halaman 404 untuk permintaan yang tidak cocok
 */
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

/**
 * Middleware error handler global
 * Menangani error dari middleware atau route handlers
 */
app.use((error, req, res, next) => {
  console.error("Request gagal:", error);
  
  // Jika response headers sudah dikirim, pass ke default express handler
  if (res.headersSent) return next(error);

  // Tentukan status code
  const status = Number.isInteger(error.status) ? error.status : 500;
  
  // Tentukan pesan error (jangan expose error message untuk 5xx ke client)
  const message =
    error.expose || status < 500 ? error.message : "Terjadi kesalahan server.";

  // Return JSON untuk API routes, HTML untuk page routes
  if (req.path.startsWith("/api/")) {
    return res.status(status).json({ error: message });
  }
  
  res.status(status).send(message);
});

// ==================== STARTUP ====================

/**
 * Menjalankan server pada port yang telah ditentukan
 */
app.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
});
