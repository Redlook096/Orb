import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { DIRS } from "@/server/config";
import { newId } from "@/server/storage";
import { registerUpload } from "@/server/library";
import { fail, json } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

const ALLOWED = /\.(mp4|mov|m4v|webm|mkv|avi|png|jpe?g|webp|gif|mp3|wav|m4a|aac|ogg|flac)$/i;

/** Streams the raw request body to disk (no multipart buffering), then registers it in the library. */
export async function POST(req: Request) {
  const name = new URL(req.url).searchParams.get("name") ?? "upload";
  if (!ALLOWED.test(name)) return fail("Unsupported file type. Use a video (MP4, MOV, WebM), image, or audio file.");
  if (!req.body) return fail("Empty upload.");
  const tmp = path.join(DIRS.tmp, `${newId()}${path.extname(name).toLowerCase()}`);
  try {
    await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), fs.createWriteStream(tmp));
    const asset = await registerUpload(tmp, name, { move: true });
    return json(asset);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    return fail(`Upload failed: ${(e as Error).message}`, 500);
  }
}
