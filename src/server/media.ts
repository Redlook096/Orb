import { spawn } from "node:child_process";

export const run = (bin: string, args: string[], opts: { input?: string; timeoutMs?: number; onStderr?: (s: string) => void } = {}) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = opts.timeoutMs ? setTimeout(() => p.kill("SIGKILL"), opts.timeoutMs) : null;
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      opts.onStderr?.(s);
    });
    p.on("error", (e) => {
      if (timer) clearTimeout(timer);
      reject(e);
    });
    p.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${bin} exited with ${code}: ${stderr.slice(-800)}`));
    });
    if (opts.input !== undefined) p.stdin.end(opts.input);
    else p.stdin.end();
  });

export interface Probe {
  duration: number;
  width?: number;
  height?: number;
  videoCodec?: string;
  audioCodec?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  format: string;
}

export const probe = async (file: string): Promise<Probe> => {
  const { stdout } = await run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file], { timeoutMs: 60_000 });
  const j = JSON.parse(stdout) as {
    format: { duration?: string; format_name: string };
    streams: { codec_type: string; codec_name: string; width?: number; height?: number; duration?: string; tags?: { rotate?: string }; side_data_list?: { rotation?: number }[] }[];
  };
  const v = j.streams.find((s) => s.codec_type === "video" && s.codec_name !== "mjpeg" && s.codec_name !== "png");
  const a = j.streams.find((s) => s.codec_type === "audio");
  let width = v?.width;
  let height = v?.height;
  const rot = Math.abs(Number(v?.tags?.rotate ?? v?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0));
  if (rot === 90 || rot === 270) [width, height] = [height, width];
  return {
    duration: Number(j.format.duration ?? v?.duration ?? a?.duration ?? 0),
    width,
    height,
    videoCodec: v?.codec_name,
    audioCodec: a?.codec_name,
    hasVideo: Boolean(v),
    hasAudio: Boolean(a),
    format: j.format.format_name,
  };
};

/** Re-encodes anything a browser may not play (HEVC, ProRes, MOV, …) to H.264/AAC MP4 with faststart. */
export const normalizeVideo = async (input: string, output: string, p: Probe) => {
  const compatible = p.videoCodec === "h264" && (!p.hasAudio || p.audioCodec === "aac") && p.format.includes("mp4");
  const args = compatible
    ? ["-y", "-i", input, "-c", "copy", "-movflags", "+faststart", output]
    : [
        "-y",
        "-i",
        input,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale='min(1920,iw)':-2",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        output,
      ];
  await run("ffmpeg", args, { timeoutMs: 30 * 60_000 });
};

export const extractAudio = (video: string, out: string) =>
  run("ffmpeg", ["-y", "-i", video, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-b:a", "64k", out], { timeoutMs: 10 * 60_000 });

export const toWav = (input: string, out: string) => run("ffmpeg", ["-y", "-i", input, "-ar", "44100", "-ac", "1", out], { timeoutMs: 120_000 });
