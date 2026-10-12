import fs from "node:fs";
import path from "node:path";
import { DIRS } from "./config";
import { normalizeVideo, probe, run } from "./media";
import { fileUrl, newId, readJson, writeJson } from "./storage";

export interface MediaAsset {
  id: string;
  kind: "video" | "image" | "audio";
  name: string;
  src: string;
  thumb?: string;
  duration: number;
  width?: number;
  height?: number;
  size: number;
  createdAt: number;
}

const IMAGE = /\.(png|jpe?g|webp|gif)$/i;
const AUDIO = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;

/** Copies (or moves) a file into the library, normalizing video for in-browser preview. */
export const registerUpload = async (file: string, originalName: string, opts: { move?: boolean } = {}): Promise<MediaAsset> => {
  const id = newId();
  const ext = path.extname(originalName).toLowerCase() || path.extname(file).toLowerCase();
  const name = originalName.replace(/\.[^.]+$/, "").slice(0, 120) || "Untitled";
  let asset: MediaAsset;
  if (IMAGE.test(ext)) {
    const dest = path.join(DIRS.uploads, `${id}${ext}`);
    opts.move ? fs.renameSync(file, dest) : fs.copyFileSync(file, dest);
    const p = await probe(dest).catch(() => null);
    asset = { id, kind: "image", name, src: fileUrl(dest), thumb: fileUrl(dest), duration: 0, width: p?.width, height: p?.height, size: fs.statSync(dest).size, createdAt: Date.now() };
  } else if (AUDIO.test(ext)) {
    const dest = path.join(DIRS.uploads, `${id}${ext}`);
    opts.move ? fs.renameSync(file, dest) : fs.copyFileSync(file, dest);
    const p = await probe(dest);
    asset = { id, kind: "audio", name, src: fileUrl(dest), duration: p.duration, size: fs.statSync(dest).size, createdAt: Date.now() };
  } else {
    const p = await probe(file);
    if (!p.hasVideo) throw new Error("That file has no video stream.");
    const dest = path.join(DIRS.uploads, `${id}.mp4`);
    await normalizeVideo(file, dest, p);
    if (opts.move) fs.rmSync(file, { force: true });
    const final = await probe(dest);
    const thumb = path.join(DIRS.uploads, `${id}.jpg`);
    await run("ffmpeg", ["-y", "-ss", String(Math.min(1, final.duration / 3)), "-i", dest, "-frames:v", "1", "-vf", "scale=360:-2", thumb]).catch(() => undefined);
    asset = {
      id,
      kind: "video",
      name,
      src: fileUrl(dest),
      thumb: fs.existsSync(thumb) ? fileUrl(thumb) : undefined,
      duration: final.duration,
      width: final.width,
      height: final.height,
      size: fs.statSync(dest).size,
      createdAt: Date.now(),
    };
  }
  writeJson(path.join(DIRS.uploads, `${id}.meta.json`), asset);
  return asset;
};

export const listUploads = (): MediaAsset[] =>
  fs
    .readdirSync(DIRS.uploads)
    .filter((f) => f.endsWith(".meta.json"))
    .map((f) => readJson<MediaAsset>(path.join(DIRS.uploads, f)))
    .filter((a): a is MediaAsset => Boolean(a))
    .sort((a, b) => b.createdAt - a.createdAt);

export const deleteUpload = (id: string) => {
  if (!/^[a-f0-9]{16}$/.test(id)) return false;
  let found = false;
  for (const f of fs.readdirSync(DIRS.uploads)) {
    if (f.startsWith(id)) {
      fs.rmSync(path.join(DIRS.uploads, f), { force: true });
      found = true;
    }
  }
  return found;
};
