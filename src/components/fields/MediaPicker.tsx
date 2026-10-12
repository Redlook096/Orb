"use client";

import { useRef, useState } from "react";
import { Film, ImageIcon, LoaderCircle, Music, Upload, X } from "lucide-react";
import { formatDuration, uploadFile, type MediaAsset } from "@/lib/api";
import { invalidate, useLibrary } from "@/lib/hooks";
import { Button, cn } from "../ui/primitives";

const ACCEPT: Record<MediaAsset["kind"], string> = {
  video: "video/*,.mov,.mkv",
  image: "image/*",
  audio: "audio/*",
};

/** Upload or choose a library asset of one kind. */
export const MediaPicker: React.FC<{
  kind: MediaAsset["kind"];
  value: { src: string; name?: string } | null;
  onChange: (asset: MediaAsset | null) => void;
  label?: string;
  compact?: boolean;
}> = ({ kind, value, onChange, label, compact }) => {
  const { data, reload } = useLibrary();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const assets = (data?.uploads ?? []).filter((a) => a.kind === kind);
  const Icon = kind === "video" ? Film : kind === "image" ? ImageIcon : Music;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const asset = await uploadFile(file, (f) => setProgress(f));
      invalidate("/api/library");
      await reload();
      onChange(asset);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  const current = value ? assets.find((a) => a.src === value.src) : null;

  return (
    <div>
      <input ref={input} type="file" accept={ACCEPT[kind]} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div
        className={cn("flex items-center gap-3 rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-2.5", progress !== null && "border-brand-500/50")}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFile(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.05] text-ink-400">
          {current?.thumb ? <img src={current.thumb} alt="" className="h-full w-full object-cover" /> : <Icon className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          {progress !== null ? (
            <div className="text-[13px] font-semibold text-ink-100">
              {progress < 1 ? `Uploading ${Math.round(progress * 100)}%` : "Processing…"}
              <div className="mt-1.5 h-1 overflow-hidden rounded bg-white/10">
                <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          ) : value ? (
            <>
              <div className="truncate text-[13px] font-semibold text-ink-100">{value.name ?? current?.name ?? "Selected"}</div>
              <div className="text-[11px] text-ink-400">{current ? `${current.duration ? formatDuration(current.duration) + " · " : ""}${current.width ? `${current.width}×${current.height}` : ""}` : ""}</div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-semibold text-ink-200">{label ?? `Add a ${kind}`}</div>
              <div className="text-[11px] text-ink-400">Drop a file here, upload, or pick from your media</div>
            </>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {progress !== null ? <LoaderCircle className="size-4 animate-spin text-ink-300" /> : null}
          <Button size="sm" variant="secondary" icon={<Upload className="size-3.5" />} onClick={() => input.current?.click()} disabled={progress !== null}>
            {compact ? null : "Upload"}
          </Button>
          {assets.length ? (
            <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
              Library
            </Button>
          ) : null}
          {value ? (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)} aria-label="Remove">
              <X className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <div className="mt-2 text-xs text-red-300">{error}</div> : null}
      {open ? (
        <div className="mt-2 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-white/[0.07] bg-ink-850 p-2 sm:grid-cols-4">
          {assets.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                onChange(a);
                setOpen(false);
              }}
              className={cn("group overflow-hidden rounded-lg border text-left", value?.src === a.src ? "border-brand-500" : "border-white/[0.06] hover:border-white/20")}
            >
              <div className="flex aspect-video items-center justify-center bg-black/40">
                {a.thumb ? <img src={a.thumb} alt="" className="h-full w-full object-cover" /> : <Icon className="size-5 text-ink-400" />}
              </div>
              <div className="truncate px-1.5 py-1 text-[11px] text-ink-300">{a.name}</div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
