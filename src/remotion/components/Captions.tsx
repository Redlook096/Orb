import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTION_STYLES, buildPages, outlineShadow, type CaptionStyle } from "../lib/captions";
import type { CaptionSettings, WordTiming } from "../lib/types";
import { FONT_EMOJI } from "../lib/fonts";

const POSITION_TOP: Record<CaptionSettings["position"], string> = {
  top: "24%",
  center: "50%",
  bottom: "71%",
};

export const CaptionWord: React.FC<{
  text: string;
  style: CaptionStyle;
  color: string;
  scale: number;
  boxColor?: string;
  glowColor?: string;
  size: number;
}> = ({ text, style, color, scale, boxColor, glowColor, size }) => {
  const shadows = [
    ...outlineShadow(style.stroke * (size / style.size), style.strokeColor),
    ...(style.extrude
      ? Array.from({ length: 9 }, (_, i) => `0 ${(i + 1) * 1.4}px 0 #1a1a1a`)
      : []),
    ...(glowColor ? [`0 0 10px ${glowColor}`, `0 0 26px ${glowColor}`, `0 0 52px ${glowColor}`] : []),
    ...(style.shadow ? [style.shadow] : []),
  ];
  return (
    <span
      style={{
        display: "inline-block",
        transform: `scale(${scale})`,
        color,
        textShadow: shadows.join(", "),
        padding: boxColor ? "2px 22px 8px" : "0 6px",
        margin: boxColor ? "4px 4px" : "0 2px",
        borderRadius: 18,
        background: boxColor ?? "transparent",
        whiteSpace: "pre",
      }}
    >
      {text}
    </span>
  );
};

export const CaptionLayer: React.FC<{
  words: WordTiming[];
  settings: CaptionSettings;
  /** Restrict captions to a vertical band, e.g. the gap between split-screen halves. */
  top?: string;
}> = ({ words, settings, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const style = CAPTION_STYLES[settings.style] ?? CAPTION_STYLES.classic;
  const maxWords = style.single ? 1 : settings.maxWords;
  const pages = useMemo(() => buildPages(words, maxWords, style.single ? 30 : 20 + maxWords * 2), [words, maxWords, style.single]);

  if (!settings.enabled) return null;
  const page = pages.find((p) => t >= p.start - 0.04 && t < p.end);
  if (!page) return null;

  const size = style.size * settings.scale;
  const local = frame - Math.round(page.start * fps);
  const enter = spring({ frame: local, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });

  let pageScale = 1;
  let pageOpacity = 1;
  let pageY = 0;
  switch (style.anim) {
    case "pop":
      pageScale = interpolate(enter, [0, 1], [0.78, 1]);
      pageOpacity = interpolate(local, [0, 3], [0, 1], { extrapolateRight: "clamp" });
      break;
    case "bounce":
      pageScale = interpolate(enter, [0, 1], [0.5, 1]);
      break;
    case "slam":
      pageScale = interpolate(spring({ frame: local, fps, config: { damping: 11, stiffness: 320, mass: 0.5 } }), [0, 1], [1.55, 1]);
      pageOpacity = interpolate(local, [0, 2], [0, 1], { extrapolateRight: "clamp" });
      break;
    case "fade":
      pageOpacity = interpolate(local, [0, 5], [0, 1], { extrapolateRight: "clamp" });
      break;
    case "rise":
      pageY = interpolate(enter, [0, 1], [40, 0]);
      pageOpacity = interpolate(local, [0, 4], [0, 1], { extrapolateRight: "clamp" });
      break;
  }

  const tiltSeed = Math.round(page.start * 1000) % 3;
  const tilt = style.tilt ? (tiltSeed - 1) * style.tilt : 0;
  const highlight = settings.highlight || style.defaultHighlight;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: "7%",
          right: "7%",
          top: top ?? POSITION_TOP[settings.position],
          transform: `translateY(-50%) translateY(${pageY}px) scale(${pageScale}) rotate(${tilt}deg)`,
          opacity: pageOpacity,
          textAlign: "center",
          fontFamily: `${style.font}, ${FONT_EMOJI}`,
          fontWeight: style.weight,
          fontSize: size,
          lineHeight: 1.12,
          letterSpacing: style.letterSpacing ?? 0,
          textTransform: settings.uppercase ? "uppercase" : "none",
          wordBreak: "break-word",
        }}
      >
        {page.words.map((w, i) => {
          const isActive = t >= w.start - 0.02 && t < (page.words[i + 1]?.start ?? page.end);
          const spoken = t >= w.start - 0.02;
          const wordLocal = frame - Math.round(w.start * fps);
          const wordPop =
            isActive && style.active !== "none"
              ? interpolate(
                  spring({ frame: wordLocal, fps, config: { damping: 12, stiffness: 260, mass: 0.5 } }),
                  [0, 1],
                  [style.anim === "bounce" ? 1.22 : 1.12, 1.06],
                )
              : 1;
          let color = style.fill;
          let box: string | undefined;
          let glow: string | undefined;
          if (style.active === "color" && isActive && !style.single) color = highlight;
          if (style.active === "color" && style.single) {
            const idx = words.indexOf(w);
            color = idx % 3 === 2 ? highlight : style.fill;
          }
          if (style.active === "box" && isActive) box = highlight;
          if (style.active === "karaoke") color = spoken ? highlight : "rgba(255,255,255,0.92)";
          if (style.active === "glow") {
            glow = highlight;
            if (isActive) color = "#FFFFFF";
            else color = "rgba(255,255,255,0.86)";
          }
          return (
            <React.Fragment key={`${w.start}-${i}`}>
              <CaptionWord
                text={w.text}
                style={style}
                color={color}
                scale={wordPop}
                boxColor={box}
                glowColor={glow ? (isActive ? glow : /^#[0-9a-f]{6}$/i.test(glow) ? `${glow}70` : glow) : undefined}
                size={size}
              />
              {i < page.words.length - 1 ? " " : null}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
