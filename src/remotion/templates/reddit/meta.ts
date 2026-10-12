import { chunkText, getSpeech, offsetWords } from "../../lib/speech";
import type { AudioClip, BaseTimeline, SpeechMap, SpeechRequest, WordTiming } from "../../lib/types";
import { sfx } from "../../lib/assets";
import { type CommonInput, type TemplateMeta, DEFAULT_VOICE, defaultBackground, defaultCaptions, defaultMusic, finish } from "../common";

export interface RedditInput extends CommonInput {
  subreddit: string;
  username: string;
  avatar: string | null;
  title: string;
  body: string;
  upvotes: string;
  comments: string;
  timeAgo: string;
  cardTheme: "light" | "dark";
  verified: boolean;
  awards: boolean;
  voice: string;
  speed: number;
  readTitle: boolean;
}

export interface RedditTimeline extends BaseTimeline {
  card: { in: number; out: number; words: WordTiming[] };
}

const requests = (input: RedditInput): SpeechRequest[] => {
  const out: SpeechRequest[] = [];
  if (input.readTitle && input.title.trim()) out.push({ id: "title", text: input.title.trim(), voice: input.voice, speed: input.speed });
  chunkText(input.body).forEach((text, i) => out.push({ id: `body-${i}`, text, voice: input.voice, speed: input.speed }));
  return out;
};

const timeline = (input: RedditInput, speech?: SpeechMap): RedditTimeline => {
  const reqs = requests(input);
  const audio: AudioClip[] = [{ src: sfx("pop"), at: 0.05, volume: 0.55 }];
  let t = 0.35;
  let cardWords: WordTiming[] = [];
  const titleReq = reqs.find((r) => r.id === "title");
  if (titleReq) {
    const s = getSpeech(speech, titleReq);
    if (s.src) audio.push({ src: s.src, at: t, duration: s.duration + 0.1 });
    cardWords = offsetWords(s.words, t);
    t += s.duration;
  } else {
    t += 2.2;
  }
  const cardOut = t + 0.3;
  audio.push({ src: sfx("whoosh"), at: cardOut - 0.15, volume: 0.35 });
  t = cardOut + 0.2;
  const captions: WordTiming[] = [];
  for (const req of reqs.filter((r) => r.id.startsWith("body-"))) {
    const s = getSpeech(speech, req);
    if (s.src) audio.push({ src: s.src, at: t, duration: s.duration + 0.1 });
    captions.push(...offsetWords(s.words, t));
    t += s.duration + 0.1;
  }
  return finish({ duration: t + 0.6, audio, captions, card: { in: 0, out: cardOut, words: cardWords } });
};

const DEMO_BODY = `So my sister and I have always been close. Last year I started a wedding fund and saved every dollar for three years.

Two weeks ago she called me crying. She spent her entire savings on a trip to Bali and now she can't afford her own wedding.

She asked me to give her my wedding fund. When I said no, my mom called me selfish and said family comes first.

I told them I worked double shifts for that money. Now nobody in my family is talking to me. So, am I the jerk here?`;

export const redditMeta: TemplateMeta<RedditInput, RedditTimeline> = {
  id: "reddit",
  speech: requests,
  timeline,
  defaults: () => ({
    subreddit: "AmItheAsshole",
    username: "throwaway_story",
    avatar: null,
    title: "AITA for refusing to give my sister my wedding fund?",
    body: DEMO_BODY,
    upvotes: "24.8k",
    comments: "3.1k",
    timeAgo: "5h",
    cardTheme: "light",
    verified: true,
    awards: true,
    voice: DEFAULT_VOICE,
    speed: 1.1,
    readTitle: true,
    background: defaultBackground("parkour", 7),
    music: defaultMusic("suspense", 0.12),
    captions: defaultCaptions(),
  }),
  demo: () => ({ ...redditMeta.defaults() }),
};
