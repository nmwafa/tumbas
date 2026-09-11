<div align="center">
  <img src="img/logo.jfif" alt="Tumbas Logo" width="200">
</div>

Platform e-commerce yang menampilkan produk-produk UMKM lokal Purworejo dengan fitur admin dashboard untuk manajemen produk.

**Bahasa:** Indonesian

---

## 📋 Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [API Endpoints](#api-endpoints)
- [Keamanan](#keamanan)
- [Kontribusi](#kontribusi)

---

## 🎯 Tentang Proyek

**Tumbas** adalah aplikasi web yang dirancang untuk menampilkan dan mengelola katalog produk UMKM Purworejo. Aplikasi ini memudahkan konsumen menemukan produk lokal berkualitas dan menghubungi penjual.

Fitur admin memungkinkan pengelola untuk menambah, mengubah, dan menghapus produk beserta gambarnya dengan sistem login yang aman.

---

## ✨ Fitur Utama

### Fitur Publik
- 🔍 **Pencarian Produk** - Cari produk berdasarkan nama
- 📑 **Kategori Tab** - Filter produk menjadi "Produk Khas" dan "Produk Umum"
- 🏪 **Daftar Penjual** - Lihat informasi lengkap penjual produk termasuk:
  - Nama dan alamat toko
  - Nomor WhatsApp (terintegrasi WhatsApp)
  - Link Google Maps lokasi toko
- 📱 **Responsive Design** - Dioptimalkan untuk mobile, tablet, dan desktop
- 🎨 **UI/UX Modern** - Desain minimalis dengan Tailwind CSS dan Alpine.js

### Fitur Admin
- 🔐 **Sistem Login Aman** - Autentikasi dengan bcryptjs
- ⚔️ **Rate Limiting** - Perlindungan brute force (max 3 percobaan login)
- ➕ **CRUD Produk** - Tambah, edit, dan hapus produk
- 🖼️ **Upload Gambar** - Upload dan kelola gambar produk
- 📊 **Dashboard Admin** - Interface untuk mengelola katalog produk
- 🔚 **Session Management** - Sesi admin dengan timeout 24 jam

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Express.js v5.2.1
- **Runtime:** Node.js (ES Modules)
- **Authentication:** bcryptjs (password hashing)
- **Session:** express-session
- **File Upload:** multer

### Frontend
- **HTML5** & **CSS3**
- **Styling:** Tailwind CSS
- **Interactivity:** Alpine.js
- **Font:** Google Fonts (Nunito)

### Database
- **Format:** JSON (file-based storage)
- **Files:** `data/products.json`, `data/users.json`

---

## 📁 Struktur Folder

```
tumbas/
├── public/                    # File statis (frontend publik)
│   ├── index.html            # Halaman utama katalog
│   ├── 404.html              # Halaman 404
│   └── ...                   # CSS, images tambahan
├── views/                     # Template HTML admin
│   ├── admin-login.html      # Halaman login admin
│   └── admin-dashboard.html  # Dashboard manajemen produk
├── data/                      # Database JSON
│   ├── products.json         # Daftar produk
│   └── users.json            # Daftar admin users
├── img/                       # Folder upload gambar produk
├── server.js                  # File utama server Express
├── package.json              # Dependencies dan scripts
├── package-lock.json         # Lock file npm
└── README.md                 # File ini
```

---

## 🚀 Instalasi

### Prasyarat
- Node.js >= 16.x
- npm atau yarn
- Git

### Langkah-Langkah

1. **Clone Repository**
   ```bash
   git clone https://github.com/nmwafa/tumbas.git
   cd tumbas
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   - Database menggunakan JSON files di folder `data/`
   - File `products.json` dan `users.json` sudah tersedia

4. **Konfigurasi Admin**
   - Edit `data/users.json` untuk menambah/mengubah admin
   - Password harus di-hash menggunakan bcryptjs
   ```json
   {
     "id": 1,
     "name": "Admin Name",
     "username": "admin_username",
     "password": "$2a$10$hashedPasswordHere"
   }
   ```

5. **Jalankan Aplikasi**
   
   **Mode Development (dengan auto-reload):**
   ```bash
   npm run dev
   ```
   
   **Mode Production:**
   ```bash
   npm start
   ```

6. **Akses Aplikasi**
   - Halaman publik: http://localhost:3000
   - Login admin: http://localhost:3000/4dm1n

---

## 💻 Penggunaan

### Untuk Pengunjung / Pembeli
1. Buka http://localhost:3000
2. Gunakan tombol tab untuk filter: "Produk Khas" atau "Produk Umum"
3. Gunakan search bar untuk mencari produk
4. Klik produk untuk melihat detail dan daftar penjual
5. Hubungi penjual melalui WhatsApp atau Google Maps

### Untuk Admin
1. Buka http://localhost:3000/4dm1n
2. Login dengan username dan password
3. Di dashboard, Anda dapat:
   - ➕ Tambah produk baru (nama, harga, deskripsi, kategori, gambar, penjual)
   - ✏️ Edit produk yang ada
   - 🗑️ Hapus produk (gambar akan otomatis dihapus)
   - 🖼️ Upload gambar produk

---

## 🔌 API Endpoints

### Endpoints Publik

#### Dapatkan Semua Produk
```http
GET /api/products
```
Response:
```json
[
  {
    "id": "prod_1234567890",
    "name": "Produk Khas",
    "price_range": "Rp 50.000 - Rp 100.000",
    "description": "Deskripsi produk",
    "category_tab": "khas",
    "image": "/img/1234567890-product.jpg",
    "sellers": [
      {
        "name": "Toko A",
        "address": "Jl. Raya No.1, Purworejo",
        "phone": "62812345678",
        "maps_url": "https://maps.google.com/..."
      }
    ]
  }
]
```

#### Upload Gambar Produk
```http
POST /api/products/upload
Content-Type: multipart/form-data

Body: file (image)
```
Response:
```json
{
  "image": "/img/1234567890-product.jpg"
}
```

### Endpoints Admin (Memerlukan Login)

#### Login Admin
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin_username",
  "password": "password"
}
```

#### Cek Status Login
```http
GET /api/auth/status
```

#### Logout
```http
POST /api/auth/logout
```

#### Tambah Produk
```http
POST /api/products
Authorization: Session Cookie
Content-Type: application/json

{
  "name": "Nama Produk",
  "price_range": "Rp XX - Rp XX",
  "description": "Deskripsi produk",
  "category_tab": "khas",
  "image": "/img/filename.jpg",
  "sellers": [
    {
      "name": "Nama Penjual",
      "address": "Alamat",
      "phone": "62812345678",
      "maps_url": "https://..."
    }
  ]
}
```

#### Edit Produk
```http
PUT /api/products/:id
Authorization: Session Cookie
Content-Type: application/json

{ ...same as POST... }
```

#### Hapus Produk
```http
DELETE /api/products/:id
Authorization: Session Cookie
```

---

## 🔒 Keamanan

### Fitur Keamanan yang Diimplementasikan

1. **Password Hashing**
   - Password admin di-hash menggunakan bcryptjs
   - Password tidak pernah disimpan dalam plaintext

2. **Rate Limiting**
   - Maksimal 3 percobaan login gagal per client
   - Timeout 2 menit sebelum bisa login kembali
   - Identifikasi client berdasarkan IP address

3. **Session Management**
   - Session secret key yang aman
   - Session cookie maxAge: 24 jam
   - Session terminator otomatis pada logout

4. **File Upload Security**
   - Sanitasi nama file dengan timestamp
   - Spasi dalam nama file diganti dengan dash
   - Upload hanya untuk gambar
   - File tersimpan di folder terisolasi (`/img`)

5. **Authentication Middleware**
   - Endpoint admin dilindungi dengan middleware `requireAuth`
   - Hanya user yang login yang bisa akses CRUD produk

6. **HTTPS Recommendation**
   - Untuk production, gunakan HTTPS
   - Konfigurasi environment variable untuk secret key

---

## 📝 Catatan Pengembangan

### Environment Variables (Recommended)
Buat file `.env`:
```
PORT=3000
SESSION_SECRET=your-secure-secret-key
NODE_ENV=production
```

### Production Deployment
```bash
npm install --production
NODE_ENV=production npm start
```

### Logging
Aplikasi mencatat error pada console:
- Error upload gambar
- Error penghapusan gambar saat delete produk

---

## 🤝 Kontribusi

Kontribusi selalu diterima! Untuk berkontribusi:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

---

## 👤 Autor

**Nama Pemilik:** nmwafa

---

## 📞 Support

Jika menemukan bug atau memiliki pertanyaan, silakan buka issue di repository ini.

---

**Made with ❤️ for UMKM Purworejo**
