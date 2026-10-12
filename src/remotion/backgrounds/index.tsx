import React, { useMemo } from "react";
import { AbsoluteFill, Loop, OffthreadVideo, useVideoConfig } from "remotion";
import type { BackgroundSpec, ProceduralBackgroundId } from "../lib/types";
import { CanvasBackground, type DrawFn } from "./CanvasBackground";
import { previewSafeOnError } from "../lib/media-errors";
import { drawParkour } from "./parkour";
import { drawRunner } from "./runner";
import { drawNeon } from "./neon";
import { drawRings } from "./rings";
import { drawGradient } from "./gradient";
import { drawSpace } from "./space";

export { PROCEDURAL_BACKGROUNDS } from "./catalog";

const makeDraw = (id: ProceduralBackgroundId, seed: number, fps: number): DrawFn => {
  switch (id) {
    case "parkour":
      return drawParkour(seed);
    case "runner":
      return drawRunner(seed);
    case "neon":
      return drawNeon(seed);
    case "rings":
      return drawRings(seed, fps);
    case "gradient":
      return drawGradient(seed);
    case "space":
      return drawSpace(seed);
  }
};

/** Renders a background at full frame, or into a sub-region when width/height are given. */
export const Background: React.FC<{ spec: BackgroundSpec; dim?: number; width?: number; height?: number }> = ({
  spec,
  dim = 0,
  width,
  height,
}) => {
  const { fps } = useVideoConfig();
  const seed = spec.kind === "procedural" ? spec.seed ?? 1 : 0;
  const id = spec.kind === "procedural" ? spec.id : null;
  const draw = useMemo(() => (id ? makeDraw(id, seed, fps) : null), [id, seed, fps]);
  let content: React.ReactNode = null;
  if (spec.kind === "procedural" && draw) {
    // Rings must start at t=0 so the simulation is visible from its first bounce.
    content = (
      <CanvasBackground draw={draw} width={width} height={height} offset={spec.id === "rings" ? 0 : (seed % 50) * 7} />
    );
  } else if (spec.kind === "video") {
    const loopFrames = Math.max(1, Math.floor(spec.duration * fps));
    content = (
      <Loop durationInFrames={loopFrames}>
        <OffthreadVideo src={spec.src} muted onError={previewSafeOnError()} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Loop>
    );
  } else if (spec.kind === "color") {
    content = <AbsoluteFill style={{ background: spec.color }} />;
  }
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {content}
      {dim > 0 ? <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};
