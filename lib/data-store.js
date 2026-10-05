import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { getStorageMode } from "./storage.js";

// Mendefinisikan path root proyek dan direktori data
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Direktori tempat file data lokal disimpan; digunakan saat mode penyimpanan adalah "local".
const dataDirectory = path.join(projectRoot, "data");
const BLOB_PREFIX = "data/";

// Fungsi untuk mendapatkan path file data lokal yang valid; mencegah traversal direktori.
function getLocalDataPath(file) {
  const filePath = path.resolve(dataDirectory, file);
  const relativePath = path.relative(dataDirectory, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Nama file data tidak valid.");
  }

  return filePath;
}

// Fungsi untuk membaca data dari file lokal; jika file tidak ada, mengembalikan array kosong.
async function readLocalData(file) {
  try {
    return JSON.parse(await fs.readFile(getLocalDataPath(file), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// Fungsi untuk mendapatkan path blob untuk file tertentu; digunakan saat mode penyimpanan adalah "blob".
export function getBlobPath(file) {
  return `${BLOB_PREFIX}${file}`;
}

// Membaca data dari file JSON; jika mode penyimpanan adalah "local", membaca dari file lokal, jika tidak, membaca dari blob.
export async function readData(file) {
  if (getStorageMode() === "local") {
    return readLocalData(file);
  }

  try {
    const blob = await head(getBlobPath(file));
    const response = await fetch(blob.url);
    if (!response.ok) {
      throw new Error(`Gagal membaca blob ${file}: HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof BlobNotFoundError) return readLocalData(file);
    throw error;
  }
}

// Menulis data ke file JSON; jika mode penyimpanan adalah "local", menulis ke file lokal, jika tidak, menulis ke blob.
export async function writeData(file, data) {
  const contents = JSON.stringify(data, null, 2);

  if (getStorageMode() === "local") {
    const filePath = getLocalDataPath(file);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contents, "utf8");
    return;
  }

  await put(getBlobPath(file), contents, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}