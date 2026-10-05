import { Router } from "express";
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { del, put } from "@vercel/blob";
import { readData, writeData } from "../lib/data-store.js";
import { getStorageMode } from "../lib/storage.js";

// Rute admin untuk login, dashboard, dan manajemen produk.
const adminRouter = Router();

// Menentukan direktori root proyek untuk menyimpan file gambar dan data.
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Simpan percobaan login untuk setiap alamat IP untuk mencegah brute-force attack.
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 3;
const LOGIN_ATTEMPT_RESET_MS = 2 * 60 * 1000;

// Fungsi untuk mendapatkan kunci unik untuk setiap klien berdasarkan alamat IP
const getClientKey = (req) => {
  return req.socket.remoteAddress || req.ip || "unknown";
};

// Mengambil jumlah percobaan login yang gagal untuk alamat IP tertentu; jika sudah melewati batas waktu, reset percobaan.
const getFailedAttempts = (clientKey) => {
  const attempts = loginAttempts.get(clientKey);

  if (!attempts) return 0;

  if (Date.now() > attempts.expiresAt) {
    loginAttempts.delete(clientKey);
    return 0;
  }

  return attempts.count;
};

// Memastikan bahwa rute admin hanya dapat diakses oleh pengguna yang telah diautentikasi.
const requireAuth = (req, res, next) => {
  if (!req.session.admin)
    return res.status(401).json({ error: "Unauthorized" });
  next();
};

const IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);

// Middleware untuk mengunggah gambar produk; membatasi ukuran file dan tipe file yang diizinkan.
const uploadProductImage = (req, res, next) => {
  let storageMode;
  try {
    storageMode = getStorageMode();
  } catch (error) {
    return next(error);
  }

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      // Batasi ukuran file gambar hingga 5 MB
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (request, file, callback) => {
      if (!IMAGE_TYPES.has(file.mimetype)) {
        const error = new Error("Gunakan file JPEG, PNG, WebP, GIF, atau AVIF.");
        error.code = "UNSUPPORTED_IMAGE_TYPE";
        return callback(error);
      }
      callback(null, true);
    },
  });

  upload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      const maxSize = "5 MB";
      return res.status(413).json({ error: `Ukuran gambar maksimal ${maxSize}` });
    }
    if (error?.code === "UNSUPPORTED_IMAGE_TYPE") {
      return res.status(415).json({ error: error.message });
    }
    if (error) return next(error);
    next();
  });
};

// Fungsi untuk menyimpan gambar produk ke penyimpanan lokal atau Blob, tergantung pada mode penyimpanan yang digunakan.
async function saveProductImage(file) {
  const extension = IMAGE_TYPES.get(file.mimetype);
  const pathname = `products/${randomUUID()}${extension}`;

  if (getStorageMode() === "blob") {
    const blob = await put(pathname, file.buffer, {
      access: "public",
      contentType: file.mimetype,
      addRandomSuffix: false,
    });
    return { image: blob.url, pathname: blob.pathname };
  }

  const localPath = path.join(projectRoot, "img", pathname);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, file.buffer, { flag: "wx" });
  return { image: `/img/${pathname}`, localPath };
}

// Fungsi untuk menghapus gambar produk dari penyimpanan lokal atau Blob, tergantung pada mode penyimpanan yang digunakan.
async function deleteProductImage(product) {
  if (typeof product?.image !== "string") return;

  let imageUrl;
  try {
    imageUrl = new URL(product.image, "http://localhost");
  } catch {
    return;
  }

  if (imageUrl.origin !== "http://localhost") {
    const hostname = imageUrl.hostname.toLowerCase();
    const isVercelBlob =
      hostname.endsWith(".blob.vercel-storage.com") ||
      hostname === "blob.vercel-storage.com";
    if (!isVercelBlob || !imageUrl.pathname.startsWith("/products/")) return;

    if (getStorageMode() !== "blob") {
      throw new Error("BLOB_READ_WRITE_TOKEN diperlukan untuk menghapus gambar Blob.");
    }
    await del(product.image);
    return;
  }

  if (!imageUrl.pathname.startsWith("/img/")) return;

  const imageRelativePath = imageUrl.pathname.slice("/img/".length);
  const isCurrentUpload = imageRelativePath.startsWith("products/");
  const isLegacyUpload = /^\d+-[^/]+$/.test(imageRelativePath);
  if (!isCurrentUpload && !isLegacyUpload) return;
  if (process.env.VERCEL === "1") return;

  const imageDirectory = path.resolve(projectRoot, "img");
  const imagePath = path.resolve(imageDirectory, imageRelativePath);
  const relativePath = path.relative(imageDirectory, imagePath);
  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return;
  }

  try {
    await fs.unlink(imagePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

// Membuat objek produk baru dari payload yang diterima; memvalidasi data dan memastikan gambar produk valid.
function getNewProduct(payload, image) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw badRequest("Data produk tidak valid.");
  }

  const { name, category_tab, price_range, description, sellers } = payload;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    !["khas", "umum"].includes(category_tab) ||
    typeof price_range !== "string" ||
    !price_range.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !Array.isArray(sellers)
  ) {
    throw badRequest("Data produk belum lengkap atau tidak valid.");
  }

  if (typeof image !== "string" || !image.trim()) {
    throw badRequest("Gambar produk wajib diisi.");
  }
  if (!isAllowedProductImage(image)) {
    throw badRequest("Gambar harus menggunakan URL HTTP(S) atau path gambar lokal.");
  }

  return {
    id: `prod_${Date.now()}`,
    name: name.trim(),
    category_tab,
    price_range: price_range.trim(),
    image,
    description: description.trim(),
    sellers,
  };
}

