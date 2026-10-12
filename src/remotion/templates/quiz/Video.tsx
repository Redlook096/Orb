import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../../backgrounds";
import { Shell } from "../Shell";
import type { QuizInput, QuizTimeline } from "./meta";
import { FONT_EMOJI } from "../../lib/fonts";

const LETTERS = ["A", "B", "C", "D"];

export const QuizVideo: React.FC<{ input: QuizInput; timeline: QuizTimeline }> = ({ input, timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, timeline.rounds.findIndex((r) => t >= r.in && t < r.out));
  const round = timeline.rounds[idx];
  const q = input.questions.find((x) => x.id === round?.id);
  if (!round || !q) return <Shell input={input} timeline={timeline}>{null}</Shell>;
  const enter = spring({ frame: frame - Math.round(round.in * fps), fps, config: { damping: 15, stiffness: 170 } });
  const exit = spring({ frame: frame - Math.round((round.out - 0.3) * fps), fps, config: { damping: 18, stiffness: 220 } });
  const revealed = t >= round.revealAt;
  const counting = t >= round.countdownAt && !revealed;
  const progress = counting ? (t - round.countdownAt) / input.countdown : revealed ? 1 : 0;
  return (
    <Shell input={input} timeline={timeline}>
      <Background spec={input.background} dim={0.25} />
      <AbsoluteFill style={{ padding: "120px 60px", alignItems: "center", gap: 40, transform: `translateX(${interpolate(exit, [0, 1], [0, -1100])}px)` }}>
        <div style={{ color: "#fff", fontFamily: `Montserrat, ${FONT_EMOJI}`, fontWeight: 900, fontSize: 52, textAlign: "center", textShadow: "0 6px 20px rgba(0,0,0,0.6)" }}>{input.title}</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {input.questions.map((x, i) => (
            <div key={x.id} style={{ width: i === idx ? 64 : 22, height: 22, borderRadius: 999, background: i < idx ? input.accent : i === idx ? "#fff" : "rgba(255,255,255,0.35)" }} />
          ))}
        </div>
        <div
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 44,
            padding: "56px 50px 50px",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])})`,
            opacity: enter,
            position: "relative",
            marginTop: 60,
          }}
        >
          <div style={{ position: "absolute", top: -78, left: "50%", transform: "translateX(-50%)", width: 150, height: 150, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 92, fontFamily: FONT_EMOJI, boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }}>
            {q.emoji}
          </div>
          <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 30, color: "#8A8FA3", textAlign: "center", marginTop: 50, letterSpacing: 2 }}>
            QUESTION {idx + 1} OF {input.questions.length}
          </div>
          <div style={{ fontFamily: `Montserrat, ${FONT_EMOJI}`, fontWeight: 800, fontSize: 58, color: "#14141F", textAlign: "center", lineHeight: 1.2, marginTop: 18 }}>{q.question}</div>
          <div style={{ height: 14, background: "#ECEEF4", borderRadius: 999, marginTop: 40, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress * 100}%`, background: revealed ? input.accent : "#F59E0B", borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
          {q.options.map((opt, i) => {
            const appear = spring({ frame: frame - Math.round((round.optionsAt + i * 0.15) * fps), fps, config: { damping: 14, stiffness: 200 } });
            const correct = i === q.answer;
            const pulse = revealed && correct ? 1 + 0.05 * Math.sin((t - round.revealAt) * 10) * Math.exp(-(t - round.revealAt) * 2) : 1;
            const bg = revealed ? (correct ? input.accent : "rgba(18,18,28,0.82)") : "rgba(255,255,255,0.94)";
            const fg = revealed ? (correct ? "#fff" : "rgba(255,255,255,0.45)") : "#14141F";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  background: bg,
                  color: fg,
                  borderRadius: 30,
                  padding: "26px 34px",
                  fontFamily: `Montserrat, ${FONT_EMOJI}`,
                  fontWeight: 800,
                  fontSize: 50,
                  transform: `translateX(${interpolate(appear, [0, 1], [i % 2 ? 900 : -900, 0])}px) scale(${pulse})`,
                  boxShadow: revealed && correct ? `0 0 0 6px #fff, 0 20px 50px ${input.accent}88` : "0 10px 30px rgba(0,0,0,0.25)",
                }}
              >
                <span style={{ width: 82, height: 82, borderRadius: 24, background: revealed && correct ? "rgba(255,255,255,0.25)" : revealed ? "rgba(255,255,255,0.12)" : "#14141F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, flexShrink: 0 }}>
                  {revealed && correct ? "✓" : LETTERS[i]}
                </span>
                {opt}
              </div>
            );
          })}
        </div>
        {counting ? (
          <div style={{ position: "absolute", bottom: 150, color: "#fff", fontFamily: "Montserrat", fontWeight: 900, fontSize: 140, textShadow: "0 10px 30px rgba(0,0,0,0.5)", transform: `scale(${1 + 0.25 * Math.max(0, 1 - ((t - round.countdownAt) % 1) * 4)})` }}>
            {Math.ceil(round.revealAt - t)}
          </div>
        ) : null}
      </AbsoluteFill>
    </Shell>
  );
};
