import fs from "node:fs";
import path from "node:path";
import { DIRS, capabilities } from "./config";
import { run } from "./media";
import { newId } from "./storage";
import { registerUpload, type MediaAsset } from "./library";

/** Downloads a video with yt-dlp into the library. Only for content you own or have rights to use. */
export const downloadVideo = async (url: string): Promise<MediaAsset> => {
  if (!/^https?:\/\//i.test(url)) throw new Error("Enter a full http(s) link.");
  if (!capabilities().ytdlp) throw new Error("The video downloader needs yt-dlp on the server (`pip install yt-dlp`).");
  const id = newId();
  const template = path.join(DIRS.tmp, `${id}.%(ext)s`);
  const { stdout } = await run(
    "yt-dlp",
    ["-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b", "--merge-output-format", "mp4", "--no-playlist", "--max-filesize", "800M", "-o", template, "--print", "after_move:filepath", "--print", "title", url],
    { timeoutMs: 30 * 60_000 },
  );
  const lines = stdout.trim().split("\n");
  const file = lines.find((l) => l.startsWith(DIRS.tmp)) ?? fs.readdirSync(DIRS.tmp).map((f) => path.join(DIRS.tmp, f)).find((f) => path.basename(f).startsWith(id));
  if (!file || !fs.existsSync(file)) throw new Error("Download finished but no file was produced.");
  const title = lines.find((l) => !l.startsWith(DIRS.tmp)) ?? "Downloaded video";
  return registerUpload(file, `${title}.mp4`, { move: true });
};
