import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../../backgrounds";
import { Shell } from "../Shell";
import type { ChatMessage, FakeTextsInput, FakeTextsTimeline } from "./meta";
import { CameraIcon, ChevronLeft, ChevronRight, InfoIcon, MicIcon, PhoneIcon, PlusIcon, StatusBar, VideoCallIcon } from "../../components/icons";
import { Avatar } from "../../lib/avatar";
import { FONT_EMOJI } from "../../lib/fonts";
import { HEIGHT } from "../../lib/constants";
import { useAnchoredScroll } from "../../components/useAnchoredScroll";

interface Skin {
  bg: string;
  headerBg: string;
  headerFg: string;
  muted: string;
  meBg: string;
  meFg: string;
  themBg: string;
  themFg: string;
  radius: number;
  font: string;
  fontSize: number;
  meGradient?: string;
}

const skin = (app: FakeTextsInput["app"], dark: boolean): Skin => {
  switch (app) {
    case "whatsapp":
      return {
        bg: dark ? "#0B141A" : "#EFE7DE",
        headerBg: dark ? "#1F2C34" : "#008069",
        headerFg: "#FFFFFF",
        muted: dark ? "#8696A0" : "#667781",
        meBg: dark ? "#005C4B" : "#D9FDD3",
        meFg: dark ? "#E9EDEF" : "#111B21",
        themBg: dark ? "#202C33" : "#FFFFFF",
        themFg: dark ? "#E9EDEF" : "#111B21",
        radius: 22,
        font: "Roboto",
        fontSize: 40,
      };
    case "instagram":
      return {
        bg: dark ? "#000000" : "#FFFFFF",
        headerBg: dark ? "#000000" : "#FFFFFF",
        headerFg: dark ? "#F5F5F5" : "#000000",
        muted: dark ? "#A8A8A8" : "#737373",
        meBg: "#7C3AED",
        meFg: "#FFFFFF",
        themBg: dark ? "#262626" : "#EFEFEF",
        themFg: dark ? "#F5F5F5" : "#000000",
        radius: 44,
        font: "Inter",
        fontSize: 40,
        meGradient: "linear-gradient(160deg, #A033FF 0%, #6C3CF0 45%, #3B82F6 100%)",
      };
    default:
      return {
        bg: dark ? "#000000" : "#FFFFFF",
        headerBg: dark ? "rgba(28,28,30,0.96)" : "rgba(246,246,246,0.97)",
        headerFg: dark ? "#FFFFFF" : "#000000",
        muted: dark ? "#8E8E93" : "#8A8A8E",
        meBg: "#0A84FF",
        meFg: "#FFFFFF",
        themBg: dark ? "#26252A" : "#E9E9EB",
        themFg: dark ? "#FFFFFF" : "#000000",
        radius: 42,
        font: "Inter",
        fontSize: 41,
      };
  }
};

const Header: React.FC<{ input: FakeTextsInput; s: Skin }> = ({ input, s }) => {
  const dark = input.theme === "dark";
  if (input.app === "whatsapp") {
    return (
      <div style={{ background: s.headerBg, color: s.headerFg, flexShrink: 0 }}>
        <StatusBar color="#fff" />
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 36px 26px 20px" }}>
          <ChevronLeft size={52} color="#fff" />
          <Avatar src={input.contactAvatar} name={input.contactName} size={88} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 42, fontWeight: 600 }}>{input.contactName}</div>
            <div style={{ fontSize: 28, opacity: 0.85 }}>online</div>
          </div>
          <VideoCallIcon size={50} color="#fff" />
          <PhoneIcon size={44} color="#fff" style={{ marginLeft: 26 }} />
        </div>
      </div>
    );
  }
  if (input.app === "instagram") {
    return (
      <div style={{ background: s.headerBg, color: s.headerFg, flexShrink: 0, borderBottom: `1px solid ${dark ? "#262626" : "#DBDBDB"}` }}>
        <StatusBar color={s.headerFg} />
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 40px 24px 24px" }}>
          <ChevronLeft size={54} color={s.headerFg} />
          <Avatar src={input.contactAvatar} name={input.contactName} size={84} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 38, fontWeight: 700 }}>{input.contactName}</div>
            <div style={{ fontSize: 28, color: s.muted }}>Active now</div>
          </div>
          <PhoneIcon size={46} color={s.headerFg} />
          <VideoCallIcon size={54} color={s.headerFg} style={{ marginLeft: 26 }} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: s.headerBg, color: s.headerFg, flexShrink: 0, borderBottom: `1px solid ${dark ? "#2C2C2E" : "#D8D8DC"}` }}>
      <StatusBar color={s.headerFg} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 40px 18px 18px" }}>
        <ChevronLeft size={58} color="#0A84FF" style={{ marginTop: 40 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Avatar src={input.contactAvatar} name={input.contactName} size={104} flat={input.contactAvatar ? undefined : "linear-gradient(180deg,#A5ABB6,#858A94)"} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 30, fontWeight: 500 }}>
            {input.contactName}
            <ChevronRight size={26} color={s.muted} />
          </div>
        </div>
        <VideoCallIcon size={58} color="#0A84FF" style={{ marginTop: 40 }} />
      </div>
    </div>
  );
};

