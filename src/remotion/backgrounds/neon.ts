import { hash3 } from "../lib/random";

/** Synthwave drive: striped sun, wireframe mountains, scrolling grid and passing palms. */
export const drawNeon = (seed: number) => (ctx: CanvasRenderingContext2D, t: number, W: number, H: number) => {
  const horizon = H * 0.47;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#0b0326");
  sky.addColorStop(0.55, "#3a0b5c");
  sky.addColorStop(1, "#ff3f8e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizon);

  // Stars.
  for (let i = 0; i < 140; i++) {
    const x = hash3(i, seed, 1) * W;
    const y = hash3(i, seed, 2) * horizon * 0.75;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + hash3(i, 3, seed) * 2) + i));
    ctx.fillStyle = `rgba(255,255,255,${(tw * 0.8).toFixed(3)})`;
    const s = 1.5 + hash3(i, seed, 4) * 2.5;
    ctx.fillRect(x, y, s, s);
  }

  // Sun with horizontal cut stripes.
  const sunR = W * 0.36;
  const sunY = horizon - sunR * 0.42;
  ctx.save();
  ctx.shadowColor = "#ff5fa2";
  ctx.shadowBlur = 90;
  const sg = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sg.addColorStop(0, "#ffe66d");
  sg.addColorStop(0.5, "#ff9a3c");
  sg.addColorStop(1, "#ff2e88");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(W / 2, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, horizon);
  ctx.clip();
  for (let k = 0; k < 9; k++) {
    const yy = sunY + sunR * 0.05 + k * k * 4.2 + k * 10 + ((t * 18) % 14);
    const hh = 4 + k * 2.2;
    ctx.fillStyle = "#2a0a4a";
    ctx.globalAlpha = 0.95;
    ctx.fillRect(W / 2 - sunR, yy, sunR * 2, hh);
  }
  ctx.restore();

  // Mountains (two layers with parallax).
  const mountains = (layer: number, color: string, edge: string, amp: number, speed: number) => {
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    const step = 60;
    for (let x = -step; x <= W + step; x += step) {
      const wx = x + t * speed;
      const k = Math.floor(wx / step);
      const f = wx / step - k;
      const h0 = hash3(k, layer, seed);
      const h1 = hash3(k + 1, layer, seed);
      const hgt = (h0 + (h1 - h0) * f) * amp + amp * 0.2;
      ctx.lineTo(x, horizon - hgt);
    }
    ctx.lineTo(W, horizon);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 3;
    ctx.shadowColor = edge;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };
  mountains(1, "#1c0638", "#b44cff", H * 0.13, 8);
  mountains(2, "#12022a", "#ff3fd0", H * 0.08, 20);

  // Ground and grid.
  const ground = ctx.createLinearGradient(0, horizon, 0, H);
  ground.addColorStop(0, "#1a0333");
  ground.addColorStop(1, "#05010f");
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, W, H - horizon);
  ctx.save();
  ctx.strokeStyle = "#ff2bd6";
  ctx.shadowColor = "#ff2bd6";
  ctx.shadowBlur = 14;
  const camH = 1.6;
  const f = H * 0.9;
  const spacing = 2;
  const speed = 22;
  const off = (t * speed) % spacing;
  for (let i = 0; i < 60; i++) {
    const z = i * spacing - off + 0.6;
    if (z <= 0.3) continue;
    const y = horizon + (f * camH) / z / 2.2;
    if (y > H + 10) continue;
    ctx.globalAlpha = Math.min(1, 0.25 + (y - horizon) / (H * 0.35));
    ctx.lineWidth = Math.max(1, 6 / z + 1);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = -22; i <= 22; i++) {
    const x0 = W / 2 + i * 26;
    const x1 = W / 2 + i * W * 0.42;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, horizon);
    ctx.lineTo(x1, H * 1.15);
    ctx.stroke();
  }
  ctx.restore();

  // Road with dashed center line.
  ctx.fillStyle = "rgba(10,2,24,0.82)";
  ctx.beginPath();
  ctx.moveTo(W / 2 - 18, horizon);
  ctx.lineTo(W / 2 + 18, horizon);
  ctx.lineTo(W * 0.92, H);
  ctx.lineTo(W * 0.08, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#38f9ff";
  ctx.shadowColor = "#38f9ff";
  ctx.shadowBlur = 18;
  for (let i = 0; i < 30; i++) {
    const z = i * 4 - ((t * speed) % 4) + 0.5;
    if (z <= 0.5) continue;
    const y0 = horizon + (f * camH) / z / 2.2;
    const y1 = horizon + (f * camH) / (z + 1.6) / 2.2;
    const w0 = 260 / z;
    const w1 = 260 / (z + 1.6);
    if (y1 > H) continue;
    ctx.beginPath();
    ctx.moveTo(W / 2 - w0 / 2, y0);
    ctx.lineTo(W / 2 + w0 / 2, y0);
    ctx.lineTo(W / 2 + w1 / 2, y1);
    ctx.lineTo(W / 2 - w1 / 2, y1);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Palm silhouettes passing on both sides.
  for (let i = 0; i < 16; i++) {
    const period = 9;
    const z = ((i * period - t * speed) % (16 * period) + 16 * period) % (16 * period) + 0.8;
    const side = i % 2 === 0 ? -1 : 1;
    const unit = f / 2.2 / z;
    const sx = W / 2 + side * 1.35 * unit;
    const base = horizon + camH * unit;
    const scale = (2.6 * unit) / 320;
    // Skip palms once they are about to pass the camera; up close they only read as black blobs.
    if (z < 2.6 || base > H + 600 || sx < -500 || sx > W + 500) continue;
    ctx.globalAlpha = Math.min(1, (z - 2.6) / 1.2);
    drawPalm(ctx, sx, base, scale, side);
    ctx.globalAlpha = 1;
  }

  // Scanlines.
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
};

const drawPalm = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, side: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#07010f";
  ctx.strokeStyle = "#07010f";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(side * -30, -160, side * 10, -320);
  ctx.stroke();
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(side * 10, -320);
    ctx.quadraticCurveTo(side * 10 + Math.cos(a) * 90, -340 + Math.sin(a) * 30 - 40, side * 10 + Math.cos(a) * 150, -300 + Math.abs(Math.sin(a)) * 60);
    ctx.lineWidth = 12;
    ctx.stroke();
  }
  ctx.restore();
};
