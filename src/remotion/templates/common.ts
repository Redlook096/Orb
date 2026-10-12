import type { BackgroundSpec, BaseTimeline, CaptionSettings, MusicSpec, SpeechMap, SpeechRequest, TemplateId } from "../lib/types";

export interface CommonInput {
  background: BackgroundSpec;
  music: MusicSpec;
  captions: CaptionSettings;
}

export interface TemplateMeta<I extends CommonInput = CommonInput, T extends BaseTimeline = BaseTimeline> {
  id: TemplateId;
  /** Every speech segment the template needs synthesized. */
  speech: (input: I) => SpeechRequest[];
  /** Pure timeline builder; falls back to estimated speech when `speech` lacks an entry. */
  timeline: (input: I, speech?: SpeechMap) => T;
  defaults: () => I;
  /** Rich example used for gallery previews and guides. */
  demo: () => I;
}

export const DEFAULT_VOICE = "kokoro:am_adam";
export const DEFAULT_FEMALE_VOICE = "kokoro:af_heart";

export const defaultCaptions = (over: Partial<CaptionSettings> = {}): CaptionSettings => ({
  enabled: true,
  style: "classic",
  position: "center",
  maxWords: 3,
  uppercase: true,
  highlight: "#FFE135",
  scale: 1,
  ...over,
});

export const defaultMusic = (track: string | null = "suspense", volume = 0.14): MusicSpec => ({ track, volume });

export const defaultBackground = (id: "parkour" | "runner" | "neon" | "rings" | "gradient" | "space" = "parkour", seed = 1): BackgroundSpec => ({
  kind: "procedural",
  id,
  seed,
});

export const uid = () => Math.random().toString(36).slice(2, 10);

export const finish = <T extends BaseTimeline>(t: T): T => ({ ...t, duration: Math.max(1, Math.round(t.duration * 30) / 30) });
