import type { SpeechMap, SpeechRequest, SpeechResult, WordTiming } from "./types";

/** Splits text into display words while keeping punctuation attached. */
export const splitWords = (text: string): string[] =>
  text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 0);

const syllables = (word: string): number => {
  const w = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!w) return 0.5;
  if (/^\d+$/.test(w)) return w.length * 1.6;
  const groups = w.replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
};

const pauseAfter = (word: string): number => {
  if (/[.!?]["')\]]*$/.test(word)) return 0.32;
  if (/[,;:]["')\]]*$/.test(word)) return 0.16;
  if (/[—–-]$/.test(word)) return 0.12;
  return 0;
};

/**
 * Distributes words across a span of speech. Used both to estimate speech for
 * live previews and to place words when a voice provider returns no timings.
 */
export const distributeWords = (
  text: string,
  duration: number,
  leadIn = 0.05,
  tail = 0.1,
): WordTiming[] => {
  const words = splitWords(text);
  if (words.length === 0) return [];
  const weights = words.map((w) => syllables(w) * 0.21 + 0.05);
  const pauses = words.map(pauseAfter);
  const total = weights.reduce((a, b) => a + b, 0) + pauses.reduce((a, b) => a + b, 0);
  const span = Math.max(0.1, duration - leadIn - tail);
  const k = span / total;
  let t = leadIn;
  return words.map((text, i) => {
    const start = t;
    const end = t + weights[i] * k;
    t = end + pauses[i] * k;
    return { text, start, end };
  });
};

/** Rough speaking time at a natural narration pace (≈ 2.9 words/second at 1x). */
export const estimateDuration = (text: string, speed = 1): number => {
  const words = splitWords(text);
  const units = words.reduce((acc, w) => acc + syllables(w) * 0.21 + 0.05 + pauseAfter(w), 0);
  return Math.max(0.6, units / Math.max(0.5, speed) + 0.25);
};

export const estimateSpeech = (req: SpeechRequest): SpeechResult => {
  const duration = estimateDuration(req.text, req.speed);
  return { id: req.id, src: null, duration, words: distributeWords(req.text, duration) };
};

export const getSpeech = (map: SpeechMap | undefined, req: SpeechRequest): SpeechResult =>
  map?.[req.id] ?? estimateSpeech(req);

export const offsetWords = (words: WordTiming[], by: number): WordTiming[] =>
  words.map((w) => ({ text: w.text, start: w.start + by, end: w.end + by }));

/** Splits long text into chunks a TTS provider can take in one request. */
export const chunkText = (text: string, maxChars = 600): string[] => {
  const paragraphs = text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const p of paragraphs) {
    const sentences = p.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [p];
    let cur = "";
    for (const s of sentences.map((x) => x.trim()).filter(Boolean)) {
      if (cur && (cur + " " + s).length > maxChars) {
        chunks.push(cur);
        cur = s;
      } else {
        cur = cur ? cur + " " + s : s;
      }
    }
    if (cur) chunks.push(cur);
  }
  return chunks;
};
