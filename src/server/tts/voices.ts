import { capabilities } from "../config";

export type Provider = "kokoro" | "espeak" | "openai" | "elevenlabs";

export interface Voice {
  id: string;
  provider: Provider;
  name: string;
  gender: "male" | "female";
  accent: string;
  style: string;
  available: boolean;
  /** Provider-specific voice name. */
  key: string;
}

const kokoro: [string, string, "male" | "female", string, string][] = [
  ["am_adam", "Adam", "male", "American", "Deep storyteller"],
  ["af_heart", "Heart", "female", "American", "Warm and natural"],
  ["am_michael", "Michael", "male", "American", "Calm narrator"],
  ["af_bella", "Bella", "female", "American", "Bright and energetic"],
  ["am_onyx", "Onyx", "male", "American", "Low and dramatic"],
  ["af_nicole", "Nicole", "female", "American", "Soft, ASMR-like"],
  ["am_fenrir", "Fenrir", "male", "American", "Gritty and intense"],
  ["af_sarah", "Sarah", "female", "American", "Friendly"],
  ["am_puck", "Puck", "male", "American", "Playful"],
  ["af_sky", "Sky", "female", "American", "Youthful"],
  ["am_eric", "Eric", "male", "American", "Confident"],
  ["af_nova", "Nova", "female", "American", "Crisp"],
  ["am_liam", "Liam", "male", "American", "Casual"],
  ["af_jessica", "Jessica", "female", "American", "Conversational"],
  ["am_echo", "Echo", "male", "American", "Clear"],
  ["af_river", "River", "female", "American", "Relaxed"],
  ["bm_george", "George", "male", "British", "Classic narrator"],
  ["bf_emma", "Emma", "female", "British", "Polished"],
  ["bm_lewis", "Lewis", "male", "British", "Measured"],
  ["bf_isabella", "Isabella", "female", "British", "Elegant"],
  ["bm_daniel", "Daniel", "male", "British", "Newsreader"],
  ["bf_lily", "Lily", "female", "British", "Gentle"],
  ["bm_fable", "Fable", "male", "British", "Fairy-tale"],
  ["bf_alice", "Alice", "female", "British", "Bright"],
];

const openai: [string, "male" | "female", string][] = [
  ["onyx", "male", "Deep and authoritative"],
  ["nova", "female", "Bright and friendly"],
  ["alloy", "female", "Neutral and balanced"],
  ["echo", "male", "Warm and clear"],
  ["fable", "male", "Expressive British"],
  ["shimmer", "female", "Soft and gentle"],
  ["ash", "male", "Conversational"],
  ["coral", "female", "Warm"],
  ["sage", "female", "Calm"],
];

const espeak: [string, string, "male" | "female", string][] = [
  ["en-us+m3", "Robo Male", "male", "Classic text-to-speech"],
  ["en-us+f3", "Robo Female", "female", "Classic text-to-speech"],
  ["en-gb+m4", "Robo British", "male", "Classic text-to-speech"],
];

const mbrola: [string, string, "male" | "female"][] = [
  ["mb-us2", "MBROLA Male", "male"],
  ["mb-us1", "MBROLA Female", "female"],
];

let elevenCache: { at: number; voices: Voice[] } | null = null;

const elevenVoices = async (): Promise<Voice[]> => {
  if (!process.env.ELEVENLABS_API_KEY) return [];
  if (elevenCache && Date.now() - elevenCache.at < 10 * 60_000) return elevenCache.voices;
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as { voices: { voice_id: string; name: string; labels?: Record<string, string> }[] };
    const voices = j.voices.map<Voice>((v) => ({
      id: `elevenlabs:${v.voice_id}`,
      provider: "elevenlabs",
      key: v.voice_id,
      name: v.name.split(" - ")[0],
      gender: v.labels?.gender === "female" ? "female" : "male",
      accent: v.labels?.accent ?? "",
      style: v.labels?.description ?? v.labels?.use_case ?? "ElevenLabs voice",
      available: true,
    }));
    elevenCache = { at: Date.now(), voices };
    return voices;
  } catch {
    return [];
  }
};

export const listVoices = async (): Promise<Voice[]> => {
  const caps = capabilities();
  const out: Voice[] = [];
  out.push(...(await elevenVoices()));
  for (const [key, name, gender, accent, style] of kokoro)
    out.push({ id: `kokoro:${key}`, provider: "kokoro", key, name, gender, accent, style, available: caps.kokoro });
  for (const [key, gender, style] of openai)
    out.push({ id: `openai:${key}`, provider: "openai", key, name: key[0].toUpperCase() + key.slice(1), gender, accent: "American", style, available: caps.openai });
  for (const [key, name, gender, style] of espeak)
    out.push({ id: `espeak:${key}`, provider: "espeak", key, name, gender, accent: key.startsWith("en-gb") ? "British" : "American", style, available: caps.espeak });
  if (caps.mbrola)
    for (const [key, name, gender] of mbrola)
      out.push({ id: `espeak:${key}`, provider: "espeak", key, name, gender, accent: "American", style: "Diphone synthesis", available: caps.espeak });
  return out;
};

/**
 * Picks the voice to actually use. A voice whose provider is not configured falls back to an
 * available voice of the same gender, so a project never fails just because a key is missing.
 */
export const resolveVoice = async (id: string): Promise<{ voice: Voice; substituted: boolean }> => {
  const all = await listVoices();
  const wanted = all.find((v) => v.id === id);
  if (wanted?.available) return { voice: wanted, substituted: false };
  const [prov, key] = id.split(":");
  if (prov === "elevenlabs" && key && process.env.ELEVENLABS_API_KEY)
    return { voice: { id, provider: "elevenlabs", key, name: key, gender: "male", accent: "", style: "", available: true }, substituted: false };
  const gender = wanted?.gender ?? (/^(af|bf)_|female|f3|us1/.test(key ?? "") ? "female" : "male");
  const order: Provider[] = ["kokoro", "elevenlabs", "openai", "espeak"];
  for (const p of order) {
    const v = all.find((x) => x.provider === p && x.available && x.gender === gender) ?? all.find((x) => x.provider === p && x.available);
    if (v) return { voice: v, substituted: true };
  }
  throw new Error("No text-to-speech engine is available. Run `npm run setup:voices` or set an API key.");
};
