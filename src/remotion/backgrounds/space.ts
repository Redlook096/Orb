import { hash3 } from "../lib/random";

/** Hyperspace: streaking stars over a drifting nebula and a slowly turning planet. */
export const drawSpace = (seed: number) => (ctx: CanvasRenderingContext2D, t: number, W: number, H: number) => {
  ctx.fillStyle = "#02030a";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  const neb = [
    [0.3, 0.3, "#5b2bff"],
    [0.75, 0.55, "#ff2b9d"],
    [0.4, 0.8, "#00b3ff"],
  ] as const;
  neb.forEach(([nx, ny, c], i) => {
    const x = W * (nx + 0.05 * Math.sin(t * 0.1 + i));
    const y = H * (ny + 0.04 * Math.cos(t * 0.08 + i));
    const g = ctx.createRadialGradient(x, y, 0, x, y, W * 0.75);
    g.addColorStop(0, c + "40");
    g.addColorStop(1, c + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
  ctx.globalCompositeOperation = "source-over";

  const cx = W / 2;
  const cy = H * 0.45;
  const f = W * 0.6;
  const speed = 16;
  ctx.lineCap = "round";
  for (let i = 0; i < 700; i++) {
    const sx = (hash3(i, seed, 1) - 0.5) * 40;
    const sy = (hash3(i, seed, 2) - 0.5) * 70;
    const depth = 60;
    const z = depth - (((t * speed + hash3(i, seed, 3) * depth) % depth) + depth) % depth;
    if (z < 0.4) continue;
    const z2 = z + 1.4;
    const x1 = cx + (sx * f) / z;
    const y1 = cy + (sy * f) / z;
    const x2 = cx + (sx * f) / z2;
    const y2 = cy + (sy * f) / z2;
    const a = Math.min(1, (depth - z) / 22);
    ctx.strokeStyle = `rgba(${200 + (i % 55)},${215 + (i % 40)},255,${a.toFixed(3)})`;
    ctx.lineWidth = Math.min(7, 3 + 50 / z);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  // Planet.
  const px = W * 0.78;
  const py = H * 0.82;
  const pr = W * 0.42;
  const pg = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.5, pr * 0.1, px, py, pr);
  pg.addColorStop(0, "#7a6bff");
  pg.addColorStop(0.6, "#2b1b7a");
  pg.addColorStop(1, "#090520");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.clip();
  for (let b = 0; b < 8; b++) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + (b % 3) * 0.02})`;
    const yy = py - pr + ((b * pr) / 4 + t * 6) % (pr * 2);
    ctx.fillRect(px - pr, yy, pr * 2, pr * 0.08);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(160,140,255,0.55)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(px, py, pr * 1.45, pr * 0.28, -0.35, 0, Math.PI * 2);
  ctx.stroke();
};
