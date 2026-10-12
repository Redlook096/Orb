import fs from "node:fs";
import path from "node:path";
import { DIRS, KOKORO_MODEL, KOKORO_VOICES, PYTHON } from "../config";
import { fileUrl, readJson, sha1, writeJson } from "../storage";
import { probe, run, toWav } from "../media";
import { alignToSpans, charsToSpans } from "../align";
import { distributeWords } from "@/remotion/lib/speech";
import type { SpeechMap, SpeechRequest, SpeechResult, WordTiming } from "@/remotion/lib/types";
import { resolveVoice, type Voice } from "./voices";

const CACHE_VERSION = "v3";

interface Cached {
  duration: number;
  words: WordTiming[];
  file: string;
}

interface Item {
  req: SpeechRequest;
  voice: Voice;
  key: string;
  base: string;
}

const cacheBase = (voice: Voice, req: SpeechRequest) => {
  const key = sha1([CACHE_VERSION, voice.id, req.speed.toFixed(2), req.text].join("|"));
  return { key, base: path.join(DIRS.tts, key) };
};

const loadCached = (base: string): Cached | null => {
  const meta = readJson<Cached>(`${base}.json`);
  if (meta && fs.existsSync(path.join(DIRS.tts, meta.file))) return meta;
  return null;
};

const saveCached = (base: string, data: Cached) => writeJson(`${base}.json`, data);

// ---------- Kokoro (local neural TTS with phoneme-accurate word timings) ----------
const kokoroBatch = async (items: Item[], onProgress?: (done: number) => void) => {
  if (items.length === 0) return;
  const payload = {
    model: KOKORO_MODEL,
    voices: KOKORO_VOICES,
    items: items.map((it) => ({
      text: it.req.text,
      voice: it.voice.key,
      speed: it.req.speed,
      lang: it.voice.key.startsWith("b") ? "en-gb" : "en-us",
      out: `${it.base}.wav`,
    })),
  };
  const script = path.join(process.cwd(), "scripts", "kokoro_tts.py");
  const { stdout } = await run(PYTHON, [script], {
    input: JSON.stringify(payload),
    timeoutMs: 20 * 60_000,
    onStderr: (s) => {
      for (const line of s.split("\n")) {
        try {
          const j = JSON.parse(line) as { progress?: number };
          if (typeof j.progress === "number") onProgress?.(j.progress);
        } catch {
          /* engine log line */
        }
      }
    },
  });
  const results = JSON.parse(stdout) as { out: string; duration: number; words: WordTiming[] }[];
  results.forEach((r, i) => saveCached(items[i].base, { duration: r.duration, words: r.words, file: path.basename(r.out) }));
};

// ---------- eSpeak NG (always-available fallback) ----------
const espeakOne = async (it: Item) => {
  const out = `${it.base}.wav`;
  const wpm = Math.round(170 * it.req.speed);
  await run("espeak-ng", ["-v", it.voice.key, "-s", String(wpm), "-g", "4", "-w", out, it.req.text], { timeoutMs: 120_000 });
  const p = await probe(out);
  saveCached(it.base, { duration: p.duration, words: distributeWords(it.req.text, p.duration, 0.05, 0.12), file: path.basename(out) });
};

// ---------- OpenAI (cloud TTS; Whisper recovers word timings) ----------
const openaiWords = async (file: string, text: string, duration: number): Promise<WordTiming[]> => {
  try {
    const form = new FormData();
    form.append("file", new Blob([fs.readFileSync(file)], { type: "audio/wav" }), "speech.wav");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    const j = (await res.json()) as { words?: { start: number; end: number }[] };
    const words = alignToSpans(text, j.words ?? []);
    if (words.length) return words;
  } catch {
    /* fall back to estimated timings */
  }
  return distributeWords(text, duration);
};

const openaiOne = async (it: Item) => {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1-hd", voice: it.voice.key, input: it.req.text, speed: it.req.speed, response_format: "wav" }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const out = `${it.base}.wav`;
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  const p = await probe(out);
  saveCached(it.base, { duration: p.duration, words: await openaiWords(out, it.req.text, p.duration), file: path.basename(out) });
};

// ---------- ElevenLabs (cloud TTS with character timestamps) ----------
const elevenOne = async (it: Item) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(it.voice.key)}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "", "Content-Type": "application/json" },
    body: JSON.stringify({
      text: it.req.text,
      model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, speed: Math.min(1.2, Math.max(0.7, it.req.speed)) },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as {
    audio_base64: string;
    alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
  };
  const mp3 = `${it.base}.mp3`;
  fs.writeFileSync(mp3, Buffer.from(j.audio_base64, "base64"));
  const out = `${it.base}.wav`;
  await toWav(mp3, out);
  fs.rmSync(mp3, { force: true });
  const p = await probe(out);
  const spans = j.alignment ? charsToSpans(j.alignment.characters, j.alignment.character_start_times_seconds, j.alignment.character_end_times_seconds) : [];
  const words = spans.length ? alignToSpans(it.req.text, spans) : distributeWords(it.req.text, p.duration);
  saveCached(it.base, { duration: p.duration, words, file: path.basename(out) });
};

const pool = async <T>(items: T[], n: number, fn: (x: T) => Promise<void>) => {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
};

export interface SynthesisReport {
  speech: SpeechMap;
  warnings: string[];
}

/** Synthesizes every request (reusing cached clips) and returns timed speech keyed by request id. */
export const synthesize = async (reqs: SpeechRequest[], onProgress?: (fraction: number) => void): Promise<SynthesisReport> => {
  const warnings = new Set<string>();
  const items: Item[] = [];
  for (const req of reqs) {
    if (!req.text.trim()) continue;
    const { voice, substituted } = await resolveVoice(req.voice);
    if (substituted) warnings.add(`Voice "${req.voice}" is not available here; used ${voice.provider} "${voice.name}" instead.`);
    items.push({ req, voice, ...cacheBase(voice, req) });
  }
  const todo = items.filter((it) => !loadCached(it.base));
  let done = items.length - todo.length;
  const tick = () => onProgress?.(items.length ? done / items.length : 1);
  tick();
  const byProvider = (p: Voice["provider"]) => todo.filter((it) => it.voice.provider === p);
  const kokoroItems = byProvider("kokoro");
  const before = done;
  await kokoroBatch(kokoroItems, (n) => {
    done = before + n;
    tick();
  });
  done = before + kokoroItems.length;
  await pool(byProvider("espeak"), 4, async (it) => {
    await espeakOne(it);
    done++;
    tick();
  });
  await pool(byProvider("openai"), 3, async (it) => {
    await openaiOne(it);
    done++;
    tick();
  });
  await pool(byProvider("elevenlabs"), 2, async (it) => {
    await elevenOne(it);
    done++;
    tick();
  });
  const speech: SpeechMap = {};
  for (const it of items) {
    const c = loadCached(it.base);
    if (!c) throw new Error(`Speech for "${it.req.text.slice(0, 40)}…" was not generated.`);
    const result: SpeechResult = { id: it.req.id, src: fileUrl(path.join(DIRS.tts, c.file)), duration: c.duration, words: c.words };
    speech[it.req.id] = result;
  }
  return { speech, warnings: [...warnings] };
};
