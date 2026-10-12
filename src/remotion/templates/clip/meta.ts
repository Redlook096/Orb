import type { BaseTimeline, VideoAsset, WordTiming } from "../../lib/types";
import { type CommonInput, type TemplateMeta, defaultBackground, defaultCaptions, defaultMusic, finish } from "../common";
import sample from "../../../../public/demo/podcast.json";

/** A narrated sample podcast that ships with Orb, so clip frames have a real example. */
export const SAMPLE_CLIP = { src: "/demo/podcast.mp4", duration: sample.duration, width: 1280, height: 720, name: "Sample podcast clip" };
const sampleTranscript = (): WordTiming[] => sample.words.map((w) => ({ ...w }));

export interface ClipInput extends CommonInput {
  clip: VideoAsset | null;
  /** Word timings for the clip's speech; filled in by transcription when captions are on. */
  transcript: WordTiming[] | null;
  clipVolume: number;
}

export interface SplitInput extends ClipInput {
  ratio: number;
  clipOnTop: boolean;
}

export interface BlurInput extends ClipInput {
  headline: string;
  blur: number;
  zoom: number;
}

export interface CaptionsInput extends ClipInput {
  fit: "cover" | "contain";
}

export type ClipTimeline = BaseTimeline;

const clipTimeline = (input: ClipInput): ClipTimeline =>
  finish({
    duration: input.clip?.duration ?? 12,
    audio: [],
    captions: input.captions.enabled ? input.transcript ?? [] : [],
  });

const base = (): ClipInput => ({
  clip: { ...SAMPLE_CLIP },
  transcript: sampleTranscript(),
  clipVolume: 1,
  background: defaultBackground("parkour", 11),
  music: defaultMusic(null, 0.1),
  captions: defaultCaptions(),
});

export const splitMeta: TemplateMeta<SplitInput, ClipTimeline> = {
  id: "split-screen",
  speech: () => [],
  timeline: clipTimeline,
  defaults: () => ({ ...base(), ratio: 0.5, clipOnTop: true }),
  demo: () => splitMeta.defaults(),
};

export const blurMeta: TemplateMeta<BlurInput, ClipTimeline> = {
  id: "blur",
  speech: () => [],
  timeline: clipTimeline,
  defaults: () => ({ ...base(), headline: "Wait for the end 😳", blur: 42, zoom: 1, captions: defaultCaptions({ position: "bottom" }) }),
  demo: () => blurMeta.defaults(),
};

export const captionsMeta: TemplateMeta<CaptionsInput, ClipTimeline> = {
  id: "captions",
  speech: () => [],
  timeline: clipTimeline,
  // The sample clip is landscape, so it is shown whole over a blurred fill.
  defaults: () => ({ ...base(), fit: "contain", captions: defaultCaptions({ style: "hormozi", position: "bottom", highlight: "#3CFF6B", maxWords: 2 }) }),
  demo: () => captionsMeta.defaults(),
};
