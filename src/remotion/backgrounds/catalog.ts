import type { ProceduralBackgroundId } from "../lib/types";

export const PROCEDURAL_BACKGROUNDS: { id: ProceduralBackgroundId; name: string; description: string; accent: string }[] = [
  { id: "parkour", name: "Block Parkour", description: "First-person voxel parkour over the sky", accent: "#5fa437" },
  { id: "runner", name: "Rail Runner", description: "Endless runner dodging trains and grabbing coins", accent: "#f2683c" },
  { id: "neon", name: "Neon Drive", description: "Synthwave highway under a striped sun", accent: "#ff2bd6" },
  { id: "rings", name: "Ring Escape", description: "Satisfying ball escaping rotating rings", accent: "#38f9ff" },
  { id: "gradient", name: "Liquid Gradient", description: "Slow, calm mesh gradient", accent: "#6a5cff" },
  { id: "space", name: "Hyperspace", description: "Star streaks, nebula and a ringed planet", accent: "#7a6bff" },
];
