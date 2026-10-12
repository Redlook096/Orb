"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, LoaderCircle, PencilLine, Trash2, TriangleAlert } from "lucide-react";
import { api, formatBytes, formatDuration, timeAgo } from "@/lib/api";
import { invalidate, useJob } from "@/lib/hooks";
import { frameById } from "@/lib/catalog";
import { PhoneFrame } from "@/components/player/PreviewPlayer";
import { Badge, Button, Notice, ProgressBar } from "@/components/ui/primitives";

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const job = useJob(id);
  const router = useRouter();
  const frame = job ? frameById(job.template) : null;
  const remove = async () => {
    if (!confirm("Delete this video?")) return;
    await api(`/api/jobs/${id}`, { method: "DELETE" });
    invalidate("/api/library");
    router.push("/library");
  };
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10">
      <Link href="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-400 hover:text-ink-100">
        <ArrowLeft className="size-4" /> My videos
      </Link>
      {!job ? (
        <div className="h-96 rounded-3xl shimmer" />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[340px_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[340px]">
            <PhoneFrame>
              {job.status === "done" && job.output ? (
                <video src={job.output.url} controls autoPlay playsInline className="h-full w-full bg-black object-contain" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  {job.status === "error" ? <TriangleAlert className="size-8 text-red-300" /> : <LoaderCircle className="size-8 animate-spin text-brand-300" />}
                  <div className="text-sm font-semibold text-ink-200">{job.status === "error" ? "Render failed" : job.stage}</div>
                  {job.status !== "error" ? <ProgressBar value={job.progress} className="w-full" /> : null}
                </div>
              )}
            </PhoneFrame>
          </div>
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {frame ? <Badge className="text-white" tone="default">{frame.name}</Badge> : null}
              <Badge tone={job.status === "done" ? "good" : job.status === "error" ? "bad" : "brand"}>{job.status}</Badge>
              <span className="text-xs text-ink-400">{timeAgo(job.createdAt)}</span>
            </div>
            <h1 className="font-display text-2xl leading-tight font-black text-white sm:text-3xl">{job.title}</h1>
            {job.output ? (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Resolution", "1080 × 1920"],
                  ["Length", formatDuration(job.output.duration)],
                  ["Size", formatBytes(job.output.size)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/[0.07] bg-ink-900 p-3">
                    <div className="text-[11px] font-semibold text-ink-400 uppercase">{k}</div>
                    <div className="mt-0.5 text-sm font-bold text-ink-100">{v}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {job.error ? (
              <Notice tone="error" className="mt-4">
                {job.error}
              </Notice>
            ) : null}
            {job.warnings?.map((w) => (
              <Notice key={w} tone="warn" className="mt-3">
                {w}
              </Notice>
            ))}
            <div className="mt-6 flex flex-wrap gap-2">
              {job.output ? (
                <a href={`${job.output.url}?download=${encodeURIComponent(`${job.title.slice(0, 60) || "orb-video"}.mp4`)}`}>
                  <Button variant="primary" size="lg" icon={<Download className="size-4" />}>
                    Download MP4
                  </Button>
                </a>
              ) : null}
              {frame ? (
                <Link href={`/create/${frame.slug}`}>
                  <Button size="lg" icon={<PencilLine className="size-4" />}>
                    Open editor
                  </Button>
                </Link>
              ) : null}
              <Button size="lg" variant="danger" icon={<Trash2 className="size-4" />} onClick={remove}>
                Delete
              </Button>
            </div>
            <div className="mt-8 rounded-2xl border border-white/[0.07] bg-ink-900/70 p-5 text-[13px] leading-relaxed text-ink-300">
              <div className="mb-2 font-semibold text-ink-100">Posting tips</div>
              H.264 / AAC at 30 fps, loudness-matched to −14 LUFS, so platforms won&apos;t turn it down. Upload the MP4 directly to TikTok, YouTube Shorts or Instagram Reels; keep the first second as your hook.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
