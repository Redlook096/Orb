import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FontGate } from "../components/FontGate";
import { toFrames } from "../lib/constants";
import type { WordTiming } from "../lib/types";

export interface DemoLine {
  speaker: 0 | 1;
  src: string;
  at: number;
  duration: number;
  words: WordTiming[];
}

export interface DemoPodcastProps {
  lines: DemoLine[];
  duration: number;
  [key: string]: unknown;
}

const HOSTS = [
  { name: "Maya", color: ["#ff8a5c", "#ff3d7f"] },
  { name: "Jordan", color: ["#5ce1ff", "#6a5cff"] },
];

/** A sample landscape "podcast" clip with real narration, used for the clip-based frame demos. */
export const DemoPodcast: React.FC<DemoPodcastProps> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const speaking = lines.find((l) => t >= l.at && t < l.at + l.duration);
  const activeWord = speaking?.words.find((w) => t >= w.start && t < w.end + 0.05);
  return (
    <FontGate>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 120%, #3a2416 0%, #140d10 55%, #07060a 100%)", fontFamily: "Montserrat, sans-serif", overflow: "hidden" }}>
        {Array.from({ length: 14 }, (_, i) => {
          const x = ((i * 137) % 100) / 100;
          const y = ((i * 71) % 60) / 100;
          const r = 30 + ((i * 53) % 70);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x * width,
                top: y * height,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                background: i % 3 ? "rgba(255,180,90,0.08)" : "rgba(120,160,255,0.07)",
                filter: "blur(6px)",
                transform: `translateY(${Math.sin(t * 0.4 + i) * 6}px)`,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: height * 0.32, background: "linear-gradient(180deg, #2a1a12, #120b08)", borderTop: "2px solid rgba(255,200,140,0.08)" }} />
        {HOSTS.map((h, i) => {
          const active = speaking?.speaker === i;
          const pulse = active && activeWord ? 1 + 0.04 * Math.sin(t * 22) : 1;
          const lift = spring({ frame: active ? frame - toFrames(speaking!.at) : 0, fps, config: { damping: 14 } });
          const cx = width * (i === 0 ? 0.3 : 0.7);
          return (
            <div key={h.name} style={{ position: "absolute", left: cx - 150, top: height * 0.2, width: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 230,
                  height: 230,
                  borderRadius: "50%",
                  background: `linear-gradient(140deg, ${h.color[0]}, ${h.color[1]})`,
                  boxShadow: active ? `0 0 0 8px rgba(255,255,255,0.9), 0 0 80px ${h.color[1]}` : "0 0 0 4px rgba(255,255,255,0.15)",
                  transform: `scale(${pulse * (active ? interpolate(lift, [0, 1], [1, 1.04]) : 1)})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 96,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                {h.name[0]}
              </div>
              <div style={{ marginTop: 18, width: 26, height: 120, borderRadius: 13, background: "linear-gradient(#444, #1b1b1b)", boxShadow: "inset 0 0 0 3px #555" }} />
              <div style={{ marginTop: -150, marginLeft: 0, width: 70, height: 100, borderRadius: 35, background: "repeating-linear-gradient(0deg,#2c2c2c 0 4px,#3d3d3d 4px 8px)", border: "4px solid #4a4a4a", transform: "translateY(-40px)" }} />
              <div style={{ marginTop: -10, display: "flex", gap: 5, height: 50, alignItems: "flex-end" }}>
                {Array.from({ length: 9 }, (_, k) => (
                  <div
                    key={k}
                    style={{
                      width: 8,
                      borderRadius: 4,
                      background: active ? "#fff" : "rgba(255,255,255,0.25)",
                      height: active && activeWord ? 10 + Math.abs(Math.sin(t * 17 + k * 1.3)) * 38 : 6,
                    }}
                  />
                ))}
              </div>
              <div style={{ marginTop: 12, color: "#fff", fontSize: 30, fontWeight: 800 }}>{h.name}</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 48, bottom: 44, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#ff2d55", color: "#fff", fontWeight: 900, fontSize: 22, padding: "6px 14px", borderRadius: 8, letterSpacing: 2 }}>● LIVE</div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 30, letterSpacing: 1 }}>THE ORB PODCAST</div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: 24 }}>EP. 42</div>
        </div>
        {lines.map((l, i) => (
          <Sequence key={i} from={toFrames(l.at)} durationInFrames={toFrames(l.duration + 0.2)} layout="none">
            <Audio src={l.src} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </FontGate>
  );
};
