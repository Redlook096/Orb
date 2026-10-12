import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../../backgrounds";
import { Shell } from "../Shell";
import type { ChatGPTInput, ChatGPTTimeline } from "./meta";
import { MicIcon, PlusIcon, SendIcon, SparkleIcon, StatusBar } from "../../components/icons";
import { FONT_EMOJI } from "../../lib/fonts";
import { HEIGHT } from "../../lib/constants";
import { useAnchoredScroll } from "../../components/useAnchoredScroll";

const THEME = {
  dark: { bg: "#212121", fg: "#ECECEC", muted: "#9B9B9B", bubble: "#303030", composer: "#303030" },
  light: { bg: "#FFFFFF", fg: "#0D0D0D", muted: "#8F8F8F", bubble: "#F1F1F1", composer: "#F4F4F4" },
};

const visibleWords = (text: string, count: number) => {
  const parts = text.split(/(\s+)/);
  let seen = 0;
  let out = "";
  for (const p of parts) {
    if (/^\s+$/.test(p)) {
      if (seen < count) out += p;
      continue;
    }
    if (seen >= count) break;
    out += p;
    seen++;
  }
  return out;
};

export const ChatGPTScreen: React.FC<{ input: ChatGPTInput; timeline: ChatGPTTimeline; height: number }> = ({ input, timeline, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const th = THEME[input.theme];
  const events = new Map(timeline.events.map((e) => [e.id, e]));
  const typingUser = input.messages.find((m) => {
    const e = events.get(m.id);
    return m.role === "user" && e && t >= e.start && t < e.at;
  });
  const typedText = typingUser
    ? typingUser.text.slice(0, Math.floor(typingUser.text.length * Math.min(1, (t - events.get(typingUser.id)!.start) / (events.get(typingUser.id)!.at - 0.15 - events.get(typingUser.id)!.start))))
    : "";
  const list = useAnchoredScroll();
  return (
    <div style={{ height, background: th.bg, color: th.fg, display: "flex", flexDirection: "column", fontFamily: `Inter, ${FONT_EMOJI}`, overflow: "hidden" }}>
      <StatusBar color={th.fg} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 44px 22px" }}>
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke={th.fg} strokeWidth="2" strokeLinecap="round">
          <path d="M4 8h16M4 16h10" />
        </svg>
        <div style={{ fontSize: 40, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
          {input.modelLabel}
          <span style={{ color: th.muted, fontSize: 30 }}>⌄</span>
        </div>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={th.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </div>
      <div ref={list.viewport} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: list.justify, overflow: "hidden", padding: "12px 44px 20px" }}>
        <div ref={list.content} style={{ display: "flex", flexDirection: "column", gap: 34, flexShrink: 0 }}>
        {input.messages.map((m) => {
          const e = events.get(m.id);
          if (!e) return null;
          if (m.role === "user") {
            if (t < e.at) return null;
            const p = spring({ frame: frame - Math.round(e.at * fps), fps, config: { damping: 15, stiffness: 220 } });
            return (
              <div key={m.id} style={{ display: "grid", gridTemplateRows: `${Math.min(1, p * 1.15)}fr`, opacity: p }}>
                <div style={{ minHeight: 0, overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: "78%", background: th.bubble, borderRadius: 48, padding: "26px 40px", fontSize: 42, lineHeight: 1.4, transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})`, transformOrigin: "top right" }}>{m.text}</div>
                </div>
              </div>
            );
          }
          if (t < e.start) return null;
          const thinking = t < e.at;
          const totalWords = m.text.split(/\s+/).filter(Boolean).length;
          let shown = totalWords;
          if (!thinking && t < e.end) {
            if (e.words.length) shown = e.words.filter((w) => t >= w.start - 0.05).length;
            else shown = Math.ceil(totalWords * ((t - e.at) / Math.max(0.1, e.end - e.at)));
          }
          const streaming = !thinking && t < e.end;
          return (
            <div key={m.id} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", border: `2px solid ${input.theme === "dark" ? "#444" : "#ddd"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SparkleIcon size={36} color={th.fg} />
              </div>
              <div style={{ fontSize: 44, lineHeight: 1.5, paddingTop: 4 }}>
                {thinking ? (
                  <span style={{ display: "inline-block", width: 30, height: 30, borderRadius: "50%", background: th.fg, transform: `scale(${0.7 + 0.3 * Math.sin(t * 10)})`, marginTop: 14 }} />
                ) : (
                  <>
                    {visibleWords(m.text, shown)}
                    {streaming ? <span style={{ display: "inline-block", width: 26, height: 26, borderRadius: "50%", background: th.fg, marginLeft: 10, verticalAlign: "middle" }} /> : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      <div style={{ padding: "10px 32px 40px" }}>
        <div style={{ background: th.composer, borderRadius: 56, padding: "24px 26px 24px 40px", display: "flex", alignItems: "center", gap: 22, minHeight: 110 }}>
          <PlusIcon size={44} color={th.fg} />
          <div style={{ flex: 1, fontSize: 40, color: typedText ? th.fg : th.muted, lineHeight: 1.35 }}>
            {typedText || "Ask anything"}
            {typedText ? <span style={{ display: "inline-block", width: 3, height: 44, background: "#2F7CF6", marginLeft: 4, verticalAlign: "middle", opacity: Math.floor(t * 3) % 2 ? 0 : 1 }} /> : null}
          </div>
          {typedText ? (
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: th.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SendIcon size={40} color={th.bg} />
            </div>
          ) : (
            <MicIcon size={44} color={th.fg} />
          )}
        </div>
      </div>
    </div>
  );
};

export const ChatGPTVideo: React.FC<{ input: ChatGPTInput; timeline: ChatGPTTimeline }> = ({ input, timeline }) => {
  const split = input.layout === "split";
  const chatH = split ? Math.round(HEIGHT * 0.58) : HEIGHT;
  return (
    <Shell input={input} timeline={timeline} showCaptions={false}>
      {split ? (
        <AbsoluteFill style={{ top: chatH, height: HEIGHT - chatH }}>
          <Background spec={input.background} height={HEIGHT - chatH} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ height: chatH, boxShadow: split ? "0 12px 40px rgba(0,0,0,0.5)" : undefined }}>
        <ChatGPTScreen input={input} timeline={timeline} height={chatH} />
      </AbsoluteFill>
    </Shell>
  );
};
