/** "Escape the rings": a ball bouncing inside rotating rings, each with a gap. Fully deterministic. */
interface Ring {
  r: number;
  speed: number;
  phase: number;
  gap: number;
  hue: number;
}

interface Sim {
  frames: { x: number; y: number; ring: number; hue: number; flash: number; broken: number[] }[];
  rings: Ring[][];
}

const DT = 1 / 240;
const sims = new Map<string, Sim>();

const buildRings = (cycle: number): Ring[] => {
  const rings: Ring[] = [];
  for (let i = 0; i < 10; i++) {
    rings.push({
      r: 110 + i * 44,
      speed: (0.9 + i * 0.08) * (i % 2 ? -1 : 1) * (1 + (cycle % 3) * 0.15),
      phase: i * 0.7 + cycle,
      gap: 0.62,
      hue: (cycle * 70 + i * 26) % 360,
    });
  }
  return rings;
};

const simulate = (fps: number, seconds: number, seed: number): Sim => {
  const k = `${fps}-${seconds}-${seed}`;
  const cached = sims.get(k);
  if (cached) return cached;
  let cycle = seed % 7;
  let rings = buildRings(cycle);
  const ringSets: Ring[][] = [rings];
  let broken: number[] = [];
  let x = 0;
  let y = -40;
  let vx = 210 + (seed % 5) * 20;
  let vy = 0;
  let hue = 0;
  let flash = 0;
  let current = 0;
  let t = 0;
  const frames: Sim["frames"] = [];
  const stepsPerFrame = Math.round(1 / fps / DT);
  const totalFrames = Math.ceil(seconds * fps);
  const R = 18;
  for (let f = 0; f < totalFrames; f++) {
    for (let s = 0; s < stepsPerFrame; s++) {
      vy += 900 * DT;
      x += vx * DT;
      y += vy * DT;
      t += DT;
      flash = Math.max(0, flash - DT * 3);
      const ring = rings[current];
      if (!ring) {
        // All rings escaped: start a new set.
        cycle++;
        rings = buildRings(cycle);
        ringSets.push(rings);
        broken = [];
        current = 0;
        x = 0;
        y = -40;
        vx = 230 * (cycle % 2 ? 1 : -1);
        vy = 0;
        continue;
      }
      const d = Math.hypot(x, y);
      if (d + R >= ring.r) {
        const ang = Math.atan2(y, x);
        const rot = ring.phase + ring.speed * t;
        let rel = (ang - rot) % (Math.PI * 2);
        if (rel < 0) rel += Math.PI * 2;
        if (rel < ring.gap) {
          if (d - R > ring.r) {
            broken = [...broken, current];
            current++;
            flash = 1;
          }
        } else {
          const nx = x / d;
          const ny = y / d;
          const dot = vx * nx + vy * ny;
          if (dot > 0) {
            vx -= 2 * dot * nx;
            vy -= 2 * dot * ny;
            const boost = 1.012;
            vx *= boost;
            vy *= boost;
            const sp = Math.hypot(vx, vy);
            if (sp > 1500) {
              vx *= 1500 / sp;
              vy *= 1500 / sp;
            }
            hue = (hue + 23) % 360;
          }
          x = nx * (ring.r - R);
          y = ny * (ring.r - R);
        }
      }
    }
    frames.push({ x, y, ring: ringSets.length - 1, hue, flash, broken: broken.slice() });
  }
  const sim = { frames, rings: ringSets };
  sims.set(k, sim);
  return sim;
};

export const drawRings = (seed: number, fps: number) => {
  // Simulate in 60 s windows on demand so long videos stay cheap.
  return (ctx: CanvasRenderingContext2D, t: number, W: number, H: number) => {
    const sim = simulate(fps, Math.max(60, Math.ceil((t + 5) / 60) * 60), seed);
    const fi = Math.min(sim.frames.length - 1, Math.max(0, Math.round(t * fps)));
    const fr = sim.frames[fi];
    const rings = sim.rings[fr.ring];
    ctx.fillStyle = "#07070c";
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2;
    const cy = H / 2;
    const scale = Math.min(W / 1080, H / 1180);
    // Glow backdrop.
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7);
    g.addColorStop(0, `hsla(${fr.hue},80%,40%,${0.12 + fr.flash * 0.18})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.lineCap = "round";
    rings.forEach((ring, i) => {
      if (fr.broken.includes(i)) return;
      const rot = ring.phase + ring.speed * (fi / fps);
      ctx.strokeStyle = `hsl(${ring.hue},90%,62%)`;
      ctx.shadowColor = `hsl(${ring.hue},90%,60%)`;
      ctx.shadowBlur = 18 * scale;
      ctx.lineWidth = 9 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r * scale, rot + ring.gap, rot + Math.PI * 2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
    // Trail.
    for (let k = 14; k >= 1; k--) {
      const p = sim.frames[Math.max(0, fi - k)];
      if (p.ring !== fr.ring) continue;
      ctx.fillStyle = `hsla(${fr.hue},95%,65%,${(0.5 * (1 - k / 15)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx + p.x * scale, cy + p.y * scale, 18 * scale * (1 - k / 22), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = `hsl(${fr.hue},95%,65%)`;
    ctx.shadowBlur = 30 * scale;
    ctx.beginPath();
    ctx.arc(cx + fr.x * scale, cy + fr.y * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Counter.
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `800 ${64 * scale}px Montserrat, sans-serif`;
    ctx.textAlign = "center";
    if (cy + 640 * scale < H - 20) ctx.fillText(`${fr.broken.length} / ${rings.length}`, cx, cy + 640 * scale);
  };
};
