"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { FRAMES, TOOLS, type FrameInfo } from "@/lib/catalog";
import { TEMPLATE_META } from "@/remotion/registry";
import { HoverPreview } from "./player/HoverPreview";
import { FRAME_ICONS, TOOL_ICONS } from "./ui/icons";
import { Badge } from "./ui/primitives";

const DEMO_INPUTS = Object.fromEntries(FRAMES.map((f) => [f.id, TEMPLATE_META[f.id].demo()]));

export const FrameCard: React.FC<{ frame: FrameInfo; poster?: number }> = ({ frame, poster }) => {
  const Icon = FRAME_ICONS[frame.id];
  return (
    <Link href={`/create/${frame.slug}`} className="group block">
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/[0.07] bg-black shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] transition duration-300 group-hover:-translate-y-1 group-hover:border-white/20">
        <HoverPreview template={frame.id} input={DEMO_INPUTS[frame.id]} poster={poster} />
        {frame.badge ? (
          <div className="absolute top-2.5 left-2.5">
            <Badge tone="brand" className="bg-black/60 text-white backdrop-blur">
              {frame.badge}
            </Badge>
          </div>
        ) : null}
        <div className="pointer-events-none absolute right-2.5 bottom-2.5 flex size-9 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition group-hover:opacity-100">
          <Play className="size-4" fill="currentColor" />
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${frame.accent}22`, color: frame.accent }}>
          <Icon className="size-3.5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-white">{frame.name}</div>
          <div className="text-[12px] leading-snug text-ink-400">{frame.short}</div>
        </div>
      </div>
    </Link>
  );
};

const POSTERS: Record<string, number> = { reddit: 45, "fake-texts": 200, "split-screen": 60, twitter: 150, chatgpt: 300, "would-you-rather": 230, quiz: 160, blur: 60, captions: 60 };

export const FrameGrid: React.FC<{ frames?: FrameInfo[] }> = ({ frames = FRAMES }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {frames.map((f) => (
      <FrameCard key={f.id} frame={f} poster={POSTERS[f.id]} />
    ))}
  </div>
);

export const ToolGrid: React.FC = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {TOOLS.map((t) => {
      const Icon = TOOL_ICONS[t.icon];
      return (
        <Link key={t.slug} href={t.href} className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-ink-900/70 p-4 transition hover:border-white/15 hover:bg-ink-850">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${t.accent}1f`, color: t.accent }}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-white">{t.name}</div>
            <div className="truncate text-[12.5px] text-ink-400">{t.short}</div>
          </div>
          <ArrowRight className="size-4 text-ink-500 transition group-hover:translate-x-0.5 group-hover:text-ink-200" />
        </Link>
      );
    })}
  </div>
);
