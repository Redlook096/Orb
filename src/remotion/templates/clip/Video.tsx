import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { Background } from "../../backgrounds";
import { Shell } from "../Shell";
import type { BlurInput, CaptionsInput, ClipInput, ClipTimeline, SplitInput } from "./meta";
import { HEIGHT, WIDTH } from "../../lib/constants";
import { FONT_EMOJI } from "../../lib/fonts";
import { previewSafeOnError } from "../../lib/media-errors";

const Placeholder: React.FC<{ label?: string }> = ({ label = "Upload a clip to preview" }) => (
  <AbsoluteFill
    style={{
      background: "repeating-linear-gradient(135deg, #15151d 0 40px, #191923 40px 80px)",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.55)",
      fontSize: 44,
      fontWeight: 600,
      gap: 24,
    }}
  >
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3z" fill="currentColor" />
    </svg>
    {label}
  </AbsoluteFill>
);

const Clip: React.FC<{ input: ClipInput; fit: "cover" | "contain"; muted?: boolean; style?: React.CSSProperties }> = ({ input, fit, muted, style }) =>
  input.clip ? (
    <OffthreadVideo
      src={input.clip.src}
      volume={muted ? 0 : input.clipVolume}
      muted={muted}
      onError={previewSafeOnError()}
      style={{ width: "100%", height: "100%", objectFit: fit, ...style }}
    />
  ) : (
    <Placeholder />
  );

export const SplitVideo: React.FC<{ input: SplitInput; timeline: ClipTimeline }> = ({ input, timeline }) => {
  const clipH = Math.round(HEIGHT * Math.min(0.75, Math.max(0.25, input.ratio)));
  const bgH = HEIGHT - clipH;
  const clipTop = input.clipOnTop;
  return (
    <Shell input={input} timeline={timeline} captionTop={`${((clipTop ? clipH : bgH) / HEIGHT) * 100}%`}>
      <AbsoluteFill style={{ top: clipTop ? 0 : bgH, height: clipH, overflow: "hidden" }}>
        <Clip input={input} fit="cover" />
      </AbsoluteFill>
      <AbsoluteFill style={{ top: clipTop ? clipH : 0, height: bgH, overflow: "hidden" }}>
        <Background spec={input.background} height={bgH} />
      </AbsoluteFill>
    </Shell>
  );
};

const BlurredFill: React.FC<{ input: ClipInput; blur: number; zoom?: number }> = ({ input, blur, zoom = 1 }) => (
  <>
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {input.clip ? (
        <Clip input={input} fit="cover" muted style={{ filter: `blur(${blur}px) brightness(0.62) saturate(1.2)`, transform: "scale(1.25)" }} />
      ) : (
        <Background spec={input.background} dim={0.35} />
      )}
    </AbsoluteFill>
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: WIDTH * zoom, maxHeight: HEIGHT, aspectRatio: input.clip?.width && input.clip?.height ? `${input.clip.width} / ${input.clip.height}` : "16 / 9", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", position: "relative", overflow: "hidden" }}>
        {input.clip ? <Clip input={input} fit="cover" /> : <Placeholder />}
      </div>
    </AbsoluteFill>
  </>
);

export const BlurVideo: React.FC<{ input: BlurInput; timeline: ClipTimeline }> = ({ input, timeline }) => (
  <Shell input={input} timeline={timeline}>
    <BlurredFill input={input} blur={input.blur} zoom={input.zoom} />
    {input.headline.trim() ? (
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <div
          style={{
            background: "#FFFFFF",
            color: "#111",
            fontFamily: `Montserrat, ${FONT_EMOJI}`,
            fontWeight: 800,
            fontSize: 62,
            padding: "18px 40px",
            borderRadius: 22,
            maxWidth: 920,
            textAlign: "center",
            lineHeight: 1.2,
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          }}
        >
          {input.headline}
        </div>
      </AbsoluteFill>
    ) : null}
  </Shell>
);

export const CaptionsVideo: React.FC<{ input: CaptionsInput; timeline: ClipTimeline }> = ({ input, timeline }) => (
  <Shell input={input} timeline={timeline}>
    {input.fit === "cover" ? (
      <AbsoluteFill>
        <Clip input={input} fit="cover" />
      </AbsoluteFill>
    ) : (
      <BlurredFill input={input} blur={40} />
    )}
  </Shell>
);
