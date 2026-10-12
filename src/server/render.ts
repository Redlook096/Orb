import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { TemplateId } from "@/remotion/lib/types";
import { DIRS, ROOT, internalBaseUrl } from "./config";
import { run } from "./media";

let serveUrlPromise: Promise<string> | null = null;

/** The Remotion bundle: prebuilt by `npm run build`, or bundled on first use in development. */
const getServeUrl = () => {
  if (!serveUrlPromise) {
    serveUrlPromise = (async () => {
      const prebuilt = path.join(ROOT, ".remotion-bundle");
      if (process.env.NODE_ENV === "production" && fs.existsSync(path.join(prebuilt, "index.html"))) return prebuilt;
      const { bundle } = await import("@remotion/bundler");
      return bundle({ entryPoint: path.join(ROOT, "src/remotion/index.ts"), publicDir: path.join(ROOT, "public") });
    })();
    serveUrlPromise.catch(() => (serveUrlPromise = null));
  }
  return serveUrlPromise;
};

/** Rewrites relative /api/files URLs so the headless browser can fetch them from this server. */
const absolutize = <T>(value: T): T => {
  const base = internalBaseUrl();
  return JSON.parse(JSON.stringify(value).replace(/"\/(api\/files|demo)\//g, (_m, dir: string) => `"${base}/${dir}/`)) as T;
};

const browserOptions = () => ({
  browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || null,
  chromiumOptions: { gl: "angle" as const, enableMultiProcessOnLinux: true },
});

export interface RenderResult {
  file: string;
  thumb: string | null;
  duration: number;
  size: number;
}

export const renderVideo = async (
  id: string,
  template: TemplateId,
  props: { input: unknown; timeline: unknown },
  onProgress: (fraction: number, stage: string) => void,
  signal?: AbortSignal,
): Promise<RenderResult> => {
  onProgress(0, "Loading renderer");
  const { renderMedia, renderStill, selectComposition, makeCancelSignal } = await import("@remotion/renderer");
  const serveUrl = await getServeUrl();
  const inputProps = absolutize(props) as Record<string, unknown>;
  const composition = await selectComposition({ serveUrl, id: template, inputProps, ...browserOptions(), logLevel: "error" });
  const out = path.join(DIRS.renders, `${id}.mp4`);
  const cancel = makeCancelSignal();
  signal?.addEventListener("abort", () => cancel.cancel());
  const cpu = os.cpus().length;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: out,
    inputProps,
    crf: 18,
    pixelFormat: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    imageFormat: "jpeg",
    jpegQuality: 92,
    enforceAudioTrack: true,
    concurrency: Number(process.env.RENDER_CONCURRENCY) || Math.max(1, Math.min(8, cpu - 1)),
    cancelSignal: cancel.cancelSignal,
    logLevel: "error",
    onProgress: ({ progress, stitchStage }) => onProgress(progress, stitchStage === "muxing" ? "Mixing audio" : "Rendering frames"),
    ...browserOptions(),
  });
  // Master the mix to -14 LUFS (the level TikTok, Shorts and Reels normalize to) without re-encoding video.
  onProgress(0.99, "Mastering audio");
  const mastered = path.join(DIRS.renders, `${id}.master.mp4`);
  try {
    await run("ffmpeg", ["-y", "-i", out, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.2:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", mastered], { timeoutMs: 15 * 60_000 });
    fs.renameSync(mastered, out);
  } catch {
    fs.rmSync(mastered, { force: true });
  }
  let thumb: string | null = path.join(DIRS.renders, `${id}.jpg`);
  try {
    await renderStill({
      composition,
      serveUrl,
      output: thumb,
      inputProps,
      frame: Math.min(composition.durationInFrames - 1, Math.round(composition.fps * 1.5)),
      imageFormat: "jpeg",
      jpegQuality: 80,
      scale: 0.4,
      logLevel: "error",
      ...browserOptions(),
    });
  } catch {
    thumb = null;
  }
  return { file: out, thumb, duration: composition.durationInFrames / composition.fps, size: fs.statSync(out).size };
};
