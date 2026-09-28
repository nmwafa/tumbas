import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.join(projectRoot, 'data');

// Shared JSON access for the public catalog and admin routes.
export const readData = async (file) =>
  JSON.parse(await fs.readFile(path.join(dataDirectory, file), 'utf-8'));

export const writeData = async (file, data) =>
  fs.writeFile(path.join(dataDirectory, file), JSON.stringify(data, null, 2));