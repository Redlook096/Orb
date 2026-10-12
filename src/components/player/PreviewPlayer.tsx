"use client";

import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { TEMPLATE_META } from "@/remotion/registry";
import { TEMPLATE_COMPONENTS } from "@/remotion/components";
import { FPS, HEIGHT, WIDTH } from "@/remotion/lib/constants";
import type { BaseTimeline, TemplateId } from "@/remotion/lib/types";

export interface PreviewProps {
  template: TemplateId;
  input: unknown;
  /** Exact timeline from /api/prepare (with real voice). Falls back to an estimate when absent. */
  timeline?: BaseTimeline | null;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  muted?: boolean;
  initialFrame?: number;
  className?: string;
  style?: React.CSSProperties;
  clickToPlay?: boolean;
}

export const PreviewPlayer = forwardRef<PlayerRef, PreviewProps>(function PreviewPlayer(
  { template, input, timeline, autoPlay, loop = true, controls = true, muted, initialFrame, className, style, clickToPlay = true },
  ref,
) {
  const meta = TEMPLATE_META[template];
  const tl = useMemo(() => timeline ?? (meta.timeline(input) as BaseTimeline), [meta, input, timeline]);
  const component = TEMPLATE_COMPONENTS[template] as unknown as React.FC<Record<string, unknown>>;
  const inputProps = useMemo(() => ({ input, timeline: tl }), [input, tl]);
  const duration = Math.max(1, Math.round(tl.duration * FPS));
  // Compositions only make sense in the browser; skipping SSR avoids hydration noise and server work.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={className} style={{ width: "100%", height: "100%", background: "#000", ...style }} />;
  return (
    <Player
      ref={ref}
      component={component}
      inputProps={inputProps}
      durationInFrames={duration}
      fps={FPS}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      initiallyMuted={muted}
      initialFrame={initialFrame ? Math.min(duration - 1, initialFrame) : undefined}
      clickToPlay={clickToPlay}
      doubleClickToFullscreen
      allowFullscreen
      spaceKeyToPlayOrPause
      acknowledgeRemotionLicense
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
});

export const PhoneFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`relative mx-auto aspect-[9/16] w-full rounded-[2.4rem] bg-gradient-to-b from-ink-600 to-ink-800 p-[7px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)] ${className ?? ""}`}>
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-black">{children}</div>
  </div>
);
