import { getSpeech, offsetWords } from "../../lib/speech";
import type { AudioClip, BaseTimeline, SpeechMap, SpeechRequest, WordTiming } from "../../lib/types";
import { sfx } from "../../lib/assets";
import { type CommonInput, type TemplateMeta, DEFAULT_FEMALE_VOICE, DEFAULT_VOICE, defaultBackground, defaultCaptions, defaultMusic, finish } from "../common";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface ChatGPTInput extends CommonInput {
  messages: AiMessage[];
  userVoice: string;
  assistantVoice: string;
  speed: number;
  theme: "dark" | "light";
  layout: "split" | "full";
  modelLabel: string;
  readUser: boolean;
}

export interface AiEvent {
  id: string;
  role: "user" | "assistant";
  /** User messages: when typing into the composer begins. Assistant: when the thinking dot appears. */
  start: number;
  at: number;
  end: number;
  words: WordTiming[];
}

export interface ChatGPTTimeline extends BaseTimeline {
  events: AiEvent[];
}

const requests = (input: ChatGPTInput): SpeechRequest[] =>
  input.messages
    .filter((m) => m.text.trim() && (m.role === "assistant" || input.readUser))
    .map((m) => ({ id: `ai-${m.id}`, text: m.text.trim(), voice: m.role === "user" ? input.userVoice : input.assistantVoice, speed: input.speed }));

const timeline = (input: ChatGPTInput, speech?: SpeechMap): ChatGPTTimeline => {
  const reqs = new Map(requests(input).map((r) => [r.id, r]));
  const audio: AudioClip[] = [];
  const events: AiEvent[] = [];
  let t = 0.5;
  for (const m of input.messages) {
    const req = reqs.get(`ai-${m.id}`);
    const s = req ? getSpeech(speech, req) : null;
    if (m.role === "user") {
      const typing = Math.min(1.8, Math.max(0.6, m.text.length * 0.028));
      for (let k = 0; k < typing; k += 0.65) audio.push({ src: sfx("typing"), at: t + k, volume: 0.35, duration: Math.min(0.65, typing - k) });
      const at = t + typing + 0.15;
      audio.push({ src: sfx("swoosh"), at, volume: 0.35 });
      let end = at + 0.6;
      let words: WordTiming[] = [];
      if (s) {
        if (s.src) audio.push({ src: s.src, at: at + 0.15, duration: s.duration + 0.1 });
        words = offsetWords(s.words, at + 0.15);
        end = at + 0.15 + s.duration;
      }
      events.push({ id: m.id, role: "user", start: t, at, end, words });
      t = end + 0.25;
    } else {
      const at = t + 0.8;
      let end = at + Math.max(1.5, m.text.split(/\s+/).length * 0.12);
      let words: WordTiming[] = [];
      if (s) {
        if (s.src) audio.push({ src: s.src, at, duration: s.duration + 0.1 });
        words = offsetWords(s.words, at);
        end = at + s.duration;
      }
      events.push({ id: m.id, role: "assistant", start: t, at, end, words });
      t = end + 0.4;
    }
  }
  return finish({ duration: t + 0.8, audio, captions: [], events });
};

export const chatgptMeta: TemplateMeta<ChatGPTInput, ChatGPTTimeline> = {
  id: "chatgpt",
  speech: requests,
  timeline,
  defaults: () => ({
    messages: [
      { id: "a1", role: "user", text: "Be honest. Is it weird that I still sleep with my childhood teddy bear? I'm 27." },
      { id: "a2", role: "assistant", text: "Not weird at all. Around 40% of adults still sleep with a stuffed animal. It's comforting, and comfort helps you sleep. Keep the bear." },
      { id: "a3", role: "user", text: "My girlfriend says I have to choose. Her or the bear." },
      { id: "a4", role: "assistant", text: "That's a big decision. Before you answer, how long have you had the bear, and how long have you had the girlfriend?" },
    ],
    userVoice: DEFAULT_VOICE,
    assistantVoice: DEFAULT_FEMALE_VOICE,
    speed: 1.08,
    theme: "dark",
    layout: "split",
    modelLabel: "ChatGPT",
    readUser: true,
    background: defaultBackground("rings", 4),
    music: defaultMusic("ambient", 0.1),
    captions: defaultCaptions({ enabled: false }),
  }),
  demo: () => chatgptMeta.defaults(),
};
