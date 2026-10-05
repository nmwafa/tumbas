import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { getStorageMode } from "./storage.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const dataDirectory = path.join(projectRoot, "data");
const BLOB_PREFIX = "data/";

function getLocalDataPath(file) {
  const filePath = path.resolve(dataDirectory, file);
  const relativePath = path.relative(dataDirectory, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Nama file data tidak valid.");
  }

  return filePath;
}

async function readLocalData(file) {
  try {
    return JSON.parse(await fs.readFile(getLocalDataPath(file), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export function getBlobPath(file) {
  return `${BLOB_PREFIX}${file}`;
}

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