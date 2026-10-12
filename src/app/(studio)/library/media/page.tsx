"use client";

import { useRef, useState } from "react";
import { Film, ImageIcon, Music, Trash2, Upload } from "lucide-react";
import { api, formatBytes, formatDuration, timeAgo, uploadFile, type MediaAsset } from "@/lib/api";
import { invalidate, useLibrary } from "@/lib/hooks";
import { Button, Empty, Notice, PageHeader, cn } from "@/components/ui/primitives";

export default function MediaPage() {
  const { data, reload } = useLibrary();
  const [tab, setTab] = useState<"all" | MediaAsset["kind"]>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const assets = (data?.uploads ?? []).filter((a) => tab === "all" || a.kind === tab);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    for (const f of Array.from(files)) {
      setBusy(`Uploading ${f.name}…`);
      try {
        await uploadFile(f, (p) => setBusy(p < 1 ? `Uploading ${f.name} · ${Math.round(p * 100)}%` : `Processing ${f.name}…`));
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setBusy(null);
    invalidate("/api/library");
    void reload();
  };
  const remove = async (a: MediaAsset) => {
    if (!confirm(`Delete "${a.name}"? Projects using it will lose the file.`)) return;
    await api(`/api/library/${a.id}`, { method: "DELETE" });
    invalidate("/api/library");
    void reload();
  };
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
      <input ref={input} type="file" multiple accept="video/*,image/*,audio/*,.mov,.mkv" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <PageHeader
        eyebrow="Library"
        title="Media"
        subtitle="Clips, gameplay, images and audio you can use in any frame. Videos are converted to H.264 for smooth previews."
        actions={
          <Button variant="primary" icon={<Upload className="size-4" />} onClick={() => input.current?.click()} loading={Boolean(busy)}>
            Upload
          </Button>
        }
      />
      {busy ? <Notice className="mb-4">{busy}</Notice> : null}
      {error ? <Notice tone="error" className="mb-4">{error}</Notice> : null}
      <div className="mb-5 flex gap-1">
        {(["all", "video", "image", "audio"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-lg px-3 py-1.5 text-[13px] font-semibold capitalize", tab === t ? "bg-white/10 text-white" : "text-ink-400 hover:text-ink-200")}>
            {t}
          </button>
        ))}
      </div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
      >
        {data && assets.length === 0 ? (
          <Empty icon={<Upload className="size-6" />} title="Drop files here" body="Upload gameplay recordings, podcast clips, photos for avatars, or your own music." action={<Button onClick={() => input.current?.click()}>Choose files</Button>} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {assets.map((a) => {
              const Icon = a.kind === "video" ? Film : a.kind === "image" ? ImageIcon : Music;
              return (
                <div key={a.id} className="group overflow-hidden rounded-xl border border-white/[0.07] bg-ink-900">
                  <div className="relative flex aspect-video items-center justify-center bg-black/50">
                    {a.thumb ? <img src={a.thumb} alt="" className="h-full w-full object-cover" /> : <Icon className="size-7 text-ink-400" />}
                    {a.duration ? <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 font-mono text-[10.5px] text-white">{formatDuration(a.duration)}</span> : null}
                    <button onClick={() => remove(a)} className="absolute top-1.5 right-1.5 rounded-md bg-black/60 p-1.5 text-ink-200 opacity-0 transition group-hover:opacity-100 hover:text-red-300" aria-label="Delete">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <div className="truncate text-[13px] font-semibold text-ink-100">{a.name}</div>
                    <div className="text-[11px] text-ink-400">
                      {a.kind} · {formatBytes(a.size)} · {timeAgo(a.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
