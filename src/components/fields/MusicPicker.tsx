"use client";

import { useState } from "react";
import { Music, Play, Square, VolumeX } from "lucide-react";
import { MUSIC_TRACKS } from "@/remotion/lib/assets";
import type { MusicSpec } from "@/remotion/lib/types";
import { playPreview, stopPreview } from "@/lib/hooks";
import { MediaPicker } from "./MediaPicker";
import { Slider } from "./basic";
import { cn } from "../ui/primitives";

export const MusicPicker: React.FC<{ value: MusicSpec; onChange: (v: MusicSpec) => void }> = ({ value, onChange }) => {
  const [playing, setPlaying] = useState<string | null>(null);
  const toggle = (id: string) => {
    if (playing === id) {
      stopPreview();
      setPlaying(null);
      return;
    }
    setPlaying(id);
    playPreview(`/music/${id}.mp3`, () => setPlaying((p) => (p === id ? null : p)));
  };
  const custom = value.track && value.track.includes("/") ? value.track : null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange({ ...value, track: null })}
          className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left", value.track === null ? "border-brand-500/60 bg-brand-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]")}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white/[0.06]">
            <VolumeX className="size-3.5 text-ink-300" />
          </span>
          <span className="text-[13px] font-semibold text-ink-100">No music</span>
        </button>
        {MUSIC_TRACKS.map((t) => (
          <div key={t.id} className={cn("flex items-center gap-2.5 rounded-xl border px-2.5 py-2", value.track === t.id ? "border-brand-500/60 bg-brand-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]")}>
            <button type="button" onClick={() => toggle(t.id)} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14]" aria-label={`Preview ${t.name}`}>
              {playing === t.id ? <Square className="size-3" fill="currentColor" /> : <Play className="size-3.5" fill="currentColor" />}
            </button>
            <button type="button" onClick={() => onChange({ ...value, track: t.id, volume: value.volume || 0.12 })} className="min-w-0 flex-1 text-left">
              <div className="text-[13px] font-semibold text-ink-100">{t.name}</div>
              <div className="truncate text-[11px] text-ink-400">{t.mood}</div>
            </button>
          </div>
        ))}
      </div>
      <MediaPicker kind="audio" label="Upload your own track" value={custom ? { src: custom } : null} onChange={(a) => onChange({ ...value, track: a ? a.src : null, volume: value.volume || 0.12 })} compact />
      {value.track ? (
        <div>
          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-ink-300">
            <Music className="size-3.5" /> Music volume
          </div>
          <Slider value={value.volume} min={0.02} max={0.6} step={0.01} onChange={(v) => onChange({ ...value, volume: v })} format={(v) => `${Math.round(v * 100)}%`} />
        </div>
      ) : null}
    </div>
  );
};
