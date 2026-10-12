import fs from "node:fs";
import path from "node:path";
import { DIRS, PYTHON, WHISPER_MODEL, capabilities } from "./config";
import { extractAudio, run } from "./media";
import { newId, readJson, sha1, writeJson } from "./storage";
import type { WordTiming } from "@/remotion/lib/types";

interface Transcript {
  words: WordTiming[];
  engine: string;
}

const viaOpenAI = async (audio: string): Promise<WordTiming[]> => {
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(audio)], { type: "audio/mpeg" }), "audio.mp3");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Transcription failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as {
    words?: { word: string; start: number; end: number }[];
    segments?: { start: number; end: number; text: string }[];
  };
  const words = (j.words ?? []).map((w) => ({ text: w.word.trim(), start: w.start, end: w.end }));
  // Whisper's word list drops punctuation; restore it from segment text when the counts line up.
  for (const seg of j.segments ?? []) {
    const tokens = seg.text.trim().split(/\s+/).filter(Boolean);
    const inSeg = words.filter((w) => w.start >= seg.start - 0.02 && w.end <= seg.end + 0.02);
    if (tokens.length === inSeg.length) inSeg.forEach((w, i) => (w.text = tokens[i]));
  }
  return words;
};

const viaLocal = async (audio: string): Promise<WordTiming[]> => {
  const script = path.join(process.cwd(), "scripts", "whisper_transcribe.py");
  const { stdout } = await run(PYTHON, [script, audio, WHISPER_MODEL], { timeoutMs: 60 * 60_000 });
  return (JSON.parse(stdout) as { words: WordTiming[] }).words;
};

/** Word-level transcript of a media file, cached by file identity. */
export const transcribe = async (mediaPath: string): Promise<Transcript> => {
  const stat = fs.statSync(mediaPath);
  const key = sha1(`${mediaPath}|${stat.size}|${stat.mtimeMs}`);
  const cacheFile = path.join(DIRS.tmp, `transcript-${key}.json`);
  const cached = readJson<Transcript>(cacheFile);
  if (cached) return cached;
  const caps = capabilities();
  if (!caps.openai && !caps.localWhisper) {
    throw new Error("Auto captions need a transcription engine: set OPENAI_API_KEY, or `pip install faster-whisper` for local Whisper.");
  }
  const audio = path.join(DIRS.tmp, `${newId()}.mp3`);
  await extractAudio(mediaPath, audio);
  try {
    const result: Transcript = caps.openai ? { words: await viaOpenAI(audio), engine: "openai-whisper" } : { words: await viaLocal(audio), engine: `faster-whisper-${WHISPER_MODEL}` };
    writeJson(cacheFile, result);
    return result;
  } finally {
    fs.rmSync(audio, { force: true });
  }
};

export const toSrt = (words: WordTiming[], perLine = 7) => {
  const ts = (s: number) => {
    const ms = Math.round(s * 1000);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
  };
  const lines: string[] = [];
  for (let i = 0, n = 1; i < words.length; i += perLine, n++) {
    const chunk = words.slice(i, i + perLine);
    lines.push(String(n), `${ts(chunk[0].start)} --> ${ts(chunk[chunk.length - 1].end)}`, chunk.map((w) => w.text).join(" "), "");
  }
  return lines.join("\n");
};
