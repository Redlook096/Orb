import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../../backgrounds";
import { Shell } from "../Shell";
import type { RedditInput, RedditTimeline } from "./meta";
import { CommentIcon, ShareIcon, UpvoteIcon, VerifiedBadge } from "../../components/icons";
import { Avatar } from "../../lib/avatar";
import { FONT_EMOJI } from "../../lib/fonts";

export const RedditCard: React.FC<{ input: RedditInput; width?: number }> = ({ input, width = 940 }) => {
  const dark = input.cardTheme === "dark";
  const fg = dark ? "#D7DADC" : "#1A1A1B";
  const muted = dark ? "#818384" : "#576F76";
  const pill = dark ? "#272729" : "#EAEDEF";
  return (
    <div
      style={{
        width,
        background: dark ? "#1A1A1B" : "#FFFFFF",
        borderRadius: 34,
        padding: "38px 42px 30px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        fontFamily: `Inter, ${FONT_EMOJI}`,
        color: fg,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {input.avatar ? (
          <Avatar src={input.avatar} name={input.subreddit} size={92} />
        ) : (
          <div style={{ width: 92, height: 92, borderRadius: "50%", background: "#FF4500", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, flexShrink: 0 }}>
            r/
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 36, fontWeight: 700 }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>r/{input.subreddit}</span>
            {input.verified ? <VerifiedBadge size={34} color="#0079D3" /> : null}
            <span style={{ color: muted, fontWeight: 500, fontSize: 30 }}>• {input.timeAgo}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: muted, fontSize: 29, fontWeight: 500 }}>
            <span>u/{input.username}</span>
            {input.awards ? <span style={{ fontSize: 28, letterSpacing: 2 }}>🏆🥇💎🔥</span> : null}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.22, margin: "28px 0 30px", letterSpacing: -0.4 }}>{input.title}</div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 30, fontWeight: 700, color: fg }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, background: pill, borderRadius: 999, padding: "12px 24px" }}>
          <UpvoteIcon size={34} color="#FF4500" />
          {input.upvotes}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, background: pill, borderRadius: 999, padding: "12px 24px" }}>
          <CommentIcon size={32} color={fg} />
          {input.comments}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, background: pill, borderRadius: 999, padding: "12px 24px" }}>
          <ShareIcon size={32} color={fg} />
          Share
        </span>
      </div>
    </div>
  );
};

export const RedditVideo: React.FC<{ input: RedditInput; timeline: RedditTimeline }> = ({ input, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enter = spring({ frame, fps, config: { damping: 13, stiffness: 160, mass: 0.7 } });
  const outF = Math.round(timeline.card.out * fps);
  const exit = spring({ frame: frame - outF, fps, config: { damping: 16, stiffness: 200 } });
  const showCard = t < timeline.card.out + 0.6;
  const scale = interpolate(enter, [0, 1], [0.55, 1]) * interpolate(exit, [0, 1], [1, 0.82]);
  const opacity = interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }) * interpolate(exit, [0, 0.7], [1, 0], { extrapolateRight: "clamp" });
  const lift = interpolate(exit, [0, 1], [0, -90]);
  return (
    <Shell input={input} timeline={timeline}>
      <Background spec={input.background} />
      {showCard ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `translateY(${lift}px) scale(${scale})`, opacity }}>
            <RedditCard input={input} />
          </div>
        </AbsoluteFill>
      ) : null}
    </Shell>
  );
};
