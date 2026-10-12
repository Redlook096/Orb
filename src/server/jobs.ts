import fs from "node:fs";
import path from "node:path";
import type { BaseTimeline, TemplateId } from "@/remotion/lib/types";
import { DIRS } from "./config";
import { fileUrl, newId, readJson, writeJson } from "./storage";
import { prepare } from "./prepare";
import { renderVideo } from "./render";

export type JobStatus = "queued" | "preparing" | "rendering" | "done" | "error" | "canceled";

export interface Job {
  id: string;
  template: TemplateId;
  title: string;
  status: JobStatus;
  stage: string;
  progress: number;
  createdAt: number;
  updatedAt: number;
  input: Record<string, unknown>;
  timeline?: BaseTimeline;
  output?: { url: string; thumb?: string; duration: number; size: number };
  error?: string;
  warnings: string[];
}

interface State {
  jobs: Map<string, Job>;
  queue: string[];
  running: string | null;
  aborts: Map<string, AbortController>;
  loaded: boolean;
}

const g = globalThis as unknown as { __orbJobs?: State };
const state: State = (g.__orbJobs ??= { jobs: new Map(), queue: [], running: null, aborts: new Map(), loaded: false });

const jobFile = (id: string) => path.join(DIRS.jobs, `${id}.json`);

const persist = (job: Job) => writeJson(jobFile(job.id), job);

const load = () => {
  if (state.loaded) return;
  state.loaded = true;
  for (const f of fs.readdirSync(DIRS.jobs).filter((x) => x.endsWith(".json"))) {
    const job = readJson<Job>(path.join(DIRS.jobs, f));
    if (!job) continue;
    // Anything mid-flight when the server stopped will never finish.
    if (job.status === "queued" || job.status === "preparing" || job.status === "rendering") {
      job.status = "error";
      job.error = "The server restarted before this render finished. Render it again.";
      persist(job);
    }
    state.jobs.set(job.id, job);
  }
};

export const titleFor = (template: TemplateId, input: Record<string, unknown>): string => {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  switch (template) {
    case "reddit":
      return s(input.title) || "Reddit story";
    case "fake-texts":
      return `Texts with ${s(input.contactName) || "contact"}`;
    case "twitter":
      return s((input.tweets as { text: string }[] | undefined)?.[0]?.text).slice(0, 80) || "Tweet thread";
    case "chatgpt":
      return s((input.messages as { text: string }[] | undefined)?.[0]?.text).slice(0, 80) || "AI chat";
    case "would-you-rather":
      return "Would you rather";
    case "quiz":
      return s(input.title) || "Quiz";
    default:
      return s((input.clip as { name?: string } | null)?.name) || template;
  }
};

let lastPersist = 0;
const update = (job: Job, patch: Partial<Job>, force = false) => {
  Object.assign(job, patch, { updatedAt: Date.now() });
  if (force || Date.now() - lastPersist > 1500) {
    lastPersist = Date.now();
    persist(job);
  }
};

const runJob = async (job: Job) => {
  const abort = new AbortController();
  state.aborts.set(job.id, abort);
  try {
    update(job, { status: "preparing", stage: "Preparing", progress: 0 }, true);
    const prepared = await prepare(job.template, job.input, (stage, f) => update(job, { stage, progress: f * 0.25 }));
    if (abort.signal.aborted) throw new Error("canceled");
    update(job, { input: prepared.input, timeline: prepared.timeline, warnings: prepared.warnings, status: "rendering", stage: "Rendering frames", progress: 0.25 }, true);
    const result = await renderVideo(job.id, job.template, { input: prepared.input, timeline: prepared.timeline }, (f, stage) => update(job, { stage, progress: 0.25 + f * 0.75 }), abort.signal);
    update(
      job,
      {
        status: "done",
        stage: "Done",
        progress: 1,
        output: { url: fileUrl(result.file), thumb: result.thumb ? fileUrl(result.thumb) : undefined, duration: result.duration, size: result.size },
      },
      true,
    );
  } catch (e) {
    const canceled = abort.signal.aborted;
    update(job, { status: canceled ? "canceled" : "error", stage: canceled ? "Canceled" : "Failed", error: canceled ? undefined : (e as Error).message }, true);
    if (!canceled) console.error(`[orb] job ${job.id} failed`, e);
  } finally {
    state.aborts.delete(job.id);
  }
};

const pump = async () => {
  if (state.running) return;
  const next = state.queue.shift();
  if (!next) return;
  const job = state.jobs.get(next);
  if (!job || job.status !== "queued") return pump();
  state.running = next;
  try {
    await runJob(job);
  } finally {
    state.running = null;
    void pump();
  }
};

export const createJob = (template: TemplateId, input: Record<string, unknown>): Job => {
  load();
  const job: Job = {
    id: newId(),
    template,
    title: titleFor(template, input),
    status: "queued",
    stage: "Waiting in queue",
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    input,
    warnings: [],
  };
  state.jobs.set(job.id, job);
  state.queue.push(job.id);
  persist(job);
  void pump();
  return job;
};

export const getJob = (id: string) => {
  load();
  return state.jobs.get(id) ?? null;
};

export const listJobs = () => {
  load();
  return [...state.jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
};

export const queuePosition = (id: string) => state.queue.indexOf(id);

export const cancelJob = (id: string) => {
  const job = getJob(id);
  if (!job) return false;
  if (job.status === "queued") {
    state.queue = state.queue.filter((x) => x !== id);
    update(job, { status: "canceled", stage: "Canceled" }, true);
  } else state.aborts.get(id)?.abort();
  return true;
};

export const deleteJob = (id: string) => {
  const job = getJob(id);
  if (!job) return false;
  cancelJob(id);
  state.jobs.delete(id);
  for (const ext of [".json"]) fs.rmSync(path.join(DIRS.jobs, `${id}${ext}`), { force: true });
  for (const ext of [".mp4", ".jpg"]) fs.rmSync(path.join(DIRS.renders, `${id}${ext}`), { force: true });
  return true;
};
