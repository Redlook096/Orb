"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, RotateCcw } from "lucide-react";
import { TEMPLATE_META } from "@/remotion/registry";
import type { BaseTimeline, BackgroundSpec, CaptionSettings, MusicSpec, TemplateId } from "@/remotion/lib/types";
import { frameById } from "@/lib/catalog";
import { api, type JobSummary } from "@/lib/api";
import { useJob, useStoredState } from "@/lib/hooks";
import { applyGenerated, INCOMING_KEY } from "@/lib/ai-apply";
import { PhoneFrame, PreviewPlayer } from "../player/PreviewPlayer";
import { Section, Field, Slider } from "../fields/basic";
import { VoicePicker } from "../fields/VoicePicker";
import { BackgroundPicker } from "../fields/BackgroundPicker";
import { MusicPicker } from "../fields/MusicPicker";
import { CaptionPicker } from "../fields/CaptionPicker";
import { Button, cn } from "../ui/primitives";
import { AiWriter } from "./AiWriter";
import { GeneratePanel } from "./GeneratePanel";
import { RedditForm } from "./forms/RedditForm";
import { FakeTextsForm } from "./forms/FakeTextsForm";
import { ClipForm } from "./forms/ClipForm";
import { TwitterForm } from "./forms/TwitterForm";
import { ChatGPTForm } from "./forms/ChatGPTForm";
import { WyrForm } from "./forms/WyrForm";
import { QuizForm } from "./forms/QuizForm";

type Input = Record<string, unknown> & { background: BackgroundSpec; music: MusicSpec; captions: CaptionSettings };

const VOICE_FIELDS: Partial<Record<TemplateId, { key: string; label: string }[]>> = {
  reddit: [{ key: "voice", label: "Narrator" }],
  twitter: [{ key: "voice", label: "Narrator" }],
  "would-you-rather": [{ key: "voice", label: "Narrator" }],
  quiz: [{ key: "voice", label: "Host" }],
  "fake-texts": [
    { key: "meVoice", label: "Your voice (Me)" },
    { key: "themVoice", label: "Contact's voice" },
  ],
  chatgpt: [
    { key: "userVoice", label: "User voice" },
    { key: "assistantVoice", label: "Assistant voice" },
  ],
};

const AI_PLACEHOLDER: Partial<Record<TemplateId, string>> = {
  reddit: "e.g. a petty revenge story about a roommate who steals food",
  "fake-texts": "e.g. a kid convincing their dad they need a $2,000 gaming PC",
  twitter: "e.g. how a teenager made $50k reselling sneakers",
  chatgpt: "e.g. asking AI whether it's okay to ghost a wedding",
  "would-you-rather": "e.g. superpowers, food, money dilemmas",
  quiz: "e.g. geography questions most people get wrong",
};

const NUM = ["①", "②", "③", "④", "⑤", "⑥"];

