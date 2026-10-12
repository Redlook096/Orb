import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FRAMES } from "@/lib/catalog";
import { PageHeader } from "@/components/ui/primitives";

const BASICS = [
  { n: "1", title: "Pick a frame", body: "Each frame is a proven format: stories, chats, games or your own clips." },
  { n: "2", title: "Add your inputs", body: "Write or paste content, or let Claude write it. Everything previews live." },
  { n: "3", title: "Voice, gameplay, captions", body: "Choose a narrator, a background and a caption style. Preview with voice for exact timing." },
  { n: "4", title: "Generate & post", body: "Orb renders a 1080×1920 MP4, mastered for TikTok, Shorts and Reels." },
];

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Learn" title="Guides" subtitle="How each frame works, what makes it perform, and what the finished result looks like." />
      <div className="mb-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BASICS.map((b) => (
          <div key={b.n} className="rounded-2xl border border-white/[0.07] bg-ink-900/70 p-5">
            <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-brand-500/20 font-display text-sm font-black text-brand-300">{b.n}</div>
            <div className="font-bold text-white">{b.title}</div>
            <div className="mt-1 text-[13px] text-ink-400">{b.body}</div>
          </div>
        ))}
      </div>
      <h2 className="mb-4 text-[13px] font-bold tracking-[0.14em] text-ink-400 uppercase">Frame guides</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {FRAMES.map((f) => (
          <Link key={f.id} href={`/guides/${f.slug}`} className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-ink-900/70 p-4 transition hover:border-white/15">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white" style={{ background: `linear-gradient(135deg, ${f.accent}, ${f.accent}88)` }}>
              {f.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white">{f.name}</div>
              <div className="truncate text-[13px] text-ink-400">{f.description}</div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-ink-500 transition group-hover:translate-x-0.5 group-hover:text-ink-200" />
          </Link>
        ))}
      </div>
    </div>
  );
}
