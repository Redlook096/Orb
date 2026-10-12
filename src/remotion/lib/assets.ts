// Pure data shared by server-side timeline builders and the browser. Must not import "remotion",
// because route handlers evaluate it under the react-server condition.

export type SfxId =
  | "pop"
  | "send"
  | "receive"
  | "whoosh"
  | "ding"
  | "tick"
  | "correct"
  | "wrong"
  | "typing"
  | "swoosh"
  | "notify";

/**
 * Sound effects are stored symbolically ("sfx:pop") because timelines are built on the server,
 * while the static-file base URL is only known inside the Player or the render bundle.
 */
export const sfx = (id: SfxId) => `sfx:${id}`;

export const MUSIC_TRACKS = [
  { id: "suspense", name: "Suspense", mood: "Dark pulses for stories & drama" },
  { id: "lofi", name: "Lo-fi Chill", mood: "Warm keys, soft drums" },
  { id: "upbeat", name: "Upbeat Pop", mood: "Bright plucks for quizzes & games" },
  { id: "ambient", name: "Ambient Drift", mood: "Airy pads, no drums" },
  { id: "phonk", name: "Night Drift", mood: "Hard cowbell beat for edits" },
] as const;
