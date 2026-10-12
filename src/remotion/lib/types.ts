export type TemplateId =
  | "reddit"
  | "fake-texts"
  | "split-screen"
  | "twitter"
  | "chatgpt"
  | "would-you-rather"
  | "quiz"
  | "blur"
  | "captions";

export interface WordTiming {
  text: string;
  /** Seconds. Relative to the clip for speech results, absolute inside a timeline. */
  start: number;
  end: number;
}

export interface SpeechRequest {
  id: string;
  text: string;
  voice: string;
  speed: number;
}

export interface SpeechResult {
  id: string;
  /** Audio URL, or null when the timing is only an estimate (live preview). */
  src: string | null;
  duration: number;
  words: WordTiming[];
}

export type SpeechMap = Record<string, SpeechResult>;

export type ProceduralBackgroundId =
  | "parkour"
  | "runner"
  | "neon"
  | "rings"
  | "gradient"
  | "space";

export type BackgroundSpec =
  | { kind: "procedural"; id: ProceduralBackgroundId; seed?: number }
  | { kind: "video"; src: string; duration: number; name?: string; muted?: boolean }
  | { kind: "color"; color: string };

export interface MusicSpec {
  /** File in public/music (e.g. "suspense") or an uploaded audio URL. Null disables music. */
  track: string | null;
  volume: number;
}

export type CaptionStyleId =
  | "classic"
  | "hormozi"
  | "beast"
  | "karaoke"
  | "box"
  | "minimal"
  | "neon"
  | "marker"
  | "single"
  | "pop3d";

export interface CaptionSettings {
  enabled: boolean;
  style: CaptionStyleId;
  position: "top" | "center" | "bottom";
  maxWords: number;
  uppercase: boolean;
  highlight: string;
  scale: number;
}

export interface AudioClip {
  src: string;
  /** Seconds from the start of the video. */
  at: number;
  volume?: number;
  /** Trim the clip to this many seconds. */
  duration?: number;
}

/** Shared fields every template timeline carries. */
export interface BaseTimeline {
  duration: number;
  audio: AudioClip[];
  captions: WordTiming[];
}

export interface VideoAsset {
  src: string;
  duration: number;
  width?: number;
  height?: number;
  name?: string;
}
