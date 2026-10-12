"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { api, formatDuration, type MediaAsset } from "@/lib/api";
import { invalidate, useStatus } from "@/lib/hooks";
import { Field, Section, TextInput } from "@/components/fields/basic";
import { Button, Notice, PageHeader } from "@/components/ui/primitives";

export default function DownloaderPage() {
  const { data } = useStatus();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    setAsset(null);
    try {
      setAsset(await api<MediaAsset>("/api/download", { json: { url } }));
      invalidate("/api/library");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Tool" title="Video Downloader" subtitle="Save a clip from YouTube, TikTok and many other sites into your media library, ready for Split-Screen, Blur or Auto Captions." />
      {data && !data.capabilities.ytdlp ? (
        <Notice tone="warn" className="mb-4">
          The downloader needs <code>yt-dlp</code> on the server. Install it with <code>pip install yt-dlp</code> (the Docker image includes it).
        </Notice>
      ) : null}
      <Section title="Paste a link">
        <Field label="Video URL" hint="Only download videos you own or have permission to reuse.">
          <TextInput value={url} onChange={setUrl} placeholder="https://www.youtube.com/watch?v=…" />
        </Field>
        <Button variant="primary" size="lg" icon={<Download className="size-4" />} loading={busy} onClick={run} disabled={!url.trim()}>
          {busy ? "Downloading…" : "Download to library"}
        </Button>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {asset ? (
          <div className="flex items-center gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
            {asset.thumb ? <img src={asset.thumb} alt="" className="h-16 w-28 rounded-lg object-cover" /> : null}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink-100">{asset.name}</div>
              <div className="text-xs text-ink-400">{formatDuration(asset.duration)} · saved to Media</div>
            </div>
            <Link href="/create/split-screen">
              <Button size="sm" variant="primary">
                Use in Split-Screen
              </Button>
            </Link>
          </div>
        ) : null}
      </Section>
    </div>
  );
}
