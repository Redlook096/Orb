import { getSpeech } from "../../lib/speech";
import type { AudioClip, BaseTimeline, SpeechMap, SpeechRequest } from "../../lib/types";
import { sfx } from "../../lib/assets";
import { type CommonInput, type TemplateMeta, DEFAULT_VOICE, defaultBackground, defaultCaptions, defaultMusic, finish } from "../common";

export interface WyrQuestion {
  id: string;
  a: string;
  b: string;
  aEmoji: string;
  bEmoji: string;
  aImage?: string | null;
  bImage?: string | null;
  /** Share of people who picked A, 0–100. */
  percentA: number;
}

export interface WyrInput extends CommonInput {
  questions: WyrQuestion[];
  voice: string;
  speed: number;
  countdown: number;
  aColor: string;
  bColor: string;
  title: string;
  layout: "colors" | "background";
}

export interface WyrTimeline extends BaseTimeline {
  rounds: { id: string; in: number; countdownAt: number; revealAt: number; out: number }[];
}

const requests = (input: WyrInput): SpeechRequest[] =>
  input.questions.map((q) => ({ id: `wyr-${q.id}`, text: `Would you rather ${q.a.replace(/[.?!]+$/, "")}, or ${q.b.replace(/[.?!]+$/, "")}?`, voice: input.voice, speed: input.speed }));

const timeline = (input: WyrInput, speech?: SpeechMap): WyrTimeline => {
  const reqs = new Map(requests(input).map((r) => [r.id, r]));
  const audio: AudioClip[] = [];
  const rounds: WyrTimeline["rounds"] = [];
  let t = 0;
  input.questions.forEach((q, i) => {
    const rin = t;
    audio.push({ src: sfx(i === 0 ? "pop" : "whoosh"), at: rin, volume: 0.4 });
    const s = getSpeech(speech, reqs.get(`wyr-${q.id}`)!);
    if (s.src) audio.push({ src: s.src, at: rin + 0.35, duration: s.duration + 0.1 });
    const countdownAt = rin + 0.35 + s.duration + 0.15;
    for (let k = 0; k < input.countdown; k++) audio.push({ src: sfx("tick"), at: countdownAt + k, volume: 0.6 });
    const revealAt = countdownAt + input.countdown;
    audio.push({ src: sfx("ding"), at: revealAt, volume: 0.45 });
    const out = revealAt + 2.2;
    rounds.push({ id: q.id, in: rin, countdownAt, revealAt, out });
    t = out;
  });
  return finish({ duration: t + 0.2, audio, captions: [], rounds });
};

export const wyrMeta: TemplateMeta<WyrInput, WyrTimeline> = {
  id: "would-you-rather",
  speech: requests,
  timeline,
  defaults: () => ({
    questions: [
      { id: "w1", a: "Have unlimited money", b: "Have unlimited time", aEmoji: "💰", bEmoji: "⏳", percentA: 63 },
      { id: "w2", a: "Only eat pizza forever", b: "Never eat pizza again", aEmoji: "🍕", bEmoji: "🚫", percentA: 71 },
      { id: "w3", a: "Be able to fly", b: "Be invisible", aEmoji: "🦅", bEmoji: "👻", percentA: 58 },
      { id: "w4", a: "Live without music", b: "Live without your phone", aEmoji: "🎧", bEmoji: "📱", percentA: 34 },
    ],
    voice: DEFAULT_VOICE,
    speed: 1.05,
    countdown: 3,
    aColor: "#E53935",
    bColor: "#1E63E9",
    title: "WOULD YOU RATHER",
    layout: "colors",
    background: defaultBackground("gradient", 1),
    music: defaultMusic("upbeat", 0.09),
    captions: defaultCaptions({ enabled: false }),
  }),
  demo: () => wyrMeta.defaults(),
};
