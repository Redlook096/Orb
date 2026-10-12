import { getSpeech, offsetWords } from "../../lib/speech";
import type { AudioClip, BaseTimeline, SpeechMap, SpeechRequest, WordTiming } from "../../lib/types";
import { sfx } from "../../lib/assets";
import { type CommonInput, type TemplateMeta, DEFAULT_VOICE, defaultBackground, defaultCaptions, defaultMusic, finish } from "../common";

export interface Tweet {
  id: string;
  text: string;
  image?: string | null;
  replies: string;
  retweets: string;
  likes: string;
  views: string;
}

export interface TwitterInput extends CommonInput {
  name: string;
  handle: string;
  avatar: string | null;
  verified: boolean;
  theme: "light" | "dim" | "dark";
  tweets: Tweet[];
  voice: string;
  speed: number;
  date: string;
}

export interface TwitterTimeline extends BaseTimeline {
  cards: { id: string; in: number; out: number; words: WordTiming[] }[];
}

const requests = (input: TwitterInput): SpeechRequest[] =>
  input.tweets.filter((t) => t.text.trim()).map((t) => ({ id: `tweet-${t.id}`, text: t.text.trim(), voice: input.voice, speed: input.speed }));

const timeline = (input: TwitterInput, speech?: SpeechMap): TwitterTimeline => {
  const reqs = new Map(requests(input).map((r) => [r.id, r]));
  const audio: AudioClip[] = [];
  const cards: TwitterTimeline["cards"] = [];
  let t = 0;
  input.tweets.forEach((tw, i) => {
    const cin = t;
    audio.push({ src: sfx(i === 0 ? "pop" : "swoosh"), at: cin, volume: 0.4 });
    const req = reqs.get(`tweet-${tw.id}`);
    let words: WordTiming[] = [];
    let end = cin + 2;
    if (req) {
      const s = getSpeech(speech, req);
      const at = cin + 0.4;
      if (s.src) audio.push({ src: s.src, at, duration: s.duration + 0.1 });
      words = offsetWords(s.words, at);
      end = at + s.duration;
    }
    const out = end + 0.45;
    cards.push({ id: tw.id, in: cin, out, words });
    t = out;
  });
  return finish({ duration: t + 0.3, audio, captions: [], cards });
};

export const twitterMeta: TemplateMeta<TwitterInput, TwitterTimeline> = {
  id: "twitter",
  speech: requests,
  timeline,
  defaults: () => ({
    name: "Startup Stories",
    handle: "startupstories",
    avatar: null,
    verified: true,
    theme: "dark",
    tweets: [
      { id: "t1", text: "I quit my $180k job at Google to sell hot sauce. Everyone said I was crazy. Here's what happened in 12 months 🧵", replies: "1.2K", retweets: "4.8K", likes: "38K", views: "2.4M" },
      { id: "t2", text: "Month 1: Made 400 bottles in my kitchen. Sold 31. My wife started giving them to neighbors so they'd stop piling up.", replies: "212", retweets: "890", likes: "12K", views: "1.1M" },
      { id: "t3", text: "Month 7: A food truck in Austin put us on their menu. A TikTok of their customer crying from the heat got 9 million views.", replies: "340", retweets: "1.9K", likes: "21K", views: "1.6M" },
      { id: "t4", text: "Month 12: $1.4M in revenue. 3 employees. Still can't eat my own sauce without crying. Follow for part 2.", replies: "980", retweets: "5.2K", likes: "61K", views: "3.9M" },
    ],
    voice: DEFAULT_VOICE,
    speed: 1.08,
    date: "9:41 AM · Oct 12, 2026",
    background: defaultBackground("neon", 2),
    music: defaultMusic("upbeat", 0.1),
    captions: defaultCaptions({ enabled: false }),
  }),
  demo: () => twitterMeta.defaults(),
};
