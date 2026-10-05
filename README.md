<div align="center">
  <img src="img/logo.png" alt="Tumbas Logo" width="300">
</div>

# Tumbas - Katalog Produk UMKM Purworejo

Aplikasi web untuk mempromosikan produk UMKM Purworejo. Pembeli dapat melihat katalog, mencari produk, dan menghubungi penjual melalui WhatsApp atau Google Maps.

> **Demo:** https://tumbas-coral.vercel.app/

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Instalasi](#instalasi)
- [API](#api)
- [Struktur Proyek](#struktur-proyek)
- [Deployment](#deployment)

## Fitur Utama

### Publik
- 🔍 Pencarian produk real-time
- 📂 Filter produk (Khas/Umum)
- 📱 Tampilan responsif (desktop, tablet, mobile)
- 💬 Integrasi WhatsApp dan Google Maps per penjual

### Admin
- 🔐 Login dengan password terenkripsi (bcryptjs)
- ➕ CRUD produk dan penjual
- 📸 Upload gambar (URL atau file)
- ⚡ Rate limiting login (3x gagal = cooldown 2 menit)

## Teknologi

| Bagian | Stack |
|--------|-------|
| **Backend** | Node.js, Express 5.2.1, express-session |
| **Frontend** | HTML5, Tailwind CSS, Alpine.js |
| **Storage** | JSON file lokal atau Vercel Blob |
| **Upload** | Multer (10 MB lokal / 4 MB Blob) |

## Instalasi

### Prasyarat
- Node.js 18+
- npm

### Setup
```bash
# Clone dan install
git clone https://github.com/nmwafa/tumbas.git
cd tumbas
npm install

# Development
npm run dev

# Production
npm start
```

Akses:
- Katalog: `http://localhost:3000/`
- Admin: `http://localhost:3000/4dm1n`

### Mengubah Password Admin

```bash
# Generate hash baru
node --input-type=module -e "import bcrypt from 'bcryptjs'; const password='passwordbaru'; console.log(await bcrypt.hash(password, 10));"
```

Ganti password di `data/users.json`.

## API

### Publik
```http
GET /api/products                 # Daftar semua produk
```

### Admin (memerlukan login)
```http
POST   /api/auth/login             # Login
GET    /api/auth/status            # Cek status login
POST   /api/auth/logout            # Logout
POST   /api/products               # Buat produk (JSON atau multipart)
POST   /api/products/upload        # Upload gambar
PUT    /api/products/:id           # Edit produk
DELETE /api/products/:id           # Hapus produk
```

### Contoh: Tambah Produk

**JSON (gambar dari URL):**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Kue Lompong",
    "category_tab": "khas",
    "price_range": "Rp 5.000",
    "image": "https://example.com/kue.jpg",
    "description": "Kue tradisional Purworejo",
    "sellers": [{
      "name": "Bu Kartini",
      "phone": "628888888888",
      "address": "Jl. Kenangan",
      "maps_url": "https://maps.app.goo.gl/..."
    }]
  }'
```

**Multipart (upload file):**
```bash
curl -X POST http://localhost:3000/api/products \
  -b cookies.txt \
  -F 'product=@product.json' \
  -F 'image=@foto.jpg'
```

## Struktur Proyek

```
tumbas/
├── data/
│   ├── products.json         # Data produk
│   └── users.json            # Admin user
├── img/products/             # Upload gambar lokal
├── public/
│   ├── index.html            # Katalog publik
│   └── 404.html
├── views/
│   ├── admin-login.html      # Login form
│   └── admin-dashboard.html  # Dashboard admin
├── routes/
│   ├── public.js             # Endpoint publik
│   └── admin.js              # Endpoint & halaman admin
├── lib/
│   ├── data-store.js         # Baca/tulis JSON atau Blob
│   └── storage.js            # Upload helper
├── server.js                 # Entry point
└── package.json
```

## Deployment

### Vercel

1. **Setup Blob Store:**
   - Di Vercel dashboard → Storage → Create → Blob
   - Copy token ke environment variable `BLOB_READ_WRITE_TOKEN`

2. **Deploy:**
   ```bash
   npm install -g vercel
   vercel
   ```

**Catatan:** Tanpa token Blob, aplikasi menggunakan filesystem lokal (tidak persisten di Vercel). Dengan token, data JSON dan gambar disimpan di Blob.

## Keamanan

✅ **Implementasi saat ini:**
- Password hash dengan bcryptjs
- Session cookie (24 jam)
- Rate limiting login
- Middleware `requireAuth` untuk endpoint admin
- Validasi tipe file upload (JPEG, PNG, WebP, GIF, AVIF)

⚠️ **Untuk production:**
- Gunakan HTTPS
- Simpan session secret di environment variable
- Gunakan database untuk data produk (jangan JSON)
- Pastikan reverse proxy terpercaya untuk `X-Forwarded-For`

## Data Struktur

**Produk:**
```json
{
  "id": "prod_1789107738368",
  "name": "Kue Lompong",
  "category_tab": "khas",
  "price_range": "Rp 5.000",
  "image": "https://...",
  "description": "...",
  "sellers": [
    {
      "name": "Bu Kartini",
      "phone": "628888888888",
      "address": "Jl. Kenangan",
      "maps_url": "https://maps.app.goo.gl/..."
    }
  ]
}
```

**Admin User:**
```json
{
  "id": "usr_01",
  "username": "admin",
  "password": "$2b$10$...",
  "name": "Administrator"
}
```

Default: `admin` / `admin1234`

---

📧 **Author:** Nur Muhammad Wafa - maswafa.is-a.dev
