import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../../backgrounds";
import { Shell } from "../Shell";
import type { Tweet, TwitterInput, TwitterTimeline } from "./meta";
import { BookmarkIcon, HeartIcon, ReplyIcon, RetweetIcon, ShareIcon, VerifiedBadge, ViewsIcon } from "../../components/icons";
import { Avatar } from "../../lib/avatar";
import { FONT_EMOJI } from "../../lib/fonts";
import type { WordTiming } from "../../lib/types";

const THEMES = {
  light: { bg: "#FFFFFF", fg: "#0F1419", muted: "#536471", line: "#EFF3F4" },
  dim: { bg: "#15202B", fg: "#F7F9F9", muted: "#8B98A5", line: "#38444D" },
  dark: { bg: "#000000", fg: "#E7E9EA", muted: "#71767B", line: "#2F3336" },
};

/** Tweet text where unspoken words are faded and the current word lights up. */
const SpokenText: React.FC<{ text: string; words: WordTiming[]; t: number; fg: string }> = ({ text, words, t, fg }) => {
  if (words.length === 0) return <>{text}</>;
  const tokens = text.split(/(\s+)/);
  let wi = 0;
  return (
    <>
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok) || tok === "") return <React.Fragment key={i}>{tok}</React.Fragment>;
        const w = words[wi];
        const next = words[wi + 1];
        wi++;
        const spoken = !w || t >= w.start - 0.03;
        const active = w && t >= w.start - 0.03 && t < Math.min(next ? next.start - 0.03 : Infinity, w.end + 0.25);
        return (
          <span key={i} style={{ opacity: spoken ? 1 : 0.32, color: active ? "#1D9BF0" : fg }}>
            {tok}
          </span>
        );
      })}
    </>
  );
};

export const TweetCard: React.FC<{ input: TwitterInput; tweet: Tweet; words: WordTiming[]; t: number; index: number; total: number }> = ({ input, tweet, words, t, index, total }) => {
  const th = THEMES[input.theme];
  return (
    <div style={{ width: 960, background: th.bg, color: th.fg, borderRadius: 40, padding: "44px 48px 30px", boxShadow: "0 30px 90px rgba(0,0,0,0.5)", fontFamily: `Inter, ${FONT_EMOJI}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Avatar src={input.avatar} name={input.name} size={104} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 40, fontWeight: 800 }}>
            {input.name}
            {input.verified ? <VerifiedBadge size={40} /> : null}
          </div>
          <div style={{ fontSize: 34, color: th.muted }}>@{input.handle}</div>
        </div>
        {total > 1 ? <div style={{ fontSize: 30, fontWeight: 700, color: th.muted }}>{index + 1}/{total}</div> : null}
      </div>
      <div style={{ fontSize: 50, lineHeight: 1.32, margin: "32px 0 26px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        <SpokenText text={tweet.text} words={words} t={t} fg={th.fg} />
      </div>
      {tweet.image ? <Img src={tweet.image} style={{ width: "100%", maxHeight: 560, objectFit: "cover", borderRadius: 28, border: `1px solid ${th.line}`, marginBottom: 24 }} /> : null}
      <div style={{ fontSize: 31, color: th.muted, paddingBottom: 24, borderBottom: `1px solid ${th.line}` }}>
        {input.date} · <b style={{ color: th.fg }}>{tweet.views}</b> Views
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 26, color: th.muted, fontSize: 31 }}>
        {[
          [ReplyIcon, tweet.replies],
          [RetweetIcon, tweet.retweets],
          [HeartIcon, tweet.likes],
          [ViewsIcon, tweet.views],
        ].map(([Icon, n], k) => {
          const I = Icon as React.FC<{ size: number; color: string }>;
          return (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <I size={38} color={th.muted} />
              {n as string}
            </span>
          );
        })}
        <span style={{ display: "flex", gap: 22 }}>
          <BookmarkIcon size={38} color={th.muted} />
          <ShareIcon size={38} color={th.muted} />
        </span>
      </div>
    </div>
  );
};

export const TwitterVideo: React.FC<{ input: TwitterInput; timeline: TwitterTimeline }> = ({ input, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <Shell input={input} timeline={timeline}>
      <Background spec={input.background} dim={0.15} />
      {timeline.cards.map((card, i) => {
        if (t < card.in - 0.01 || t > card.out + 0.5) return null;
        const tweet = input.tweets.find((x) => x.id === card.id);
        if (!tweet) return null;
        const enter = spring({ frame: frame - Math.round(card.in * fps), fps, config: { damping: 15, stiffness: 170, mass: 0.7 } });
        const exit = spring({ frame: frame - Math.round(card.out * fps), fps, config: { damping: 18, stiffness: 200 } });
        const x = interpolate(enter, [0, 1], [i === 0 ? 0 : 1100, 0]) + interpolate(exit, [0, 1], [0, -1150]);
        const scale = i === 0 ? interpolate(enter, [0, 1], [0.6, 1]) : 1;
        const opacity = i === 0 ? interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }) : 1;
        return (
          <AbsoluteFill key={card.id} style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: `translateX(${x}px) scale(${scale})`, opacity }}>
              <TweetCard input={input} tweet={tweet} words={card.words} t={t} index={i} total={input.tweets.length} />
            </div>
          </AbsoluteFill>
        );
      })}
    </Shell>
  );
};
