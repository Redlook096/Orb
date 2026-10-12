"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Capabilities, type JobSummary, type MediaAsset, type Voice } from "./api";

const cache = new Map<string, { at: number; data: unknown }>();

/** Tiny SWR-style fetch hook with a shared in-memory cache. */
export const useFetch = <T>(url: string | null, ttl = 15_000) => {
  const [data, setData] = useState<T | null>(() => (url ? ((cache.get(url)?.data as T) ?? null) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const d = await api<T>(url);
      cache.set(url, { at: Date.now(), data: d });
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    if (!url) return;
    const c = cache.get(url);
    if (c) setData(c.data as T);
    if (!c || Date.now() - c.at > ttl) void reload();
  }, [url, ttl, reload]);
  return { data, error, loading, reload };
};

export const useVoices = () => useFetch<{ voices: Voice[] }>("/api/voices", 60_000);
export const useStatus = () => useFetch<{ capabilities: Capabilities }>("/api/status", 30_000);
export const useLibrary = () => useFetch<{ uploads: MediaAsset[]; renders: JobSummary[] }>("/api/library", 3_000);

export const invalidate = (url: string) => cache.delete(url);

/** Polls a render job until it reaches a terminal state. */
export const useJob = (id: string | null) => {
  const [job, setJob] = useState<JobSummary | null>(null);
  useEffect(() => {
    if (!id) {
      setJob(null);
      return;
    }
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const j = await api<JobSummary>(`/api/jobs/${id}`);
        if (stop) return;
        setJob(j);
        if (["done", "error", "canceled"].includes(j.status)) {
          invalidate("/api/library");
          return;
        }
      } catch {
        /* transient; keep polling */
      }
      timer = setTimeout(tick, 900);
    };
    void tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id]);
  return job;
};

/** State persisted to localStorage (per-browser drafts). */
export const useStoredState = <T>(key: string, initial: () => T) => {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* storage unavailable */
    }
    loaded.current = true;
  }, [key]);
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage full or unavailable */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [key, value]);
  return [value, setValue] as const;
};

/** Plays one short audio preview at a time across the whole app. */
let current: HTMLAudioElement | null = null;
export const playPreview = (src: string, onEnd?: () => void) => {
  current?.pause();
  const a = new Audio(src);
  current = a;
  a.onended = () => onEnd?.();
  void a.play().catch(() => onEnd?.());
  return () => {
    a.pause();
    onEnd?.();
  };
};
export const stopPreview = () => current?.pause();
