import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../../backgrounds";
import { Shell } from "../Shell";
import type { WyrInput, WyrQuestion, WyrTimeline } from "./meta";
import { FONT_EMOJI } from "../../lib/fonts";
import { outlineShadow } from "../../lib/captions";

const Half: React.FC<{
  color: string;
  text: string;
  emoji: string;
  image?: string | null;
  top: boolean;
  enter: number;
  reveal: number;
  percent: number;
  winner: boolean;
  layout: WyrInput["layout"];
}> = ({ color, text, emoji, image, top, enter, reveal, percent, winner, layout }) => {
  const shown = Math.round(percent * Math.min(1, reveal * 1.15));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: top ? 0 : "50%",
        height: "50%",
        background: layout === "colors" ? color : `${color}CC`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        padding: top ? "150px 70px 120px" : "120px 70px 150px",
        overflow: "hidden",
        filter: reveal > 0 && !winner ? `brightness(${interpolate(reveal, [0, 1], [1, 0.62])})` : undefined,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${top ? 180 : 0}deg, rgba(0,0,0,0.0), rgba(0,0,0,0.18))` }} />
      <div style={{ transform: `scale(${interpolate(enter, [0, 1], [0.3, 1])})`, fontSize: 190, lineHeight: 1, fontFamily: FONT_EMOJI, filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.35))", position: "relative" }}>
        {image ? <Img src={image} style={{ width: 340, height: 340, objectFit: "cover", borderRadius: 40 }} /> : emoji}
      </div>
      <div
        style={{
          position: "relative",
          color: "#fff",
          fontFamily: `Montserrat, ${FONT_EMOJI}`,
          fontWeight: 900,
          fontSize: text.length > 34 ? 60 : 72,
          lineHeight: 1.12,
          textAlign: "center",
          textShadow: [...outlineShadow(6, "rgba(0,0,0,0.85)"), "0 8px 18px rgba(0,0,0,0.35)"].join(","),
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [top ? -40 : 40, 0])}px)`,
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 22,
          opacity: reveal > 0 ? 1 : 0,
          transform: `scale(${interpolate(reveal, [0, 1], [0.4, 1])})`,
        }}
      >
        <div
          style={{
            color: "#fff",
            fontFamily: "Montserrat",
            fontWeight: 900,
            fontSize: 150,
            lineHeight: 1,
            textShadow: [...outlineShadow(8, "rgba(0,0,0,0.9)"), "0 10px 24px rgba(0,0,0,0.4)"].join(","),
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {shown}%
        </div>
        {winner && reveal > 0.5 ? (
          <div style={{ fontSize: 90, fontFamily: FONT_EMOJI, transform: `scale(${interpolate(reveal, [0.5, 1], [0, 1], { extrapolateLeft: "clamp" })})` }}>👑</div>
        ) : null}
      </div>
    </div>
  );
};

export const WyrVideo: React.FC<{ input: WyrInput; timeline: WyrTimeline }> = ({ input, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, timeline.rounds.findIndex((r) => t >= r.in && t < r.out));
  const round = timeline.rounds[idx];
  const q: WyrQuestion | undefined = input.questions.find((x) => x.id === round?.id);
  if (!round || !q) return <Shell input={input} timeline={timeline}>{null}</Shell>;
  const local = frame - Math.round(round.in * fps);
  const enter = spring({ frame: local, fps, config: { damping: 14, stiffness: 180 } });
  const revealP = t >= round.revealAt ? spring({ frame: frame - Math.round(round.revealAt * fps), fps, config: { damping: 16, stiffness: 120 } }) : 0;
  const counting = t >= round.countdownAt && t < round.revealAt;
  const remaining = Math.ceil(round.revealAt - t);
  const tickLocal = (t - round.countdownAt) % 1;
  const exitP = spring({ frame: frame - Math.round((round.out - 0.25) * fps), fps, config: { damping: 18, stiffness: 220 } });
  return (
    <Shell input={input} timeline={timeline}>
      {input.layout === "background" ? <Background spec={input.background} /> : null}
      <AbsoluteFill style={{ transform: `translateX(${interpolate(exitP, [0, 1], [0, -1080])}px)` }}>
        <Half color={input.aColor} text={q.a} emoji={q.aEmoji} image={q.aImage} top enter={enter} reveal={revealP} percent={q.percentA} winner={q.percentA >= 50} layout={input.layout} />
        <Half color={input.bColor} text={q.b} emoji={q.bEmoji} image={q.bImage} top={false} enter={enter} reveal={revealP} percent={100 - q.percentA} winner={q.percentA < 50} layout={input.layout} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
            fontFamily: "Montserrat",
            fontWeight: 900,
            fontSize: counting ? 110 : 76,
            color: "#111",
            transform: `scale(${interpolate(enter, [0, 1], [0, 1]) * (counting ? 1 + 0.12 * Math.max(0, 1 - tickLocal * 4) : 1)})`,
            position: "relative",
          }}
        >
          {counting ? (
            <svg width="220" height="220" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="110" cy="110" r="100" fill="none" stroke="#111" strokeWidth="12" strokeDasharray={2 * Math.PI * 100} strokeDashoffset={2 * Math.PI * 100 * (1 - (round.revealAt - t) / input.countdown)} strokeLinecap="round" />
            </svg>
          ) : null}
          {counting ? remaining : "OR"}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 70 }}>
        <div style={{ background: "rgba(0,0,0,0.55)", color: "#fff", fontFamily: "Montserrat", fontWeight: 900, fontSize: 46, letterSpacing: 2, padding: "14px 34px", borderRadius: 999, display: "flex", gap: 20, alignItems: "center" }}>
          {input.title}
          <span style={{ background: "#fff", color: "#111", borderRadius: 999, padding: "4px 18px", fontSize: 36 }}>
            {idx + 1}/{input.questions.length}
          </span>
        </div>
      </AbsoluteFill>
    </Shell>
  );
};
