import { getSpeech } from "../../lib/speech";
import type { AudioClip, BaseTimeline, SpeechMap, SpeechRequest } from "../../lib/types";
import { sfx } from "../../lib/assets";
import {
  type CommonInput,
  type TemplateMeta,
  DEFAULT_FEMALE_VOICE,
  DEFAULT_VOICE,
  defaultBackground,
  defaultCaptions,
  defaultMusic,
  finish,
} from "../common";

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  image?: string | null;
}

export interface FakeTextsInput extends CommonInput {
  app: "imessage" | "whatsapp" | "instagram";
  theme: "light" | "dark";
  contactName: string;
  contactAvatar: string | null;
  messages: ChatMessage[];
  meVoice: string;
  themVoice: string;
  speed: number;
  readMessages: boolean;
  layout: "split" | "full";
  typingIndicator: boolean;
  sounds: boolean;
}

export interface ChatEvent {
  id: string;
  typingAt: number | null;
  at: number;
  end: number;
}

export interface FakeTextsTimeline extends BaseTimeline {
  events: ChatEvent[];
}

const requests = (input: FakeTextsInput): SpeechRequest[] =>
  input.readMessages
    ? input.messages
        .filter((m) => m.text.trim())
        .map((m) => ({ id: `msg-${m.id}`, text: m.text.trim(), voice: m.from === "me" ? input.meVoice : input.themVoice, speed: input.speed }))
    : [];

const timeline = (input: FakeTextsInput, speech?: SpeechMap): FakeTextsTimeline => {
  const reqs = new Map(requests(input).map((r) => [r.id, r]));
  const audio: AudioClip[] = [];
  const events: ChatEvent[] = [];
  let t = 0.7;
  for (const m of input.messages) {
    let typingAt: number | null = null;
    if (m.from === "them" && input.typingIndicator) {
      typingAt = t;
      t += 0.75;
    }
    const at = t;
    if (input.sounds) audio.push({ src: sfx(m.from === "me" ? "send" : "receive"), at, volume: m.from === "me" ? 0.5 : 0.45 });
    const req = reqs.get(`msg-${m.id}`);
    let end: number;
    if (req) {
      const s = getSpeech(speech, req);
      if (s.src) audio.push({ src: s.src, at: at + 0.15, duration: s.duration + 0.1 });
      end = at + 0.15 + s.duration;
    } else {
      end = at + Math.max(0.9, m.text.length * 0.05) + (m.image ? 1.2 : 0);
    }
    events.push({ id: m.id, typingAt, at, end });
    t = end + 0.25;
  }
  return finish({ duration: t + 1.0, audio, captions: [], events });
};

const msg = (from: "me" | "them", text: string, id: string): ChatMessage => ({ id, from, text });

export const fakeTextsMeta: TemplateMeta<FakeTextsInput, FakeTextsTimeline> = {
  id: "fake-texts",
  speech: requests,
  timeline,
  defaults: () => ({
    app: "imessage",
    theme: "dark",
    contactName: "Mom",
    contactAvatar: null,
    messages: [
      msg("them", "Why is there a $400 charge from GameStop on my card??", "m1"),
      msg("me", "Okay so before you get mad", "m2"),
      msg("them", "I'm already mad", "m3"),
      msg("me", "It was an investment", "m4"),
      msg("them", "An investment in WHAT", "m5"),
      msg("me", "My future as a pro gamer 🎮", "m6"),
      msg("them", "Your future is cleaning the garage. Every weekend. Until you're 30.", "m7"),
      msg("me", "That seems like a lot", "m8"),
      msg("them", "Should've thought about that before you bought a gaming chair with MY money", "m9"),
    ],
    meVoice: DEFAULT_VOICE,
    themVoice: DEFAULT_FEMALE_VOICE,
    speed: 1.08,
    readMessages: true,
    layout: "split",
    typingIndicator: true,
    sounds: true,
    background: defaultBackground("runner", 3),
    music: defaultMusic("lofi", 0.1),
    captions: defaultCaptions({ enabled: false }),
  }),
  demo: () => fakeTextsMeta.defaults(),
};