// Fungsi untuk membuat error dengan status 400 (Bad Request) dan pesan yang diberikan.
function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

// Fungsi untuk memeriksa apakah gambar produk diizinkan; hanya menerima URL HTTP(S) atau path lokal yang valid.
function isAllowedProductImage(image) {
  if (image.startsWith("/img/")) return true;
  try {
    return ["http:", "https:"].includes(new URL(image).protocol);
  } catch {
    return false;
  }
}

// Halaman login dan dashboard admin; status login dan logout dikelola melalui sesi.
adminRouter.get("/4dm1n", (req, res) => {
  if (req.session.admin) return res.redirect("/4dm1n/dashboard");
  res.sendFile(path.join(projectRoot, "views", "admin-login.html"));
});

// Halaman dashboard admin; hanya dapat diakses jika admin telah login.
adminRouter.get("/4dm1n/dashboard", (req, res) => {
  if (!req.session.admin) return res.redirect("/");
  res.sendFile(path.join(projectRoot, "views", "admin-dashboard.html"));
});

// Login dan logout admin; percobaan login dibatasi untuk mencegah brute-force attack.
adminRouter.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const clientKey = getClientKey(req);
  const failedAttempts = getFailedAttempts(clientKey);

  if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    return res
      .status(429)
      .json({
        error: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
      });
  }

  const users = await readData("users.json");
  const user = users.find((entry) => entry.username === username);

  if (user && (await bcrypt.compare(password, user.password))) {
    loginAttempts.delete(clientKey);
    req.session.admin = { id: user.id, name: user.name };
    return res.json({ success: true, name: user.name });
  }

  const nextFailedAttempts = failedAttempts + 1;
  loginAttempts.set(clientKey, {
    count: nextFailedAttempts,
    expiresAt: Date.now() + LOGIN_ATTEMPT_RESET_MS,
  });

  if (nextFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
    return res
      .status(429)
      .json({
        error: "Percobaan login salah melebihi batas. Silakan coba lagi nanti.",
      });
  }

  res.status(401).json({ error: "Username atau password salah!" });
});

// Memeriksa status login admin; mengembalikan informasi apakah admin sedang login atau tidak.
adminRouter.get("/api/auth/status", (req, res) => {
  res.json({ loggedIn: !!req.session.admin });
});

// Logout admin; menghapus sesi untuk mengakhiri login.
adminRouter.post("/api/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Endpoint upload tetap tersedia untuk integrasi yang mengunggah gambar terpisah.
adminRouter.post(
  "/api/products/upload",
  requireAuth,
  uploadProductImage,
  async (req, res, next) => {
    let savedImage;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "File gambar tidak ditemukan" });
      }
      savedImage = await saveProductImage(req.file);
      res.json({ image: savedImage.image, pathname: savedImage.pathname });
    } catch (error) {
      if (savedImage) {
        try {
          await deleteProductImage({ image: savedImage.image });
        } catch (cleanupError) {
          console.error("Gagal membersihkan gambar upload:", cleanupError);
        }
      }
      next(error);
    }
  },
);

// Tambah Produk
adminRouter.post(
  "/api/products",
  requireAuth,
  uploadProductImage,
  async (req, res, next) => {
    let savedImage;
    let productStored = false;
    try {
      const payload = req.is("multipart/form-data")
        ? JSON.parse(req.body.product || "{}")
        : req.body;
      const products = await readData("products.json");

      if (req.file) savedImage = await saveProductImage(req.file);
      const newProduct = getNewProduct(
        payload,
        savedImage?.image || payload?.image,
      );
      products.push(newProduct);
      await writeData("products.json", products);
      productStored = true;

      res.status(201).json(newProduct);
    } catch (error) {
      if (savedImage && !productStored) {
        try {
          await deleteProductImage({ image: savedImage.image });
        } catch (cleanupError) {
          console.error("Gagal membersihkan gambar upload:", cleanupError);
        }
      }
      if (error instanceof SyntaxError) {
        return res.status(400).json({ error: "Data produk tidak valid." });
      }
      if (error.status === 400) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },
);

// Update Produk
// adminRouter.put("/api/products/:id", requireAuth, async (req, res) => {
//   const products = await readData("products.json");
//   const index = products.findIndex((product) => product.id === req.params.id);
//   if (index === -1)
//     return res.status(404).json({ error: "Produk tidak ditemukan" });

//   products[index] = { ...products[index], ...req.body };
//   await writeData("products.json", products);
//   res.json(products[index]);
// });

// Hapus Produk dan file gambar terkait jika ada
adminRouter.delete("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const products = await readData("products.json");
    const productIndex = products.findIndex(
      (product) => String(product.id) === req.params.id,
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: "Produk tidak ditemukan" });
    }

    const product = products[productIndex];
    products.splice(productIndex, 1);
    await writeData("products.json", products);

    try {
      await deleteProductImage(product);
    } catch (error) {
      console.error("Produk terhapus, tetapi gambar gagal dihapus:", error);
      return res.status(500).json({
        error: "Produk terhapus, tetapi gambar gagal dihapus. Hapus file secara manual atau periksa konfigurasi Blob.",
        deletedId: product.id,
      });
    }

    res.json({ success: true, deletedId: product.id });
  } catch (error) {
    console.error("Error saat menghapus produk:", error);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

export default adminRouter;
