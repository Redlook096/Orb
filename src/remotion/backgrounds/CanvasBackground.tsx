import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type DrawFn = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void;

/** Redraws a full-frame canvas for every frame from a pure (time → pixels) function. */
export const CanvasBackground: React.FC<{ draw: DrawFn; offset?: number; width?: number; height?: number }> = ({
  draw,
  offset = 0,
  width: w,
  height: h,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const config = useVideoConfig();
  const fps = config.fps;
  const width = w ?? config.width;
  const height = h ?? config.height;
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    draw(ctx, frame / fps + offset, width, height);
  }, [draw, frame, fps, width, height, offset]);
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={width} height={height} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
