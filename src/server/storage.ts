import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { STORAGE } from "./config";

export const newId = () => crypto.randomBytes(8).toString("hex");

export const sha1 = (s: string) => crypto.createHash("sha1").update(s).digest("hex");

/** Public URL for a file inside storage/. */
export const fileUrl = (abs: string) => `/api/files/${path.relative(STORAGE, abs).split(path.sep).map(encodeURIComponent).join("/")}`;

/** Resolves a /api/files URL back to a path on disk, refusing anything outside storage/. */
export const urlToPath = (url: string): string | null => {
  const m = url.match(/^(?:https?:\/\/[^/]+)?\/api\/files\/(.+)$/);
  if (!m) return null;
  const rel = m[1].split("/").map(decodeURIComponent).join(path.sep);
  const abs = path.resolve(STORAGE, rel);
  if (!abs.startsWith(STORAGE + path.sep)) return null;
  return fs.existsSync(abs) ? abs : null;
};

export const safeStoragePath = (parts: string[]): string | null => {
  const abs = path.resolve(STORAGE, ...parts);
  if (!abs.startsWith(STORAGE + path.sep)) return null;
  return abs;
};

export const writeJson = (file: string, data: unknown) => {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
};

export const readJson = <T>(file: string): T | null => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
};

export const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".json": "application/json",
  ".srt": "text/plain; charset=utf-8",
};
