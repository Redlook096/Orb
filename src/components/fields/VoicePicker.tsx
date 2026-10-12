"use client";

import { useMemo, useState } from "react";
import { Check, LoaderCircle, Lock, Play, Square } from "lucide-react";
import { useVoices, playPreview, stopPreview } from "@/lib/hooks";
import { api, type Voice } from "@/lib/api";
import { cn } from "../ui/primitives";

const PROVIDER_LABEL: Record<Voice["provider"], string> = {
  elevenlabs: "ElevenLabs",
  kokoro: "Kokoro · local neural",
  openai: "OpenAI",
  espeak: "eSpeak · classic",
};

const sampleCache = new Map<string, string>();

export const VoicePicker: React.FC<{ value: string; onChange: (v: string) => void; compact?: boolean }> = ({ value, onChange, compact }) => {
  const { data, error } = useVoices();
  const [filter, setFilter] = useState<"all" | "male" | "female">("all");
  const [playing, setPlaying] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const voices = useMemo(() => (data?.voices ?? []).filter((v) => filter === "all" || v.gender === filter), [data, filter]);
  const groups = useMemo(() => {
    const order: Voice["provider"][] = ["elevenlabs", "kokoro", "openai", "espeak"];
    return order.map((p) => ({ p, list: voices.filter((v) => v.provider === p) })).filter((g) => g.list.length);
  }, [voices]);
  const selected = data?.voices.find((v) => v.id === value);

  const preview = async (v: Voice) => {
    if (playing === v.id) {
      stopPreview();
      setPlaying(null);
      return;
    }
    let src = sampleCache.get(v.id);
    if (!src) {
      setLoadingId(v.id);
      try {
        const r = await api<{ url: string }>("/api/tts", { json: { text: `Hey, I'm ${v.name}. You won't believe what happened to me last week.`, voice: v.id, speed: 1.05 } });
        src = r.url;
        sampleCache.set(v.id, src);
      } catch {
        setLoadingId(null);
        return;
      }
      setLoadingId(null);
    }
    setPlaying(v.id);
    playPreview(src, () => setPlaying((p) => (p === v.id ? null : p)));
  };

  if (error) return <div className="text-sm text-red-300">Could not load voices: {error}</div>;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs text-ink-400">
          Selected: <span className="font-semibold text-ink-100">{selected ? `${selected.name}` : value}</span>
          {selected && !selected.available ? <span className="ml-1 text-amber-300">(unavailable, will substitute)</span> : null}
        </div>
        <div className="flex gap-1">
          {(["all", "male", "female"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={cn("rounded-md px-2 py-1 text-[11px] font-semibold capitalize", filter === f ? "bg-white/10 text-white" : "text-ink-400 hover:text-ink-200")}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className={cn("space-y-3 overflow-y-auto pr-1", compact ? "max-h-64" : "max-h-80")}>
        {!data ? <div className="h-24 rounded-xl shimmer" /> : null}
        {groups.map((g) => (
          <div key={g.p}>
            <div className="mb-1.5 text-[10.5px] font-bold tracking-[0.14em] text-ink-500 uppercase">{PROVIDER_LABEL[g.p]}</div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {g.list.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition",
                    value === v.id ? "border-brand-500/60 bg-brand-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]",
                    !v.available && "opacity-55",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => v.available && preview(v)}
                    disabled={!v.available}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-ink-100 hover:bg-white/[0.14] disabled:cursor-not-allowed"
                    aria-label={`Preview ${v.name}`}
                  >
                    {loadingId === v.id ? <LoaderCircle className="size-3.5 animate-spin" /> : !v.available ? <Lock className="size-3.5" /> : playing === v.id ? <Square className="size-3" fill="currentColor" /> : <Play className="size-3.5" fill="currentColor" />}
                  </button>
                  <button type="button" onClick={() => onChange(v.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-100">
                      {v.name}
                      <span className={cn("rounded px-1 text-[10px] font-bold", v.gender === "female" ? "bg-pink-500/15 text-pink-300" : "bg-sky-500/15 text-sky-300")}>{v.gender === "female" ? "F" : "M"}</span>
                    </div>
                    <div className="truncate text-[11px] text-ink-400">
                      {v.available ? `${v.accent ? `${v.accent} · ` : ""}${v.style}` : "Add an API key in Settings"}
                    </div>
                  </button>
                  {value === v.id ? <Check className="size-4 shrink-0 text-brand-300" /> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
