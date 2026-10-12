import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { FRAMES, frameById } from "@/lib/catalog";
import { GuidePreview } from "./GuidePreview";

export const generateStaticParams = () => FRAMES.map((f) => ({ slug: f.slug }));

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const frame = frameById((await params).slug);
  if (!frame) notFound();
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10">
      <Link href="/guides" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-400 hover:text-ink-100">
        <ArrowLeft className="size-4" /> Guides
      </Link>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="mb-2 text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: frame.accent }}>
            Guide · {frame.category}
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-white">{frame.name}</h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-300">{frame.description}</p>
          <ol className="mt-8 space-y-0">
            {frame.steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 pb-7">
                {i < frame.steps.length - 1 ? <span className="absolute top-9 bottom-0 left-[17px] w-px bg-white/10" /> : null}
                <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-ink-850 font-display text-sm font-black text-white">{i + 1}</span>
                <div className="pt-1.5">
                  <div className="font-bold text-white">{s.title}</div>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
              <Lightbulb className="size-4" /> Tips for better results
            </div>
            <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-ink-200">
              {frame.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <Link
            href={`/create/${frame.slug}`}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 px-6 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgb(139_92_246/0.9)] hover:brightness-110"
          >
            Make a {frame.name} video <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-3 text-[12px] font-bold tracking-[0.14em] text-ink-400 uppercase">Example result</div>
          <GuidePreview template={frame.id} />
          <p className="mt-3 text-center text-[12px] text-ink-400">Live render of the example project. Press play.</p>
        </div>
      </div>
    </div>
  );
}
