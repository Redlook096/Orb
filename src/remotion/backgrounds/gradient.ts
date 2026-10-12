import { hash3 } from "../lib/random";

const PALETTES = [
  ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#1dd1a1"],
  ["#6a5cff", "#00d4ff", "#ff4ecd", "#7cffcb", "#3a0ca3"],
  ["#ff7e5f", "#feb47b", "#ff4e50", "#f9d423", "#c94b4b"],
];

/** Slow mesh-gradient blobs with film grain. */
export const drawGradient = (seed: number) => (ctx: CanvasRenderingContext2D, t: number, W: number, H: number) => {
  const pal = PALETTES[seed % PALETTES.length];
  ctx.fillStyle = "#0c0a1a";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 7; i++) {
    const sx = 0.2 + hash3(i, seed, 1) * 0.6;
    const sy = 0.15 + hash3(i, seed, 2) * 0.7;
    const x = W * (sx + 0.28 * Math.sin(t * (0.15 + i * 0.03) + i * 1.7));
    const y = H * (sy + 0.2 * Math.cos(t * (0.12 + i * 0.025) + i * 2.3));
    const r = W * (0.55 + 0.25 * Math.sin(t * 0.2 + i));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, pal[i % pal.length] + "aa");
    g.addColorStop(1, pal[i % pal.length] + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = "source-over";
  // Grain.
  const frame = Math.floor(t * 30);
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let i = 0; i < 2600; i++) {
    const x = hash3(i, frame, seed) * W;
    const y = hash3(frame, i, seed + 1) * H;
    ctx.fillRect(x, y, 2, 2);
  }
};
