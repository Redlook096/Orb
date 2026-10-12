"use client";

import Link from "next/link";
import { Film, LoaderCircle, TriangleAlert } from "lucide-react";
import { useLibrary } from "@/lib/hooks";
import { formatDuration, timeAgo, type JobSummary } from "@/lib/api";
import { frameById } from "@/lib/catalog";
import { Empty, ProgressBar } from "./ui/primitives";

export const VideoTile: React.FC<{ job: JobSummary }> = ({ job }) => {
  const frame = frameById(job.template);
  const busy = ["queued", "preparing", "rendering"].includes(job.status);
  return (
    <Link href={`/videos/${job.id}`} className="group block">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-white/[0.07] bg-ink-850">
        {job.output?.thumb ? <img src={job.output.thumb} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}
        {busy ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 p-4">
            <LoaderCircle className="size-6 animate-spin text-brand-300" />
            <div className="text-xs font-semibold text-ink-200">{job.stage}</div>
            <ProgressBar value={job.progress} className="w-full" />
          </div>
        ) : null}
        {job.status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-950/40 p-4 text-center text-xs text-red-200">
            <TriangleAlert className="size-5" /> Failed
          </div>
        ) : null}
        {job.output ? <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10.5px] text-white">{formatDuration(job.output.duration)}</div> : null}
        <div className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: `${frame?.accent ?? "#666"}cc` }}>
          {frame?.name ?? job.template}
        </div>
      </div>
      <div className="mt-2 line-clamp-2 text-[13px] font-semibold text-ink-100">{job.title}</div>
      <div className="text-[11.5px] text-ink-400">{timeAgo(job.createdAt)}</div>
    </Link>
  );
};

export const RecentVideos: React.FC<{ limit?: number }> = ({ limit }) => {
  const { data } = useLibrary();
  const jobs = (data?.renders ?? []).filter((j) => j.status !== "canceled").slice(0, limit);
  if (!data) return <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[9/16] rounded-xl shimmer" />)}</div>;
  if (!jobs.length) return <Empty icon={<Film className="size-6" />} title="No videos yet" body="Pick a frame, generate, and your videos will show up here." />;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {jobs.map((j) => (
        <VideoTile key={j.id} job={j} />
      ))}
    </div>
  );
};
