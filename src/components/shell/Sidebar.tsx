"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Film, FolderOpen, House, Plus, Settings } from "lucide-react";
import { FRAMES, TOOLS } from "@/lib/catalog";
import { FRAME_ICONS, TOOL_ICONS } from "../ui/icons";
import { cn } from "../ui/primitives";
import { Logo } from "./Logo";
import { useStatus } from "@/lib/hooks";

const Item: React.FC<{ href: string; label: string; icon: React.ReactNode; active: boolean; onNavigate?: () => void; trailing?: React.ReactNode }> = ({ href, label, icon, active, onNavigate, trailing }) => (
  <Link
    href={href}
    onClick={onNavigate}
    className={cn(
      "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
      active ? "bg-white/[0.07] text-white" : "text-ink-300 hover:bg-white/[0.04] hover:text-ink-100",
    )}
  >
    {active ? <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-brand-400" /> : null}
    <span className={cn("flex size-[18px] items-center justify-center", active ? "text-white" : "text-ink-400 group-hover:text-ink-200")}>{icon}</span>
    <span className="truncate">{label}</span>
    {trailing ? <span className="ml-auto">{trailing}</span> : null}
  </Link>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-5">
    <div className="mb-1.5 px-3 text-[10.5px] font-bold tracking-[0.16em] text-ink-500 uppercase">{title}</div>
    <div className="flex flex-col gap-0.5">{children}</div>
  </div>
);

export const Sidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const path = usePathname();
  const { data } = useStatus();
  const caps = data?.capabilities;
  const is = (href: string, exact = false) => (exact ? path === href : path === href || path.startsWith(`${href}/`));
  const voiceEngine = caps ? (caps.elevenlabs ? "ElevenLabs" : caps.kokoro ? "Kokoro (local)" : caps.openai ? "OpenAI" : caps.espeak ? "eSpeak" : "None") : "…";
  return (
    <nav className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-4">
        <Link href="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <div className="px-3">
        <Link
          href="/create"
          onClick={onNavigate}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_rgb(139_92_246/0.9)] transition hover:brightness-110"
        >
          <Plus className="size-4" strokeWidth={2.5} /> Create video
        </Link>
      </div>
      <div className="mt-2 flex-1 overflow-y-auto px-3 pb-4">
        <Section title="Workspace">
          <Item href="/" label="Home" icon={<House className="size-4" />} active={is("/", true)} onNavigate={onNavigate} />
          <Item href="/library" label="My Videos" icon={<Film className="size-4" />} active={is("/library", true) || is("/videos")} onNavigate={onNavigate} />
          <Item href="/library/media" label="Media" icon={<FolderOpen className="size-4" />} active={is("/library/media")} onNavigate={onNavigate} />
        </Section>
        <Section title="Frames">
          {FRAMES.filter((f) => f.id !== "captions").map((f) => {
            const Icon = FRAME_ICONS[f.id];
            return (
              <Item
                key={f.id}
                href={`/create/${f.slug}`}
                label={f.name}
                icon={
                  <span className="flex size-[18px] items-center justify-center rounded-[5px]" style={{ background: `${f.accent}22`, color: f.accent }}>
                    <Icon className="size-3" strokeWidth={2.5} />
                  </span>
                }
                active={is(`/create/${f.slug}`)}
                onNavigate={onNavigate}
              />
            );
          })}
        </Section>
        <Section title="Tools">
          {TOOLS.map((t) => {
            const Icon = TOOL_ICONS[t.icon];
            return <Item key={t.slug} href={t.href} label={t.name} icon={<Icon className="size-4" />} active={is(t.href)} onNavigate={onNavigate} />;
          })}
        </Section>
        <Section title="Learn">
          <Item href="/guides" label="Guides" icon={<BookOpen className="size-4" />} active={is("/guides")} onNavigate={onNavigate} />
        </Section>
      </div>
      <div className="border-t border-white/[0.06] p-3">
        <Link href="/settings" onClick={onNavigate} className="block rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">Engines</span>
            <Settings className="size-3.5 text-ink-400" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-ink-200">
            <span className={cn("size-1.5 rounded-full", caps && voiceEngine !== "None" ? "bg-emerald-400" : "bg-amber-400")} />
            Voice: {voiceEngine}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-ink-200">
            <span className={cn("size-1.5 rounded-full", caps?.anthropic ? "bg-emerald-400" : "bg-ink-500")} />
            AI writing: {caps ? (caps.anthropic ? "Claude" : "Off") : "…"}
          </div>
        </Link>
      </div>
    </nav>
  );
};
