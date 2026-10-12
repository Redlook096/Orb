"use client";

import { CheckCircle2, CircleDashed } from "lucide-react";
import { useStatus } from "@/lib/hooks";
import type { Capabilities } from "@/lib/api";
import { PageHeader } from "@/components/ui/primitives";

const ROWS: { key: keyof Capabilities; name: string; what: string; how: string }[] = [
  { key: "kokoro", name: "Kokoro voices (local)", what: "24 natural neural voices with phoneme-accurate caption timing. Free, runs on your server.", how: "npm run setup:voices" },
  { key: "elevenlabs", name: "ElevenLabs", what: "Premium voices, including your cloned voices, with character-level timestamps.", how: "ELEVENLABS_API_KEY=…" },
  { key: "openai", name: "OpenAI", what: "OpenAI voices, plus Whisper transcription for Auto Captions and Split-Screen.", how: "OPENAI_API_KEY=…" },
  { key: "anthropic", name: "Claude (AI writing)", what: "Script Writer, Idea Generator and every 'Write with AI' button.", how: "ANTHROPIC_API_KEY=…" },
  { key: "localWhisper", name: "Local Whisper", what: "Offline transcription for captions when no OpenAI key is set.", how: "pip install faster-whisper" },
  { key: "espeak", name: "eSpeak NG", what: "Lightweight robotic fallback voice that always works.", how: "apt install espeak-ng" },
  { key: "ytdlp", name: "yt-dlp", what: "Powers the Video Downloader.", how: "pip install yt-dlp" },
  { key: "ffmpeg", name: "FFmpeg", what: "Required for uploads, mastering and transcription.", how: "apt install ffmpeg" },
];

export default function SettingsPage() {
  const { data } = useStatus();
  const caps = data?.capabilities;
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Settings" title="Engines & keys" subtitle="Orb works offline with Kokoro voices. Add keys to the server's .env to unlock more voices, transcription and AI writing, then restart." />
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/70">
        {ROWS.map((r) => {
          const on = caps?.[r.key];
          return (
            <div key={r.key} className="flex items-start gap-4 p-4">
              {on ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-ink-500" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{r.name}</span>
                  <span className={on ? "text-xs font-semibold text-emerald-300" : "text-xs font-semibold text-ink-500"}>{caps ? (on ? "Active" : "Not configured") : "…"}</span>
                </div>
                <div className="mt-0.5 text-[13px] text-ink-400">{r.what}</div>
              </div>
              {!on ? <code className="shrink-0 rounded-lg bg-ink-850 px-2 py-1 text-[11.5px] text-ink-200">{r.how}</code> : null}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-[13px] leading-relaxed text-ink-400">
        Rendering uses Remotion with headless Chrome at 1080×1920, 30 fps, H.264 CRF 18 with AAC 192 kbps, then masters the mix to −14 LUFS. Set <code className="text-ink-200">RENDER_CONCURRENCY</code> to tune speed versus CPU load.
      </p>
    </div>
  );
}
