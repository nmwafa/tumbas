export function getStorageMode() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";

  if (process.env.VERCEL === "1") {
    const error = new Error(
      "BLOB_READ_WRITE_TOKEN wajib diatur pada deployment Vercel.",
    );
    error.status = 503;
    error.expose = true;
    throw error;
  }

  return "local";
}
