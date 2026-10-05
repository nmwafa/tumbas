import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import publicRouter from './routes/public.js';
import adminRouter from './routes/admin.js';

// Inisialisasi aplikasi Express dan konfigurasi dasar server.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Parse API payloads, serve public assets, and initialize browser sessions.
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img'), {
  maxAge: 24 * 60 * 60 * 1000,
  immutable: true,
  etag: true,
  lastModified: true
}));
app.use(session({
  secret: 'super-secret-key-101',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Gunakan router untuk rute publik dan admin.
app.use(publicRouter);
app.use(adminRouter);

// Tampilkan halaman 404 untuk permintaan yang tidak cocok.
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((error, req, res, next) => {
  console.error("Request gagal:", error);
  if (res.headersSent) return next(error);

  const status = Number.isInteger(error.status) ? error.status : 500;
  const message =
    error.expose || status < 500 ? error.message : "Terjadi kesalahan server.";

  if (req.path.startsWith("/api/")) {
    return res.status(status).json({ error: message });
  }
  res.status(status).send(message);
});

// Menjalankan server pada port yang telah ditentukan.
app.listen(PORT, () => console.log(`Server aktif di http://localhost:${PORT}`));