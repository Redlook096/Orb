import { TEMPLATE_META } from "@/remotion/registry";
import type { BaseTimeline, TemplateId, WordTiming } from "@/remotion/lib/types";
import { synthesize } from "./tts";
import { transcribe } from "./transcribe";
import path from "node:path";
import fs from "node:fs";
import { urlToPath } from "./storage";
import { ROOT } from "./config";

/** Library files live under /api/files; bundled samples are served from public/. */
const mediaPath = (url: string): string | null => {
  const m = url.match(/^\/demo\/([\w.-]+)$/);
  if (m) {
    const p = path.join(ROOT, "public", "demo", m[1]);
    return fs.existsSync(p) ? p : null;
  }
  return urlToPath(url);
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Fills fields missing from a (possibly older) saved project with the template's defaults. */
export const withDefaults = (template: TemplateId, input: unknown): Record<string, unknown> => {
  const defaults = TEMPLATE_META[template].defaults() as Record<string, unknown>;
  const merge = (base: Record<string, unknown>, over: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(over)) {
      if (v === undefined) continue;
      out[k] = isObject(v) && isObject(base[k]) ? merge(base[k] as Record<string, unknown>, v) : v;
    }
    return out;
  };
  return isObject(input) ? merge(defaults, input) : defaults;
};

export const validateInput = (template: TemplateId, input: Record<string, unknown>) => {
  const problems: string[] = [];
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  switch (template) {
    case "reddit":
      if (!text(input.title) && !text(input.body)) problems.push("Add a title or a story.");
      break;
    case "fake-texts":
    case "chatgpt":
      if (!Array.isArray(input.messages) || input.messages.length === 0) problems.push("Add at least one message.");
      break;
    case "twitter":
      if (!Array.isArray(input.tweets) || input.tweets.length === 0) problems.push("Add at least one tweet.");
      break;
    case "would-you-rather":
    case "quiz":
      if (!Array.isArray(input.questions) || input.questions.length === 0) problems.push("Add at least one question.");
      break;
    case "split-screen":
    case "blur":
    case "captions":
      if (!isObject(input.clip)) problems.push("Upload or choose a video clip first.");
      break;
  }
  if (problems.length) throw new Error(problems.join(" "));
};

export interface Prepared {
  input: Record<string, unknown>;
  timeline: BaseTimeline;
  warnings: string[];
}

/**
 * Turns an editor project into everything a render needs: synthesized narration with word
 * timings, a transcript for clip captions, and the final timeline.
 */
export const prepare = async (
  template: TemplateId,
  rawInput: unknown,
  onProgress?: (stage: string, fraction: number) => void,
): Promise<Prepared> => {
  const meta = TEMPLATE_META[template];
  if (!meta) throw new Error(`Unknown template "${template}".`);
  const input = withDefaults(template, rawInput);
  validateInput(template, input);
  const warnings: string[] = [];

  const reqs = meta.speech(input);
  onProgress?.("Generating voiceover", 0);
  const { speech, warnings: ttsWarnings } = await synthesize(reqs, (f) => onProgress?.("Generating voiceover", f));
  warnings.push(...ttsWarnings);

  const clip = input.clip as { src?: string } | null | undefined;
  const captions = input.captions as { enabled?: boolean } | undefined;
  if ("transcript" in input && clip?.src && captions?.enabled && !(Array.isArray(input.transcript) && input.transcript.length)) {
    onProgress?.("Transcribing clip", 0);
    const file = mediaPath(clip.src);
    if (!file) throw new Error("The selected clip is no longer in the library.");
    const t = await transcribe(file);
    input.transcript = t.words as WordTiming[];
    if (t.words.length === 0) warnings.push("No speech was detected in the clip, so there are no captions.");
    onProgress?.("Transcribing clip", 1);
  }

  const timeline = meta.timeline(input, speech) as BaseTimeline;
  return { input, timeline, warnings };
};
