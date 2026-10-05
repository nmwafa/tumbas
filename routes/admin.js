import { Router } from "express";
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { readData, writeData } from "../lib/data-store.js";

// Rute admin untuk login, dashboard, dan manajemen produk.
const adminRouter = Router();
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Simpan percobaan login untuk setiap alamat IP untuk mencegah brute-force attack.
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 3;
const LOGIN_ATTEMPT_RESET_MS = 2 * 60 * 1000;

// Mendapatkan kunci unik untuk setiap klien berdasarkan alamat IP atau header 'x-forwarded-for'.
const getClientKey = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  return (
    (forwardedFor ? forwardedFor.split(",")[0].trim() : req.ip) || "unknown"
  );
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

// Menyimpan file gambar yang diunggah ke direktori 'img' dan membatasi ukuran file hingga 10 MB.
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const imageDirectory = path.join(projectRoot, "img");
    await fs.mkdir(imageDirectory, { recursive: true });
    cb(null, imageDirectory);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  },
});

// Konfigurasi multer untuk menangani unggahan gambar produk dengan batas ukuran file 10 MB.
const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Middleware untuk menangani unggahan gambar produk dan mengelola kesalahan terkait ukuran file.
const uploadProductImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(413).json({ error: "Ukuran foto maksimal 10 MB" });
    }

    if (error) return next(error);
    next();
  });
};

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
  res.json({ loggedIn: !!req.session.admin || null });
});

// Logout admin; menghapus sesi untuk mengakhiri login.
adminRouter.post("/api/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Upload gambar produk
adminRouter.post(
  "/api/products/upload",
  requireAuth,
  uploadProductImage,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "File gambar tidak ditemukan" });
    }

    res.json({ image: `/img/${req.file.filename}` });
  },
);

// Tambah Produk
adminRouter.post("/api/products", requireAuth, async (req, res) => {
  const products = await readData("products.json");
  const newProduct = { id: `prod_${Date.now()}`, ...req.body };
  products.push(newProduct);
  await writeData("products.json", products);
  res.status(201).json(newProduct);
});

// Update Produk
adminRouter.put("/api/products/:id", requireAuth, async (req, res) => {
  const products = await readData("products.json");
  const index = products.findIndex((product) => product.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Produk tidak ditemukan" });

  products[index] = { ...products[index], ...req.body };
  await writeData("products.json", products);
  res.json(products[index]);
});

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

    // Hapus file hanya jika gambar adalah upload lokal (bukan URL eksternal)
    if (product.image && typeof product.image === "string") {
      const isExternal = /^https?:\/\//i.test(product.image);
      const isDataUrl = product.image.startsWith("data:");

      if (!isExternal && !isDataUrl && product.image.startsWith("/img/")) {
        const relativeImagePath = product.image.replace(/^\/+/, "");
        const resolved = path.resolve(projectRoot, relativeImagePath);
        const imgDir = path.resolve(projectRoot, "img");

        if (!resolved.startsWith(imgDir + path.sep)) {
          console.warn("Path gambar tidak valid, dilewati:", product.image);
        } else {
          try {
            await fs.unlink(resolved);
          } catch (error) {
            if (error.code !== "ENOENT") {
              console.error("Gagal menghapus file gambar produk:", error);
            }
          }
        }
      }
    }

    products.splice(productIndex, 1);
    await writeData("products.json", products);

    res.json({ success: true, deletedId: product.id });
  } catch (error) {
    console.error("Error saat menghapus produk:", error);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

export default adminRouter;