const Composer: React.FC<{ input: FakeTextsInput; s: Skin }> = ({ input, s }) => {
  const dark = input.theme === "dark";
  const border = dark ? "#3A3A3C" : "#D1D1D6";
  if (input.app === "whatsapp") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 24px 30px", background: dark ? "#0B141A" : "#F0F2F5", flexShrink: 0 }}>
        <PlusIcon size={48} color={s.muted} />
        <div style={{ flex: 1, height: 76, borderRadius: 40, background: dark ? "#2A3942" : "#fff", display: "flex", alignItems: "center", padding: "0 30px", fontSize: 34, color: s.muted }}>Message</div>
        <CameraIcon size={46} color={s.muted} />
        <MicIcon size={46} color={s.muted} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 30px 34px", background: s.bg, flexShrink: 0 }}>
      {input.app === "instagram" ? (
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CameraIcon size={40} color="#fff" />
        </div>
      ) : (
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: dark ? "#2C2C2E" : "#E9E9EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PlusIcon size={38} color={s.muted} />
        </div>
      )}
      <div style={{ flex: 1, height: 74, borderRadius: 40, border: `2px solid ${border}`, display: "flex", alignItems: "center", padding: "0 30px", fontSize: 34, color: s.muted }}>
        {input.app === "instagram" ? "Message..." : "iMessage"}
      </div>
      <MicIcon size={44} color={s.muted} />
    </div>
  );
};

