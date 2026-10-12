"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, PenLine } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { INCOMING_KEY } from "@/lib/ai-apply";
import { FRAMES } from "@/lib/catalog";
import { Field, Section, Segmented, TextArea } from "@/components/fields/basic";
import { Button, Notice, PageHeader } from "@/components/ui/primitives";

type Kind = "reddit" | "fake-texts" | "twitter" | "chatgpt" | "would-you-rather" | "quiz" | "script";

const KINDS: { value: Kind; label: string }[] = [
  { value: "reddit", label: "Reddit story" },
  { value: "fake-texts", label: "Text chat" },
  { value: "twitter", label: "Thread" },
  { value: "chatgpt", label: "AI chat" },
  { value: "would-you-rather", label: "WYR" },
  { value: "quiz", label: "Quiz" },
  { value: "script", label: "Voiceover" },
];

const preview = (kind: Kind, d: Record<string, unknown>): string => {
  const list = <T,>(k: string) => (d[k] as T[]) ?? [];
  switch (kind) {
    case "reddit":
      return `r/${d.subreddit} · u/${d.username}\n\n${d.title}\n\n${d.body}`;
    case "fake-texts":
      return `Chat with ${d.contactName}\n\n` + list<{ from: string; text: string }>("messages").map((m) => `${m.from === "me" ? "Me" : d.contactName}: ${m.text}`).join("\n");
    case "twitter":
      return `${d.name} (@${d.handle})\n\n` + list<{ text: string }>("tweets").map((t, i) => `${i + 1}. ${t.text}`).join("\n\n");
    case "chatgpt":
      return list<{ role: string; text: string }>("messages").map((m) => `${m.role === "user" ? "You" : "AI"}: ${m.text}`).join("\n\n");
    case "would-you-rather":
      return list<{ a: string; b: string; aEmoji: string; bEmoji: string; percentA: number }>("questions").map((q, i) => `${i + 1}. ${q.aEmoji} ${q.a}  vs  ${q.bEmoji} ${q.b}  (${q.percentA}% / ${100 - q.percentA}%)`).join("\n");
    case "quiz":
      return `${d.title}\n\n` + list<{ question: string; options: string[]; answer: number }>("questions").map((q, i) => `${i + 1}. ${q.question}\n   ${q.options.map((o, j) => `${j === q.answer ? "✓" : "·"} ${o}`).join("   ")}`).join("\n\n");
    case "script":
      return `${d.script}\n\n— ${d.cta}`;
  }
};

export default function ScriptWriterPage() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("reddit");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; setup: boolean } | null>(null);
  const [result, setResult] = useState<{ kind: Kind; data: Record<string, unknown> } | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await api<Record<string, unknown>>("/api/ai", { json: { kind, prompt } });
      setResult({ kind, data });
    } catch (e) {
      setError({ message: (e as Error).message, setup: e instanceof ApiError && e.status === 503 });
    } finally {
      setBusy(false);
    }
  };
  const open = () => {
    if (!result || result.kind === "script") return;
    localStorage.setItem(INCOMING_KEY(result.kind), JSON.stringify(result.data));
    router.push(`/create/${FRAMES.find((f) => f.id === result.kind)?.slug ?? result.kind}`);
  };
  const text = result ? preview(result.kind, result.data) : "";
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10">
      <PageHeader eyebrow="Tool" title="Script Writer" subtitle="Claude writes the story, chat, thread or quiz. Send it straight into a frame, or copy the voiceover script." />
      <div className="space-y-4">
        <Section title="What are we making?">
          <Segmented value={kind} onChange={setKind} options={KINDS} className="flex-wrap" />
          <Field label="Topic or direction">
            <TextArea rows={3} value={prompt} onChange={setPrompt} placeholder="e.g. a wedding guest who exposes the groom during the speech" />
          </Field>
          <Button variant="primary" size="lg" icon={<PenLine className="size-4" />} loading={busy} onClick={run}>
            {busy ? "Writing…" : "Write it"}
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
        {result ? (
          <Section
            title="Result"
            actions={
              <div className="flex gap-2">
                <Button size="sm" icon={<Copy className="size-3.5" />} onClick={() => navigator.clipboard.writeText(text)}>
                  Copy
                </Button>
                {result.kind !== "script" ? (
                  <Button size="sm" variant="primary" onClick={open}>
                    Open in editor <ArrowRight className="size-3.5" />
                  </Button>
                ) : (
                  <Link href="/tools/voiceover">
                    <Button size="sm" variant="primary" onClick={() => localStorage.setItem("orb:vo:text", JSON.stringify(String(result.data.script)))}>
                      Make voiceover <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            }
          >
            <pre className="max-h-[520px] overflow-y-auto rounded-xl bg-ink-850 p-4 font-sans text-[14px] leading-relaxed whitespace-pre-wrap text-ink-100">{text}</pre>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
