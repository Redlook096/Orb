"use client";

import { useState } from "react";
import { AudioLines, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useStoredState } from "@/lib/hooks";
import { VoicePicker } from "@/components/fields/VoicePicker";
import { Field, Section, Slider, TextArea } from "@/components/fields/basic";
import { Button, Notice, PageHeader } from "@/components/ui/primitives";
import type { WordTiming } from "@/remotion/lib/types";

interface Result {
  url: string;
  mp3: string | null;
  duration: number;
  words: WordTiming[];
  warnings: string[];
}

export default function VoiceoverPage() {
  const [text, setText] = useStoredState("orb:vo:text", () => "Nobody believed me when I said my neighbor was hiding something. Then, at 3 AM, I heard the garage door open.");
  const [voice, setVoice] = useStoredState("orb:vo:voice", () => "kokoro:am_adam");
  const [speed, setSpeed] = useStoredState("orb:vo:speed", () => 1.05);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await api<Result>("/api/tts", { json: { text, voice, speed } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Tool" title="AI Voiceover" subtitle="Turn a script into natural narration. Download WAV or MP3, with word timings for captions." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Section title="Script" description={`${text.length} / 5,000 characters`}>
            <TextArea rows={9} value={text} onChange={setText} placeholder="Type or paste what you want read aloud…" />
          </Section>
          <Section title="Voice">
            <VoicePicker value={voice} onChange={setVoice} />
            <Field label="Speed">
              <Slider value={speed} min={0.7} max={1.5} step={0.05} onChange={setSpeed} format={(v) => `${v.toFixed(2)}×`} />
            </Field>
          </Section>
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Section title="Generate">
            <Button variant="primary" size="lg" className="w-full" icon={<AudioLines className="size-4" />} loading={busy} onClick={run} disabled={!text.trim()}>
              {busy ? "Generating…" : "Generate voiceover"}
            </Button>
            {error ? <Notice tone="error">{error}</Notice> : null}
            {result?.warnings.map((w) => (
              <Notice key={w} tone="warn">
                {w}
              </Notice>
            ))}
            {result ? (
              <div className="space-y-3">
                <audio src={result.url} controls autoPlay className="w-full" onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} />
                <div className="max-h-48 overflow-y-auto rounded-xl bg-ink-850 p-3 text-[13.5px] leading-relaxed">
                  {result.words.map((w, i) => (
                    <span key={i} className={time >= w.start && time < w.end + 0.05 ? "rounded bg-brand-500/40 text-white" : time > w.end ? "text-ink-200" : "text-ink-400"}>
                      {w.text}{" "}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {result.mp3 ? (
                    <a href={`${result.mp3}?download=voiceover.mp3`} className="flex-1">
                      <Button className="w-full" icon={<Download className="size-4" />}>
                        MP3
                      </Button>
                    </a>
                  ) : null}
                  <a href={`${result.url}?download=voiceover.wav`} className="flex-1">
                    <Button className="w-full" icon={<Download className="size-4" />}>
                      WAV
                    </Button>
                  </a>
                </div>
                <div className="text-center text-[11.5px] text-ink-400">{result.duration.toFixed(1)} seconds</div>
              </div>
            ) : null}
          </Section>
        </div>
      </div>
    </div>
  );
}
