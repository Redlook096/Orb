"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "../ui/primitives";

export const AiWriter: React.FC<{ kind: string; placeholder: string; onResult: (data: Record<string, unknown>) => void }> = ({ kind, placeholder, onResult }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; setup?: boolean } | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await api<Record<string, unknown>>("/api/ai", { json: { kind, prompt } });
      onResult(data);
      setOpen(false);
    } catch (e) {
      setError({ message: (e as Error).message, setup: e instanceof ApiError && e.status === 503 });
    } finally {
      setBusy(false);
    }
  };
  if (!open)
    return (
      <Button size="sm" variant="secondary" className="whitespace-nowrap" icon={<Sparkles className="size-3.5 text-brand-300" />} onClick={() => setOpen(true)}>
        Write with AI
      </Button>
    );
  return (
    <div className="mb-4 rounded-2xl border border-brand-500/30 bg-brand-500/[0.07] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-brand-200">
          <Sparkles className="size-4" /> Write with AI
        </div>
        <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-ink-400 hover:text-white" aria-label="Close">
          <X className="size-4" />
        </button>
      </div>
      <textarea
        autoFocus
        rows={2}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void run();
        }}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-white/[0.08] bg-ink-900 px-3 py-2 text-sm text-ink-100 outline-none placeholder:text-ink-500 focus:border-brand-500/60"
      />
      {error ? (
        <div className="mt-2 text-xs text-red-300">
          {error.message}{" "}
          {error.setup ? (
            <Link href="/settings" className="font-semibold underline">
              Set up
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-ink-400">Replaces the current content · ⌘↵</span>
        <Button size="sm" variant="primary" loading={busy} onClick={run}>
          {busy ? "Writing…" : "Generate"}
        </Button>
      </div>
    </div>
  );
};
