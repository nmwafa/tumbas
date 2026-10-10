# Tumbas

Katalog produk UMKM Purworejo. Pengunjung dapat mencari produk dan menghubungi penjual melalui WhatsApp atau Google Maps. Admin dapat mengelola produk dan penjual dari dashboard.

## Fitur

- Katalog responsif dengan pencarian dan kategori produk.
- Dashboard admin dengan login, pencarian, tambah, edit, dan hapus produk.
- Data penjual mencakup nama, nomor WhatsApp, alamat, dan tautan Google Maps.
- Gambar produk dapat menggunakan URL atau upload file (maksimal 4 MB).
- Penyimpanan lokal berbasis JSON atau Vercel Blob.

## Menjalankan Lokal

Persyaratan: Node.js 18+ dan npm.

```bash
npm install
npm run dev
```

Katalog tersedia di `http://localhost:3000/` dan dashboard admin di `http://localhost:3000/4dm1n`.

## API

`GET /api/products` bersifat publik. Endpoint lainnya memerlukan sesi admin:

| Metode | Endpoint | Fungsi |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Login admin |
| `GET` | `/api/auth/status` | Status sesi |
| `POST` | `/api/auth/logout` | Logout admin |
| `POST` | `/api/products` | Tambah produk (JSON atau multipart) |
| `PUT` | `/api/products/:id` | Edit produk (JSON atau multipart) |
| `DELETE` | `/api/products/:id` | Hapus produk |

Data produk berisi `name`, `category_tab` (`khas` atau `umum`), `price_range`, `image`, `description`, dan array `sellers`. Setiap penjual berisi `name`, `phone`, `address`, serta `maps_url`.

## Vercel

Deploy melalui Vercel dan atur environment variable `BLOB_READ_WRITE_TOKEN` agar data serta gambar tersimpan persisten di Vercel Blob. Atur juga `SESSION_SECRET` dengan nilai acak yang kuat untuk production. Penyimpanan file lokal ditujukan untuk development, bukan deployment serverless.

## Lisensi

ISC. Lihat [LICENSE](LICENSE).

## Kredit

Nur Muhammad Wafa - maswafa.is-a.dev
