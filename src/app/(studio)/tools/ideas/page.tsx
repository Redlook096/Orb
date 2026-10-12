"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { frameById } from "@/lib/catalog";
import { Field, Section, TextInput } from "@/components/fields/basic";
import { Badge, Button, Notice, PageHeader } from "@/components/ui/primitives";

interface Idea {
  title: string;
  hook: string;
  format: string;
  why: string;
}

export default function IdeasPage() {
  const [niche, setNiche] = useState("");
  const [busy, setBusy] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState<{ message: string; setup: boolean } | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ ideas: Idea[] }>("/api/ai", { json: { kind: "ideas", prompt: niche } });
      setIdeas(r.ideas);
    } catch (e) {
      setError({ message: (e as Error).message, setup: e instanceof ApiError && e.status === 503 });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Tool" title="Idea Generator" subtitle="Ten faceless video ideas for your niche, each matched to the frame that fits it best." />
      <Section title="Your niche">
        <Field label="Niche, audience or account theme">
          <TextInput value={niche} onChange={setNiche} placeholder="e.g. relationship drama, personal finance for teens, gaming facts" />
        </Field>
        <Button variant="primary" size="lg" icon={<Lightbulb className="size-4" />} loading={busy} onClick={run}>
          {busy ? "Brainstorming…" : "Generate ideas"}
        </Button>
        {error ? (
          <Notice tone={error.setup ? "warn" : "error"}>
            {error.message}{" "}
            {error.setup ? (
              <Link className="font-semibold underline" href="/settings">
                How to enable
              </Link>
            ) : null}
          </Notice>
        ) : null}
      </Section>
      {ideas.length ? (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {ideas.map((idea, i) => {
            const frame = frameById(idea.format);
            return (
              <div key={i} className="flex flex-col rounded-2xl border border-white/[0.07] bg-ink-900/70 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-500">{String(i + 1).padStart(2, "0")}</span>
                  {frame ? (
                    <Badge className="text-white" tone="default">
                      <span className="size-1.5 rounded-full" style={{ background: frame.accent }} /> {frame.name}
                    </Badge>
                  ) : null}
                </div>
                <div className="font-bold text-white">{idea.title}</div>
                <div className="mt-1 text-[13.5px] text-ink-200">“{idea.hook}”</div>
                <div className="mt-2 flex-1 text-[12.5px] text-ink-400">{idea.why}</div>
                {frame ? (
                  <Link href={`/tools/script-writer`} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-300 hover:text-brand-200">
                    Write it <ArrowRight className="size-3.5" />
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
