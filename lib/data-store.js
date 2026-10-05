// import fs from 'node:fs/promises';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// const dataDirectory = path.join(projectRoot, 'data');

// // Membagikan fungsi untuk membaca dan menulis data JSON ke dalam file di direktori 'data'.
// export const readData = async (file) =>
//   JSON.parse(await fs.readFile(path.join(dataDirectory, file), 'utf-8'));

// // Menulis data JSON ke dalam file di direktori 'data', membuat direktori jika belum ada.
// export const writeData = async (file, data) =>
//   fs.writeFile(path.join(dataDirectory, file), JSON.stringify(data, null, 2));
import { put, head, del } from '@vercel/blob';

const BLOB_PREFIX = 'data/';

export async function readData(file) {
  const pathname = BLOB_PREFIX + file;
  try {
    const blob = await head(pathname);
    const res = await fetch(blob.url);
    if (!res.ok) throw new Error('Gagal fetch blob');
    return await res.json();
  } catch (error) {
    // File belum ada, kembalikan array kosong (atau default sesuai kebutuhan)
    return [];
  }
}

export async function writeData(file, data) {
  const pathname = BLOB_PREFIX + file;
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}