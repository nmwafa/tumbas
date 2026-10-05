import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.join(projectRoot, 'data');

// Membagikan fungsi untuk membaca dan menulis data JSON ke dalam file di direktori 'data'.
export const readData = async (file) =>
  JSON.parse(await fs.readFile(path.join(dataDirectory, file), 'utf-8'));

// Menulis data JSON ke dalam file di direktori 'data', membuat direktori jika belum ada.
export const writeData = async (file, data) =>
  fs.writeFile(path.join(dataDirectory, file), JSON.stringify(data, null, 2));