export const Editor: React.FC<{ template: TemplateId }> = ({ template }) => {
  const meta = TEMPLATE_META[template];
  const frame = frameById(template)!;
  const [input, setInput] = useStoredState<Input>(`orb:draft:${template}`, () => meta.defaults() as Input);
  const set = useCallback((patch: Partial<Input>) => setInput((prev) => ({ ...prev, ...patch })), [setInput]);

  // Content handed over from Script Writer / Idea Generator.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(INCOMING_KEY(template));
      if (raw) {
        localStorage.removeItem(INCOMING_KEY(template));
        const data = JSON.parse(raw) as Record<string, unknown>;
        setInput((prev) => applyGenerated(template, data, prev) as Input);
      }
    } catch {
      /* ignore malformed hand-off */
    }
  }, [template, setInput]);

  // Exact preview with real narration.
  const [prepared, setPrepared] = useState<{ key: string; input: Input; timeline: BaseTimeline } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const key = useMemo(() => JSON.stringify(input), [input]);
  const fresh = prepared && prepared.key === key ? prepared : null;
  const previewState = preparing ? "preparing" : fresh ? "ready" : prepared ? "stale" : "estimate";

  const preview = async () => {
    setPreparing(true);
    setPreviewError(null);
    try {
      const r = await api<{ input: Input; timeline: BaseTimeline; warnings: string[] }>("/api/prepare", { json: { template, input } });
      // Keep a fresh transcript in the project so later previews and renders skip transcription.
      const gotTranscript = Array.isArray(r.input.transcript) && !(input as { transcript?: unknown[] }).transcript?.length;
      const next = gotTranscript ? ({ ...input, transcript: r.input.transcript } as Input) : input;
      if (gotTranscript) setInput(next);
      setPrepared({ key: JSON.stringify(next), input: r.input, timeline: r.timeline });
      setWarnings(r.warnings);
    } catch (e) {
      setPreviewError((e as Error).message);
    } finally {
      setPreparing(false);
    }
  };

  // Rendering.
  const [jobId, setJobId] = useStoredState<string | null>(`orb:job:${template}`, () => null);
  const job = useJob(jobId);
  const [starting, setStarting] = useState(false);
  const generate = async () => {
    setStarting(true);
    setPreviewError(null);
    try {
      const r = await api<{ id: string }>("/api/render", { json: { template, input } });
      setJobId(r.id);
    } catch (e) {
      setPreviewError((e as Error).message);
    } finally {
      setStarting(false);
    }
  };
  const cancel = async () => {
    if (jobId) await api(`/api/jobs/${jobId}/cancel`, { method: "POST" }).catch(() => undefined);
  };
  const [view, setView] = useState<"live" | "result">("live");
  const lastDone = useRef<string | null>(null);
  useEffect(() => {
    if (job?.status === "done" && lastDone.current !== job.id) {
      lastDone.current = job.id;
      setView("result");
    }
  }, [job]);

  const voices = VOICE_FIELDS[template] ?? [];
  const isClip = template === "split-screen" || template === "blur" || template === "captions";
  const showBackground = template !== "captions" && template !== "blur" && !(template === "would-you-rather" && input.layout !== "background") && !(template === "chatgpt" && input.layout === "full");
  const showCaptions = template === "reddit" || isClip;
  let n = 0;
  const step = (title: string) => `${NUM[n++]} ${title}`;

  const Form = () => {
    const p = { input: input as never, set: set as never };
    switch (template) {
      case "reddit":
        return <RedditForm {...p} />;
      case "fake-texts":
        return <FakeTextsForm {...p} />;
      case "twitter":
        return <TwitterForm {...p} />;
      case "chatgpt":
        return <ChatGPTForm {...p} />;
      case "would-you-rather":
        return <WyrForm {...p} />;
      case "quiz":
        return <QuizForm {...p} />;
      default:
        return <ClipForm template={template} {...p} />;
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl text-lg font-black text-white" style={{ background: `linear-gradient(135deg, ${frame.accent}, ${frame.accent}99)` }}>
            {frame.name[0]}
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white">{frame.name}</h1>
            <p className="text-[13px] text-ink-400">{frame.short}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/guides/${frame.slug}`}>
            <Button variant="ghost" size="sm" icon={<BookOpen className="size-3.5" />}>
              Guide
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="size-3.5" />}
            onClick={() => {
              if (confirm("Reset this project to the example?")) {
                setInput(meta.defaults() as Input);
                setPrepared(null);
              }
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <Section title={step(isClip ? "Clip" : "Content")} description={frame.description} actions={frame.aiKind ? <AiWriter kind={frame.aiKind} placeholder={AI_PLACEHOLDER[template] ?? "Describe your video"} onResult={(d) => setInput((prev) => applyGenerated(template, d, prev) as Input)} /> : undefined}>
            {Form()}
          </Section>
          {voices.length ? (
            <Section title={step("Voice")} description="Every voice is synthesized with word-level timing for perfectly synced captions.">
              {voices.map((v) => (
                <Field key={v.key} label={v.label}>
                  <VoicePicker value={String(input[v.key] ?? "")} onChange={(id) => set({ [v.key]: id } as Partial<Input>)} compact={voices.length > 1} />
                </Field>
              ))}
              <Field label="Speaking speed">
                <Slider value={Number(input.speed ?? 1)} min={0.8} max={1.4} step={0.02} onChange={(speed) => set({ speed } as Partial<Input>)} format={(v) => `${v.toFixed(2)}×`} />
              </Field>
            </Section>
          ) : null}
          {showBackground ? (
            <Section title={step("Background")} description="Procedural gameplay renders fresh every time, so your videos never reuse the same footage.">
              <BackgroundPicker value={input.background} onChange={(background) => set({ background })} />
            </Section>
          ) : null}
          {showCaptions ? (
            <Section title={step("Captions")} description="Animated, word-by-word captions.">
              <CaptionPicker value={input.captions} onChange={(captions) => set({ captions })} allowDisable={template !== "captions"} />
            </Section>
          ) : null}
          <Section title={step("Music")} description="Royalty-free beds, mastered with the voice to −14 LUFS.">
            <MusicPicker value={input.music} onChange={(music) => set({ music })} />
          </Section>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-white/[0.07] bg-ink-900/70 p-4">
            {job?.status === "done" && job.output ? (
              <div className="mb-3 flex">
                {(["live", "result"] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setView(v)} className={cn("flex-1 rounded-lg py-1.5 text-xs font-semibold", view === v ? "bg-white/10 text-white" : "text-ink-400")}>
                    {v === "live" ? "Live preview" : "Rendered MP4"}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mx-auto max-w-[300px] xl:max-w-[330px]">
              <PhoneFrame>
                {view === "result" && job?.status === "done" && job.output ? (
                  <video key={job.output.url} src={job.output.url} controls autoPlay playsInline className="h-full w-full bg-black object-contain" />
                ) : (
                  <PreviewPlayer template={template} input={fresh ? fresh.input : input} timeline={fresh?.timeline ?? null} initialFrame={24} />
                )}
              </PhoneFrame>
            </div>
            <div className="mt-4">
              <GeneratePanel
                previewState={previewState}
                previewError={previewError}
                warnings={warnings}
                onPreview={preview}
                onGenerate={generate}
                job={job as JobSummary | null}
                starting={starting}
                onCancel={cancel}
                onClearJob={() => {
                  setJobId(null);
                  setView("live");
                }}
                needsVoice={voices.length > 0 || isClip}
                clipMode={isClip}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
