import { getSpeech } from "../../lib/speech";
import type { AudioClip, BaseTimeline, SpeechMap, SpeechRequest } from "../../lib/types";
import { sfx } from "../../lib/assets";
import { type CommonInput, type TemplateMeta, DEFAULT_VOICE, defaultBackground, defaultCaptions, defaultMusic, finish } from "../common";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  emoji: string;
}

export interface QuizInput extends CommonInput {
  title: string;
  questions: QuizQuestion[];
  voice: string;
  speed: number;
  countdown: number;
  readOptions: boolean;
  speakAnswer: boolean;
  accent: string;
}

export interface QuizTimeline extends BaseTimeline {
  rounds: { id: string; in: number; optionsAt: number; countdownAt: number; revealAt: number; out: number }[];
}

const LETTERS = ["A", "B", "C", "D"];

const requests = (input: QuizInput): SpeechRequest[] =>
  input.questions.flatMap((q) => {
    const opts = input.readOptions ? " " + q.options.map((o, i) => `${LETTERS[i]}, ${o}.`).join(" ") : "";
    const out: SpeechRequest[] = [{ id: `q-${q.id}`, text: `${q.question}${opts}`, voice: input.voice, speed: input.speed }];
    if (input.speakAnswer && q.options[q.answer]) out.push({ id: `a-${q.id}`, text: `The answer is ${q.options[q.answer]}!`, voice: input.voice, speed: input.speed });
    return out;
  });

const timeline = (input: QuizInput, speech?: SpeechMap): QuizTimeline => {
  const reqs = new Map(requests(input).map((r) => [r.id, r]));
  const audio: AudioClip[] = [];
  const rounds: QuizTimeline["rounds"] = [];
  let t = 0;
  input.questions.forEach((q, i) => {
    const rin = t;
    audio.push({ src: sfx(i === 0 ? "pop" : "whoosh"), at: rin, volume: 0.4 });
    const s = getSpeech(speech, reqs.get(`q-${q.id}`)!);
    if (s.src) audio.push({ src: s.src, at: rin + 0.4, duration: s.duration + 0.1 });
    const optionsAt = rin + 0.6;
    const countdownAt = Math.max(rin + 0.4 + s.duration + 0.1, optionsAt + 0.6);
    for (let k = 0; k < input.countdown; k++) audio.push({ src: sfx("tick"), at: countdownAt + k, volume: 0.6 });
    const revealAt = countdownAt + input.countdown;
    audio.push({ src: sfx("correct"), at: revealAt, volume: 0.5 });
    let out = revealAt + 1.6;
    const ans = reqs.get(`a-${q.id}`);
    if (ans) {
      const a = getSpeech(speech, ans);
      if (a.src) audio.push({ src: a.src, at: revealAt + 0.35, duration: a.duration + 0.1 });
      out = Math.max(out, revealAt + 0.35 + a.duration + 0.5);
    }
    rounds.push({ id: q.id, in: rin, optionsAt, countdownAt, revealAt, out });
    t = out;
  });
  return finish({ duration: t + 0.2, audio, captions: [], rounds });
};

export const quizMeta: TemplateMeta<QuizInput, QuizTimeline> = {
  id: "quiz",
  speech: requests,
  timeline,
  defaults: () => ({
    title: "Only geniuses get 4/4 🧠",
    questions: [
      { id: "q1", question: "What is the only planet that spins clockwise?", options: ["Mars", "Venus", "Jupiter", "Neptune"], answer: 1, emoji: "🪐" },
      { id: "q2", question: "How many hearts does an octopus have?", options: ["One", "Two", "Three", "Eight"], answer: 2, emoji: "🐙" },
      { id: "q3", question: "Which country has the most time zones?", options: ["Russia", "USA", "China", "France"], answer: 3, emoji: "🌍" },
      { id: "q4", question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Quartz"], answer: 2, emoji: "💎" },
    ],
    voice: DEFAULT_VOICE,
    speed: 1.08,
    countdown: 3,
    readOptions: false,
    speakAnswer: true,
    accent: "#22C55E",
    background: defaultBackground("space", 5),
    music: defaultMusic("upbeat", 0.08),
    captions: defaultCaptions({ enabled: false }),
  }),
  demo: () => quizMeta.defaults(),
};
