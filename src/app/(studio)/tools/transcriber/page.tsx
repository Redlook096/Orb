"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { MediaPicker } from "@/components/fields/MediaPicker";
import { Section } from "@/components/fields/basic";
import { Button, Notice, PageHeader } from "@/components/ui/primitives";
import type { WordTiming } from "@/remotion/lib/types";

export default function TranscriberPage() {
  const [clip, setClip] = useState<{ src: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ words: WordTiming[]; srt: string; engine: string } | null>(null);
  const run = async () => {
    if (!clip) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api("/api/transcribe", { json: { src: clip.src } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.srt], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clip?.name ?? "captions"}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Tool" title="Transcriber" subtitle="Word-level transcripts and SRT subtitles from any video or audio file." />
      <Section title="Choose a file">
        <MediaPicker kind="video" value={clip} onChange={(a) => setClip(a ? { src: a.src, name: a.name } : null)} />
        <Button variant="primary" size="lg" icon={<FileText className="size-4" />} loading={busy} onClick={run} disabled={!clip}>
          {busy ? "Transcribing…" : "Transcribe"}
        </Button>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Section>
      {result ? (
        <div className="mt-4">
          <Section
            title={`Transcript · ${result.words.length} words`}
            description={`Engine: ${result.engine}`}
            actions={
              <Button size="sm" icon={<Download className="size-3.5" />} onClick={download}>
                SRT
              </Button>
            }
          >
            <p className="max-h-96 overflow-y-auto rounded-xl bg-ink-850 p-4 text-[14px] leading-relaxed text-ink-100">{result.words.map((w) => w.text).join(" ")}</p>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