const Bubble: React.FC<{ m: ChatMessage; s: Skin; input: FakeTextsInput; tail: boolean; progress: number; time: string }> = ({ m, s, input, tail, progress, time }) => {
  const me = m.from === "me";
  const bg = me ? s.meBg : s.themBg;
  const fg = me ? s.meFg : s.themFg;
  const isWA = input.app === "whatsapp";
  const big = /^\p{Extended_Pictographic}{1,3}$/u.test(m.text.trim());
  const r = s.radius;
  const radius = isWA
    ? me
      ? `${r}px ${tail ? 4 : r}px ${r}px ${r}px`
      : `${tail ? 4 : r}px ${r}px ${r}px ${r}px`
    : input.app === "instagram"
      ? `${r}px`
      : me
        ? `${r}px ${r}px ${tail ? 10 : r}px ${r}px`
        : `${r}px ${r}px ${r}px ${tail ? 10 : r}px`;
  const scale = interpolate(progress, [0, 1], [0.6, 1]);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: `${Math.min(1, progress * 1.15)}fr`,
        opacity: interpolate(progress, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div style={{ minHeight: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", padding: `${tail ? 6 : 3}px 30px ${tail ? 14 : 3}px`, alignItems: "flex-end", gap: 14 }}>
          {input.app === "instagram" && !me ? (
            <div style={{ width: 64, flexShrink: 0, opacity: tail ? 1 : 0 }}>
              <Avatar src={input.contactAvatar} name={input.contactName} size={64} />
            </div>
          ) : null}
          <div
            style={{
              maxWidth: "74%",
              transform: `scale(${scale})`,
              transformOrigin: me ? "top right" : "top left",
              background: big ? "transparent" : me && s.meGradient ? s.meGradient : bg,
              color: fg,
              borderRadius: radius,
              padding: big ? 0 : m.image ? 8 : isWA ? "16px 24px 14px" : "22px 34px",
              fontSize: big ? 120 : s.fontSize,
              lineHeight: 1.3,
              fontFamily: `${s.font}, ${FONT_EMOJI}`,
              fontWeight: 400,
              boxShadow: isWA ? "0 1px 1px rgba(0,0,0,0.13)" : undefined,
              position: "relative",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {m.image ? (
              <Img src={m.image} style={{ display: "block", maxWidth: 600, maxHeight: 560, borderRadius: r - 8, objectFit: "cover", marginBottom: m.text ? 12 : 0 }} />
            ) : null}
            {m.text ? <span style={{ padding: m.image ? "0 18px 10px" : 0, display: m.image ? "block" : "inline" }}>{m.text}</span> : null}
            {isWA ? (
              <span style={{ fontSize: 24, color: me ? (input.theme === "dark" ? "#8FB3AA" : "#667781") : s.muted, marginLeft: 18, float: "right", marginTop: 18, display: "flex", alignItems: "center", gap: 4 }}>
                {time}
                {me ? <span style={{ color: "#53BDEB", fontSize: 26, letterSpacing: -6 }}>✓✓</span> : null}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const Typing: React.FC<{ s: Skin; frame: number; progress: number; input: FakeTextsInput }> = ({ s, frame, progress, input }) => (
  <div style={{ display: "flex", padding: "6px 30px 14px", alignItems: "flex-end", gap: 14, opacity: progress, transform: `scale(${interpolate(progress, [0, 1], [0.6, 1])})`, transformOrigin: "bottom left" }}>
    {input.app === "instagram" ? <Avatar src={input.contactAvatar} name={input.contactName} size={64} /> : null}
    <div style={{ background: s.themBg, borderRadius: 40, padding: "26px 32px", display: "flex", gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: s.muted,
            opacity: 0.45 + 0.55 * Math.max(0, Math.sin((frame / 30) * 9 - i * 0.9)),
            transform: `translateY(${-6 * Math.max(0, Math.sin((frame / 30) * 9 - i * 0.9))}px)`,
          }}
        />
      ))}
    </div>
  </div>
);

export const ChatScreen: React.FC<{ input: FakeTextsInput; timeline: FakeTextsTimeline; height: number }> = ({ input, timeline, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = skin(input.app, input.theme === "dark");
  const events = new Map(timeline.events.map((e) => [e.id, e]));
  const visible = input.messages.filter((m) => (events.get(m.id)?.at ?? Infinity) <= t + 0.001);
  const typing = input.messages.find((m) => {
    const e = events.get(m.id);
    return e && e.typingAt !== null && t >= e.typingAt && t < e.at;
  });
  const lastMe = [...visible].reverse().find((m) => m.from === "me");
  const list = useAnchoredScroll();
  return (
    <div style={{ height, display: "flex", flexDirection: "column", background: s.bg, overflow: "hidden", fontFamily: `${s.font}, ${FONT_EMOJI}` }}>
      <Header input={input} s={s} />
      <div ref={list.viewport} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: list.justify, overflow: "hidden", paddingBottom: 6 }}>
        <div ref={list.content} style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {input.app === "imessage" ? (
          <div style={{ textAlign: "center", color: s.muted, fontSize: 26, fontWeight: 500, padding: "18px 0 12px" }}>
            <b style={{ fontWeight: 600 }}>iMessage</b>
            <br />
            Today 9:41 PM
          </div>
        ) : null}
        {visible.map((m, i) => {
          const e = events.get(m.id)!;
          const progress = spring({ frame: frame - Math.round(e.at * fps), fps, config: { damping: 15, stiffness: 210, mass: 0.6 } });
          const next = visible[i + 1];
          const tail = !next || next.from !== m.from;
          const mins = 41 + Math.floor(i / 3);
          return (
            <React.Fragment key={m.id}>
              <Bubble m={m} s={s} input={input} tail={tail} progress={progress} time={`9:${String(mins).padStart(2, "0")}`} />
              {input.app === "imessage" && m === lastMe && !next ? (
                <div style={{ textAlign: "right", color: s.muted, fontSize: 26, fontWeight: 500, padding: "0 40px 10px" }}>Delivered</div>
              ) : null}
            </React.Fragment>
          );
        })}
        {typing ? (
          <Typing
            s={s}
            frame={frame}
            input={input}
            progress={spring({ frame: frame - Math.round((events.get(typing.id)!.typingAt ?? 0) * fps), fps, config: { damping: 14, stiffness: 220 } })}
          />
        ) : null}
        </div>
      </div>
      <Composer input={input} s={s} />
    </div>
  );
};

export const FakeTextsVideo: React.FC<{ input: FakeTextsInput; timeline: FakeTextsTimeline }> = ({ input, timeline }) => {
  const split = input.layout === "split";
  const chatH = split ? Math.round(HEIGHT * 0.56) : Math.round(HEIGHT * 0.7);
  return (
    <Shell input={input} timeline={timeline} showCaptions={false}>
      {split ? (
        <>
          <AbsoluteFill style={{ top: chatH, height: HEIGHT - chatH }}>
            <Background spec={input.background} height={HEIGHT - chatH} />
          </AbsoluteFill>
          <AbsoluteFill style={{ height: chatH, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
            <ChatScreen input={input} timeline={timeline} height={chatH} />
          </AbsoluteFill>
        </>
      ) : (
        <>
          <Background spec={input.background} />
          <AbsoluteFill style={{ padding: "110px 48px", justifyContent: "flex-start" }}>
            <div style={{ borderRadius: 56, overflow: "hidden", boxShadow: "0 30px 90px rgba(0,0,0,0.55)" }}>
              <ChatScreen input={input} timeline={timeline} height={chatH} />
            </div>
          </AbsoluteFill>
        </>
      )}
    </Shell>
  );
};
