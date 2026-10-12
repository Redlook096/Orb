import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

export const ROOT = process.cwd();
export const STORAGE = path.resolve(ROOT, process.env.STORAGE_DIR || "storage");
export const DIRS = {
  uploads: path.join(STORAGE, "uploads"),
  tts: path.join(STORAGE, "tts"),
  renders: path.join(STORAGE, "renders"),
  jobs: path.join(STORAGE, "jobs"),
  tmp: path.join(STORAGE, "tmp"),
};
for (const d of Object.values(DIRS)) fs.mkdirSync(d, { recursive: true });

export const KOKORO_MODEL = path.resolve(ROOT, process.env.KOKORO_MODEL || "models/kokoro-v1.0.onnx");
export const KOKORO_VOICES = path.resolve(ROOT, process.env.KOKORO_VOICES || "models/voices-v1.0.bin");
export const PYTHON = process.env.PYTHON_BIN || "python3";
export const WHISPER_MODEL = process.env.WHISPER_MODEL || "base";
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/** Where the renderer's headless browser can reach this server to load uploaded media and voice clips. */
export const internalBaseUrl = () => process.env.ORB_INTERNAL_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;

const which = (bin: string): boolean => {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [bin], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const pythonHas = (mod: string): boolean => {
  try {
    execFileSync(PYTHON, ["-c", `import ${mod}`], { stdio: "ignore", timeout: 20000 });
    return true;
  } catch {
    return false;
  }
};

export interface Capabilities {
  ffmpeg: boolean;
  kokoro: boolean;
  espeak: boolean;
  mbrola: boolean;
  openai: boolean;
  elevenlabs: boolean;
  anthropic: boolean;
  localWhisper: boolean;
  ytdlp: boolean;
}

let caps: Capabilities | null = null;
let capsAt = 0;

/** Detects which engines and providers are usable; cached for a minute. */
export const capabilities = (): Capabilities => {
  if (caps && Date.now() - capsAt < 60_000) return caps;
  caps = {
    ffmpeg: which("ffmpeg") && which("ffprobe"),
    kokoro: fs.existsSync(KOKORO_MODEL) && fs.existsSync(KOKORO_VOICES) && pythonHas("kokoro_onnx"),
    espeak: which("espeak-ng"),
    mbrola: fs.existsSync("/usr/share/mbrola/us1") || fs.existsSync("/usr/share/mbrola/us1/us1"),
    openai: Boolean(process.env.OPENAI_API_KEY),
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    localWhisper: pythonHas("faster_whisper"),
    ytdlp: which("yt-dlp"),
  };
  capsAt = Date.now();
  return caps;
};
