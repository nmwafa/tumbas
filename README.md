<div align="center">
  <img src="img/logo.png" alt="Tumbas Logo" width="300">
</div>

# Apa ini?

Tumbas adalah aplikasi katalog produk UMKM Purworejo berbasis web yang memungkinkan calon pembeli melihat daftar produk lokal, mencari produk berdasarkan kategori, dan langsung terhubung dengan penjual melalui WhatsApp maupun Google Maps. Di sisi admin, aplikasi ini menyediakan dashboard untuk mengelola katalog produk, menambahkan penjual, dan mengupload gambar produk.

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Struktur Proyek](#struktur-proyek)
- [Arsitektur dan Flow Aplikasi](#arsitektur-dan-flow-aplikasi)
- [Data yang Digunakan Saat Ini](#data-yang-digunakan-saat-ini)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Instalasi dan Menjalankan Aplikasi](#instalasi-dan-menjalankan-aplikasi)
- [Panduan Penggunaan](#panduan-penggunaan)
- [API Endpoints](#api-endpoints)
- [Contoh Payload dan Request](#contoh-payload-dan-request)
- [Keamanan](#keamanan)
- [Catatan Implementasi Saat Ini](#catatan-implementasi-saat-ini)
- [Kontribusi](#kontribusi)

---

## Tentang Proyek

Tumbas dibangun untuk mendukung promosi produk UMKM Purworejo secara digital. Aplikasi ini memiliki dua sisi utama:

1. Sisi publik untuk menampilkan katalog produk secara menarik dan responsif.
2. Sisi admin untuk mengelola daftar produk dan penjual secara cepat.

Saat ini aplikasi sudah dapat:

- menampilkan produk dengan kategori `khas` dan `umum`
- menampilkan pencarian produk secara real-time di sisi client
- membuka modal detail produk dengan daftar penjual
- menghubungkan pembeli ke WhatsApp dan Google Maps tiap penjual
- melakukan login admin dengan sesi berbasis Express Session
- melakukan CRUD produk melalui dashboard admin
- mengupload gambar produk ke folder `img/`

---

## Fitur Utama

### Fitur Publik

- Pencarian produk berdasarkan nama menggunakan input di header
- Pembagian tab produk menjadi `Produk Khas` dan `Produk Umum`
- Tampilan katalog responsif untuk desktop, tablet, dan mobile
- Modal detail produk yang berisi deskripsi serta daftar penjual
- Integrasi tombol WhatsApp dan Google Maps per penjual
- Tampilan modern dengan Tailwind CSS dan Alpine.js

### Fitur Admin

- Login admin melalui halaman `/4dm1n`
- Dashboard produk untuk melihat daftar produk yang sudah ada
- Tambah produk baru dari form yang lengkap
- Pilihan sumber gambar dari URL atau upload file
- Tambah dan hapus penjual di dalam satu produk
- Hapus produk dengan konfirmasi terlebih dahulu
- Logout melalui modal konfirmasi

### Fitur Keamanan yang Sudah Tersedia

- Password admin disimpan dalam bentuk hash menggunakan `bcryptjs`
- Rate limiting login untuk mencegah brute force
- Session cookie berbasis `express-session`
- Middleware `requireAuth` untuk melindungi endpoint admin
- Upload file gambar dibatasi ke tipe gambar saja

---

## Struktur Proyek

```bash
tumbas/
├── data/
│   ├── products.json
│   └── users.json
├── img/
├── public/
│   ├── 404.html
│   ├── index.html
│   └── favicon.svg
├── views/
│   ├── admin-dashboard.html
│   └── admin-login.html
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

Keterangan singkat:

- `public/index.html` berisi halaman katalog publik
- `views/admin-login.html` berisi halaman login admin
- `views/admin-dashboard.html` berisi dashboard admin CRUD
- `data/products.json` berisi data katalog produk
- `data/users.json` berisi data user admin
- `img/` digunakan untuk menyimpan upload gambar produk

---

## Arsitektur dan Flow Aplikasi

### Alur Publik

1. Client membuka halaman utama `/`
2. Browser memanggil `GET /api/products`
3. Server membaca file `data/products.json`
4. Produk ditampilkan di UI publik dan dapat difilter berdasarkan tab dan search
5. Saat user mengeklik produk, modal detail muncul dan menampilkan seller data

### Alur Admin

1. Admin membuka `/4dm1n`
2. Jika belum login, server menampilkan form login
3. Setelah login berhasil, server menyimpan session admin
4. Admin diarahkan ke `/4dm1n/dashboard`
5. Dashboard memanggil `GET /api/auth/status` untuk mengecek sesi login
6. Admin dapat menambah, menghapus, dan melihat daftar produk

### Arsitektur Server

Server utama `server.js` menggunakan Express.js dengan struktur sebagai berikut:

- `express.static()` untuk menyajikan file publik dari `public/`
- `express.static('/img')` untuk menyajikan file gambar dari `img/`
- `express-session` untuk session-based authentication
- `multer` untuk upload file gambar
- helper `readData()` dan `writeData()` untuk operasi JSON file-based
- middleware `requireAuth` untuk proteksi endpoint admin

---

## Data yang Digunakan Saat Ini

### Contoh data produk

Data produk saat ini berada di `data/products.json` dan memiliki struktur seperti berikut:

```json
[
  {
    "id": "prod_1789107738368",
    "name": "Kue Lompong",
    "category_tab": "khas",
    "price_range": "Rp 5000",
    "image": "https://tempatwisataseru.com/wp-content/uploads/2023/09/Kue-Lompong-via-Jatengprov.jpg",
    "description": "Kue lontong dibuat dari bahan dasar batang daun talas ...",
    "sellers": [
      {
        "name": "Bu Kartini",
        "phone": "628888888888",
        "address": "Jl. Kenangan",
        "maps_url": "https://maps.app.goo.gl/FVqsygDYGY8m8u4B7"
      }
    ]
  }
]
```

### Contoh data user admin

```json
[
  {
    "id": "usr_01",
    "username": "admin",
    "password": "$2b$10$87T9zddxGseygQH0FZBs4uYKMptSIPjpOUJpVuEGImC29wBAUGari",
    "name": "Administrator"
  }
]
```

> File `users.json` saat ini sudah berisi user **admin** dengan password default **admin1234**. Untuk membuat password baru, gunakan `bcryptjs` seperti pada contoh di bawah.

---

## Teknologi yang Digunakan

### Backend

- Node.js
- Express.js 5.2.1
- express-session
- bcryptjs
- multer

### Frontend

- HTML5
- Tailwind CSS
- Alpine.js
- Google Fonts (`Nunito`)

### Storage

- JSON file-based storage (`data/products.json`, `data/users.json`)
- Folder `img/` untuk menyimpan file gambar hasil upload

---

## Instalasi dan Menjalankan Aplikasi

### Prasyarat

- Node.js 16+
- npm
- Git

### Langkah instalasi

1. Clone repository:

   ```bash
   git clone https://github.com/nmwafa/tumbas.git
   cd tumbas
   ```

2. Install dependency:

   ```bash
   npm install
   ```

3. Jalankan aplikasi:

   Mode development:

   ```bash
   npm run dev
   ```

   Mode production:

   ```bash
   npm start
   ```

4. Akses aplikasi:

- Katalog publik: `http://localhost:3000/`
- Login admin: `http://localhost:3000/4dm1n`
- Dashboard admin setelah login: `http://localhost:3000/4dm1n/dashboard`

### Membuat hash password baru untuk admin

Jika Anda ingin mengganti password admin, Anda bisa membuat hash dengan perintah berikut:

```bash
node -e "import bcrypt from 'bcryptjs'; const password='passwordbaru'; bcrypt.hash(password, 10).then((hash) => console.log(hash));"
```

Lalu salin hasil hash ke field `password` pada `data/users.json`.

---

## Panduan Penggunaan

### Untuk Pembeli / Pengunjung

1. Buka halaman utama `http://localhost:3000/`
2. Gunakan tab `Produk Khas` atau `Produk Umum`
3. Gunakan kolom pencarian untuk mencari produk tertentu
4. Klik kartu produk untuk melihat detail
5. Hubungi penjual melalui tombol WhatsApp atau buka lokasi via Google Maps

### Untuk Admin

1. Buka `http://localhost:3000/4dm1n`
2. Login dengan username dan password admin
3. Di dashboard, Anda dapat:
   - menambah produk baru
   - memilih kategori produk
   - memasukkan rentang harga
   - menambahkan penjual dan kontaknya
   - memilih foto produk dari URL atau upload file
   - menghapus produk yang sudah tidak berlaku

### Flow menambah produk baru

Dalam dashboard admin, form tambah produk mencakup field: `name`, `category_tab`, `price_range`, `image`, `description`, dan `sellers`.

Untuk produk yang disimpan, struktur data yang dikirim dari dashboard ke server biasanya seperti:

```json
{
  "name": "Kupat Tahu",
  "category_tab": "umum",
  "price_range": "Rp 15.000",
  "image": "https://example.com/kupat-tahu.jpg",
  "description": "Kupat tahu dengan bumbu kacang dan kuah manis.",
  "sellers": [
    {
      "name": "Toko Pak Joko",
      "phone": "6281234567890",
      "address": "Jl. Merdeka No. 12, Purworejo",
      "maps_url": "https://maps.google.com/?q=Jl.+Merdeka+No.+12+Purworejo"
    }
  ]
}
```

---

## API Endpoints

### Endpoint Publik

#### 1. Ambil Semua Produk

```http
GET /api/products
```

Contoh response:

```json
[
  {
    "id": "prod_1789107738368",
    "name": "Kue Lompong",
    "category_tab": "khas",
    "price_range": "Rp 5000",
    "image": "https://tempatwisataseru.com/....jpg",
    "description": "Kue lontong dibuat dari bahan dasar batang daun talas ...",
    "sellers": [
      {
        "name": "Bu Kartini",
        "phone": "628888888888",
        "address": "Jl. Kenangan",
        "maps_url": "https://maps.app.goo.gl/FVqsygDYGY8m8u4B7"
      }
    ]
  }
]
```

#### 2. Upload Gambar Produk

```http
POST /api/products/upload
Content-Type: multipart/form-data
```

Body form-data:

```text
image = <file-gambar>
```

Response:

```json
{
  "image": "/img/1720000000000-kue-lompong.jpg"
}
```

### Endpoint Admin

#### 3. Login Admin

```http
POST /api/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "username": "admin",
  "password": "passwordmu"
}
```

Response sukses:

```json
{
  "success": true,
  "name": "Administrator"
}
```

#### 4. Cek Status Login

```http
GET /api/auth/status
```

Response:

```json
{
  "loggedIn": true,
  "user": {
    "id": "usr_01",
    "name": "Administrator"
  }
}
```

#### 5. Logout

```http
POST /api/auth/logout
```

Response:

```json
{
  "success": true
}
```

#### 6. Tambah Produk

```http
POST /api/products
Content-Type: application/json
```

Request dengan session admin aktif:

```json
{
  "name": "Produk Baru",
  "price_range": "Rp 25.000",
  "description": "Deskripsi produk baru",
  "category_tab": "khas",
  "image": "/img/produk-baru.jpg",
  "sellers": [
    {
      "name": "Toko A",
      "address": "Jl. Raya No. 1",
      "phone": "6281234567890",
      "maps_url": "https://maps.google.com/?q=Jl.+Raya+No.+1"
    }
  ]
}
```

Response:

```json
{
  "id": "prod_1720000000000",
  "name": "Produk Baru",
  "price_range": "Rp 25.000",
  "description": "Deskripsi produk baru",
  "category_tab": "khas",
  "image": "/img/produk-baru.jpg",
  "sellers": [
    {
      "name": "Toko A",
      "address": "Jl. Raya No. 1",
      "phone": "6281234567890",
      "maps_url": "https://maps.google.com/?q=Jl.+Raya+No.+1"
    }
  ]
}
```

#### 7. Edit Produk

```http
PUT /api/products/:id
Content-Type: application/json
```

Request mirip dengan endpoint tambah produk, hanya perlu mengirim field yang ingin diubah.

#### 8. Hapus Produk

```http
DELETE /api/products/:id
```

Response:

```json
{
  "success": true
}
```

---

## Contoh Payload dan Request

### Contoh curl untuk login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"passwordmu"}'
```

### Contoh curl untuk mengambil semua produk

```bash
curl http://localhost:3000/api/products
```

### Contoh curl untuk upload gambar

```bash
curl -X POST http://localhost:3000/api/products/upload \
  -F "image=@/path/to/gambar.jpg"
```

### Contoh curl untuk menambahkan produk

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SESSION_ID" \
  -d '{
    "name": "Produk Baru",
    "category_tab": "umum",
    "price_range": "Rp 20.000",
    "image": "/img/produk-baru.jpg",
    "description": "Deskripsi produk baru",
    "sellers": [
      {
        "name": "Toko Baru",
        "phone": "628123456780",
        "address": "Jl. Baru No. 4",
        "maps_url": "https://maps.google.com/?q=Jl.+Baru+No.+4"
      }
    ]
  }'
```

---

## Keamanan

### Fitur yang sudah diterapkan

1. Password hash menggunakan `bcryptjs`
2. Login rate limiting berdasarkan client key (IP / forwarded IP)
3. Session admin menggunakan `express-session`
4. Proteksi endpoint admin lewat middleware `requireAuth`
5. Nama file upload di-sanitasi dengan timestamp agar aman
6. Upload hanya menerima file gambar

### Catatan untuk production

- Gunakan `HTTPS` di lingkungan production
- Simpan secret session di environment variable, bukan hardcode seperti saat ini
- Hindari menyimpan data sensitif di file JSON bila aplikasi berkembang lebih besar

---

## Catatan Implementasi Saat Ini

Beberapa detail penting yang perlu diperhatikan dari implementasi saat ini:

- `server.js` menggunakan `type: module`, jadi sintaks JavaScript menggunakan ES Modules
- Session secret saat ini dibuat langsung di kode (`super-secret-key-101`)
- Database bersifat file-based, sehingga semua data produk dan user disimpan di JSON
- Endpoint `DELETE /api/products/:id` juga akan mencoba menghapus file gambar terkait jika file ada di folder `img/`
- Halaman admin menyediakan dua metode input gambar: URL dan upload file
- Saat menambah produk, seller yang kosong otomatis akan di-saring pada server payload

---

## Kontribusi

Kontribusi sangat terbuka. Jika Anda ingin membantu meningkatkan Tumbas, Anda dapat:

1. fork repository
2. buat branch baru
3. lakukan perubahan
4. commit dan push
5. buka pull request

---

## Informasi Tambahan

- Nama project: `tumbas`
- Port default: `3000`
- Main entry file: `server.js`
- README ini diperbarui berdasarkan struktur proyek dan implementasi terkini yang ada di workspace saat ini.

---

Made with ❤️ for UMKM Purworejo
