import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { FrameGrid, ToolGrid } from "@/components/gallery";
import { RecentVideos } from "@/components/RecentVideos";
import { FRAMES } from "@/lib/catalog";

export default function Home() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
      <section className="relative mb-12 overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-900 px-6 py-10 sm:px-10 sm:py-14">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -top-24 -right-24 size-[420px] rounded-full bg-brand-600/30 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-[360px] rounded-full bg-cyan-500/15 blur-[110px]" />
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-ink-200">
            <Sparkles className="size-3.5 text-brand-300" /> AI voices · animated captions · 1080p exports
          </div>
          <h1 className="font-display text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">
            Viral shorts,
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">made in minutes.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink-300">
            Reddit stories, fake texts, split-screen, quizzes and more. Pick a frame, add your script, choose a voice and gameplay, and Orb renders a ready-to-post vertical video.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/create/reddit" className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 px-6 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgb(139_92_246/0.9)] hover:brightness-110">
              Start with a Reddit story <ArrowRight className="size-4" />
            </Link>
            <Link href="/guides" className="inline-flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.04] px-6 text-[15px] font-semibold text-ink-100 hover:bg-white/[0.08]">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-black text-white">Pick a frame</h2>
          <p className="text-[13.5px] text-ink-400">Hover a card to watch an example result.</p>
        </div>
        <Link href="/create" className="text-sm font-semibold text-brand-300 hover:text-brand-200">
          All frames →
        </Link>
      </div>
      <FrameGrid frames={FRAMES.filter((f) => f.id !== "captions" && f.id !== "blur")} />

      <div className="mt-14 mb-5">
        <h2 className="font-display text-2xl font-black text-white">Tools</h2>
        <p className="text-[13.5px] text-ink-400">Everything around the edit: voices, captions, scripts and clips.</p>
      </div>
      <ToolGrid />

      <div className="mt-14 mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-black text-white">Recent videos</h2>
        </div>
        <Link href="/library" className="text-sm font-semibold text-brand-300 hover:text-brand-200">
          My videos →
        </Link>
      </div>
      <RecentVideos limit={6} />
    </div>
  );
}
