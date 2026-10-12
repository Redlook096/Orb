import path from "node:path";
import fs from "node:fs";
import { synthesize } from "@/server/tts";
import { run } from "@/server/media";
import { urlToPath, fileUrl } from "@/server/storage";
import { fail, json, readBody } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

/** AI Voiceover tool: one script in, a WAV + MP3 with word timings out. */
export async function POST(req: Request) {
  const body = await readBody<{ text?: string; voice?: string; speed?: number }>(req);
  const text = body?.text?.trim();
  if (!text) return fail("Write something to read.");
  if (text.length > 5000) return fail("Keep voiceovers under 5,000 characters.");
  try {
    const { speech, warnings } = await synthesize([{ id: "vo", text, voice: body?.voice || "kokoro:am_adam", speed: Number(body?.speed) || 1 }]);
    const s = speech.vo;
    const wav = s.src ? urlToPath(s.src) : null;
    let mp3: string | null = null;
    if (wav) {
      const out = wav.replace(/\.wav$/, ".mp3");
      if (!fs.existsSync(out)) await run("ffmpeg", ["-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "192k", out]);
      mp3 = fileUrl(out);
    }
    return json({ url: s.src, mp3, duration: s.duration, words: s.words, warnings, name: path.basename(wav ?? "voiceover.wav") });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
