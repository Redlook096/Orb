import type { WordTiming } from "@/remotion/lib/types";
import { splitWords } from "@/remotion/lib/speech";

/**
 * Maps the words of the script onto timed spans from a provider (ElevenLabs characters or
 * Whisper words). Equal counts map 1:1; otherwise words are spread by character length.
 */
export const alignToSpans = (text: string, spans: { start: number; end: number }[]): WordTiming[] => {
  const words = splitWords(text);
  if (words.length === 0) return [];
  if (spans.length === 0) return [];
  if (spans.length === words.length) return words.map((w, i) => ({ text: w, start: spans[i].start, end: spans[i].end }));
  const weights = words.map((w) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, "").length));
  const total = weights.reduce((a, b) => a + b, 0);
  const n = spans.length;
  let acc = 0;
  return words.map((w, i) => {
    const a = acc / total;
    acc += weights[i];
    const b = acc / total;
    const gi = Math.min(n - 1, Math.floor(a * n));
    const gj = Math.min(n - 1, Math.max(gi, Math.ceil(b * n) - 1));
    return { text: w, start: spans[gi].start, end: spans[gj].end };
  });
};

/** Groups ElevenLabs per-character alignment into word spans. */
export const charsToSpans = (chars: string[], starts: number[], ends: number[]) => {
  const spans: { start: number; end: number }[] = [];
  let cur: { start: number; end: number } | null = null;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (cur) spans.push(cur);
      cur = null;
    } else if (!cur) cur = { start: starts[i], end: ends[i] };
    else cur.end = ends[i];
  });
  if (cur) spans.push(cur);
  return spans;
};
