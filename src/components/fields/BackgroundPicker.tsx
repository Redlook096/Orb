"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { PROCEDURAL_BACKGROUNDS } from "@/remotion/backgrounds/catalog";
import { drawParkour } from "@/remotion/backgrounds/parkour";
import { drawRunner } from "@/remotion/backgrounds/runner";
import { drawNeon } from "@/remotion/backgrounds/neon";
import { drawRings } from "@/remotion/backgrounds/rings";
import { drawGradient } from "@/remotion/backgrounds/gradient";
import { drawSpace } from "@/remotion/backgrounds/space";
import type { BackgroundSpec, ProceduralBackgroundId } from "@/remotion/lib/types";
import { MediaPicker } from "./MediaPicker";
import { cn } from "../ui/primitives";

const DRAW: Record<ProceduralBackgroundId, (seed: number) => (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void> = {
  parkour: drawParkour,
  runner: drawRunner,
  neon: drawNeon,
  rings: (seed) => drawRings(seed, 30),
  gradient: drawGradient,
  space: drawSpace,
};

/** Draws a single still of a procedural background as a thumbnail. */
const Thumb: React.FC<{ id: ProceduralBackgroundId }> = ({ id }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const raf = requestAnimationFrame(() => DRAW[id](1)(ctx, id === "rings" ? 6 : 12, c.width, c.height));
    return () => cancelAnimationFrame(raf);
  }, [id]);
  return <canvas ref={ref} width={216} height={384} className="h-full w-full" />;
};

export const BackgroundPicker: React.FC<{ value: BackgroundSpec; onChange: (v: BackgroundSpec) => void }> = ({ value, onChange }) => {
  const seed = value.kind === "procedural" ? value.seed ?? 1 : Math.floor(Math.random() * 1000);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
        {PROCEDURAL_BACKGROUNDS.map((b) => {
          const active = value.kind === "procedural" && value.id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange({ kind: "procedural", id: b.id, seed })}
              className={cn("group relative overflow-hidden rounded-xl border-2 text-left transition", active ? "border-brand-400" : "border-transparent hover:border-white/20")}
              title={b.description}
            >
              <div className="aspect-[9/16] bg-black">
                <Thumb id={b.id} />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pt-6 pb-1.5 text-[11px] font-semibold text-white">{b.name}</div>
              {active ? (
                <div className="absolute top-1.5 right-1.5 rounded-full bg-brand-500 p-0.5">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11.5px] text-ink-400">Or use your own gameplay footage:</div>
        {value.kind === "procedural" ? (
          <button type="button" className="text-[11.5px] font-semibold text-brand-300 hover:text-brand-200" onClick={() => onChange({ ...value, seed: Math.floor(Math.random() * 10000) })}>
            Shuffle course
          </button>
        ) : null}
      </div>
      <MediaPicker
        kind="video"
        label="Upload gameplay video"
        value={value.kind === "video" ? { src: value.src, name: value.name } : null}
        onChange={(a) => onChange(a ? { kind: "video", src: a.src, duration: a.duration, name: a.name } : { kind: "procedural", id: "parkour", seed })}
      />
    </div>
  );
};
