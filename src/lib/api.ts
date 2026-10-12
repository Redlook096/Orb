export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const api = async <T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> => {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    method: rest.method ?? (json !== undefined ? "POST" : "GET"),
    headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) throw new ApiError((data as { error?: string })?.error ?? `Request failed (${res.status})`, res.status);
  return data as T;
};

export interface MediaAsset {
  id: string;
  kind: "video" | "image" | "audio";
  name: string;
  src: string;
  thumb?: string;
  duration: number;
  width?: number;
  height?: number;
  size: number;
  createdAt: number;
}

export interface JobSummary {
  id: string;
  template: string;
  title: string;
  status: "queued" | "preparing" | "rendering" | "done" | "error" | "canceled";
  stage: string;
  progress: number;
  createdAt: number;
  updatedAt: number;
  output?: { url: string; thumb?: string; duration: number; size: number };
  error?: string;
  warnings: string[];
  queuePosition?: number;
}

export interface Voice {
  id: string;
  provider: "kokoro" | "espeak" | "openai" | "elevenlabs";
  name: string;
  gender: "male" | "female";
  accent: string;
  style: string;
  available: boolean;
}

export interface Capabilities {
  ffmpeg: boolean;
  kokoro: boolean;
  espeak: boolean;
  mbrola: boolean;
  openai: boolean;
  elevenlabs: boolean;
  anthropic: boolean;
  localWhisper: boolean;
  ytdlp: boolean;
}

/** Streams a file to the server without multipart buffering, reporting upload progress. */
export const uploadFile = (file: File, onProgress?: (f: number) => void) =>
  new Promise<MediaAsset>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload?name=${encodeURIComponent(file.name)}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 400) reject(new Error(data.error ?? "Upload failed"));
        else resolve(data as MediaAsset);
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

export const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export const formatBytes = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

export const timeAgo = (ms: number) => {
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
