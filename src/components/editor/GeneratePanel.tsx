"use client";

import Link from "next/link";
import { CheckCircle2, Download, LoaderCircle, RotateCcw, Sparkles, TriangleAlert, Volume2, X } from "lucide-react";
import type { JobSummary } from "@/lib/api";
import { formatBytes, formatDuration } from "@/lib/api";
import { Button, Notice, ProgressBar } from "../ui/primitives";

export const GeneratePanel: React.FC<{
  previewState: "estimate" | "preparing" | "ready" | "stale";
  previewError: string | null;
  warnings: string[];
  onPreview: () => void;
  onGenerate: () => void;
  job: JobSummary | null;
  starting: boolean;
  onCancel: () => void;
  onClearJob: () => void;
  needsVoice: boolean;
  /** Clip frames transcribe instead of synthesizing a voice. */
  clipMode?: boolean;
}> = ({ previewState, previewError, warnings, onPreview, onGenerate, job, starting, onCancel, onClearJob, needsVoice, clipMode }) => {
  const busyLabel = clipMode ? "Transcribing…" : "Generating voice…";
  const readyLabel = clipMode ? "Previewing exact captions" : "Previewing with voice";
  const idleLabel = clipMode ? "Preview captions" : "Preview with voice";
  const active = job && ["queued", "preparing", "rendering"].includes(job.status);
  return (
    <div className="space-y-3">
      {!job || job.status === "canceled" ? (
        <>
          <Button variant="primary" size="lg" className="w-full" icon={<Sparkles className="size-4" />} onClick={onGenerate} loading={starting}>
            Generate video
          </Button>
          {needsVoice ? (
            <Button variant="secondary" size="md" className="w-full" icon={previewState === "preparing" ? undefined : <Volume2 className="size-4" />} loading={previewState === "preparing"} onClick={onPreview} disabled={previewState === "ready"}>
              {previewState === "preparing" ? busyLabel : previewState === "ready" ? readyLabel : idleLabel}
            </Button>
          ) : null}
          <p className="text-center text-[11.5px] text-ink-400">
            {previewState === "ready"
              ? clipMode
                ? "Captions from the clip's transcript."
                : "Exact timing with real narration."
              : clipMode
                ? "Captions are transcribed when you preview or generate."
                : needsVoice
                  ? "Live preview estimates voice timing until you preview with voice."
                  : "Live preview updates as you edit."}
          </p>
        </>
      ) : null}
      {previewError ? <Notice tone="error">{previewError}</Notice> : null}
      {warnings.map((w) => (
        <Notice key={w} tone="warn">
          {w}
        </Notice>
      ))}
      {active ? (
        <div className="rounded-2xl border border-white/[0.08] bg-ink-850 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold text-ink-100">
              <LoaderCircle className="size-4 animate-spin text-brand-300" />
              {job.status === "queued" ? (job.queuePosition && job.queuePosition > 0 ? `Queued (#${job.queuePosition + 1})` : "Starting…") : job.stage}
            </span>
            <span className="font-mono text-xs text-ink-300">{Math.round(job.progress * 100)}%</span>
          </div>
          <ProgressBar value={job.progress} />
          <div className="mt-3 flex justify-between">
            <span className="text-[11.5px] text-ink-400">You can keep editing or leave; it continues in My Videos.</span>
            <button type="button" onClick={onCancel} className="text-[12px] font-semibold text-ink-300 hover:text-red-300">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {job?.status === "done" && job.output ? (
        <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06]">
          <div className="flex items-center justify-between px-4 pt-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <CheckCircle2 className="size-4" /> Video ready
            </span>
            <button type="button" onClick={onClearJob} className="rounded p-1 text-ink-400 hover:text-white" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
          <div className="px-4 pt-1 pb-3 text-[11.5px] text-ink-400">
            1080×1920 · {formatDuration(job.output.duration)} · {formatBytes(job.output.size)}
          </div>
          <div className="flex gap-2 px-4 pb-4">
            <a href={`${job.output.url}?download=${encodeURIComponent(`${job.title.slice(0, 60) || "orb-video"}.mp4`)}`} className="flex-1">
              <Button variant="primary" className="w-full" icon={<Download className="size-4" />}>
                Download MP4
              </Button>
            </a>
            <Link href={`/videos/${job.id}`}>
              <Button variant="secondary">Open</Button>
            </Link>
          </div>
        </div>
      ) : null}
      {job?.status === "error" ? (
        <Notice tone="error">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Render failed</div>
              <div className="mt-0.5 text-xs break-words opacity-90">{job.error}</div>
              <button type="button" onClick={onClearJob} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline">
                <RotateCcw className="size-3" /> Try again
              </button>
            </div>
          </div>
        </Notice>
      ) : null}
    </div>
  );
};
