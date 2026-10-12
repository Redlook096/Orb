import { mulberry32, hash3 } from "../lib/random";
import { type Camera, type V3, clamp01, drawWorldPoly, fillPoly, mix, projectCam, rgb, toCamera } from "./engine3d";

type Kind =
  | "grass"
  | "stone"
  | "planks"
  | "quartz"
  | "gold"
  | "diamond"
  | "emerald"
  | "log"
  | "leaves"
  | "dirt"
  | "concrete";

interface Block {
  x: number;
  y: number;
  z: number;
  kind: Kind;
  tint?: V3;
}

interface Move {
  from: number;
  to: number;
  t0: number;
  t1: number;
  jump: number;
}

interface World {
  route: Block[];
  moves: Move[];
  total: number;
  scenery: Block[];
  occupied: Set<string>;
}

const CONCRETE: V3[] = [
  [214, 52, 52],
  [240, 128, 24],
  [247, 196, 37],
  [110, 196, 38],
  [40, 170, 214],
  [62, 92, 222],
  [146, 58, 204],
  [214, 76, 170],
];

const BASE: Record<Kind, V3> = {
  grass: [97, 164, 55],
  dirt: [134, 96, 67],
  stone: [128, 128, 128],
  planks: [184, 148, 95],
  quartz: [236, 233, 226],
  gold: [250, 214, 64],
  diamond: [99, 222, 216],
  emerald: [30, 200, 96],
  log: [104, 82, 50],
  leaves: [58, 132, 38],
  concrete: [200, 200, 200],
};

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

const buildWorld = (seed: number): World => {
  const rng = mulberry32(seed * 7919 + 13);
  const route: Block[] = [];
  let x = 0;
  let y = 0;
  let z = 0;
  let theme = 0;
  let colorIdx = 0;
  const themeKinds: Kind[][] = [
    ["concrete"],
    ["grass"],
    ["stone", "quartz"],
    ["gold", "diamond", "emerald"],
    ["planks", "log"],
  ];
  const push = (kind: Kind) => {
    const tint = kind === "concrete" ? CONCRETE[colorIdx++ % CONCRETE.length] : undefined;
    route.push({ x, y, z, kind, tint });
  };
  push("grass");
  for (let i = 1; i < 2600; i++) {
    if (i % 14 === 0) theme = Math.floor(rng() * themeKinds.length);
    const kinds = themeKinds[theme];
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const walk = rng() < 0.12;
    if (walk) {
      z += 1;
      push(kind);
      continue;
    }
    let dz = 2 + Math.floor(rng() * 3);
    let dx = rng() < 0.38 ? (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * 2)) : 0;
    if (Math.abs(x + dx) > 5) dx = -Math.sign(x);
    let dy = rng() < 0.22 ? 1 : rng() < 0.3 ? -1 : 0;
    if (y + dy > 6 || y + dy < -4) dy = 0;
    if (dy === 1) dz = Math.min(dz, 3);
    if (Math.hypot(dx, dz) > 4.2) dz = 3;
    x += dx;
    y += dy;
    z += dz;
    push(kind);
  }

  const moves: Move[] = [];
  let t = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    const isWalk = d <= 1.01 && a.y === b.y;
    const dur = isWalk ? 0.21 : 0.42 + 0.065 * d + (b.y > a.y ? 0.05 : 0);
    moves.push({ from: i, to: i + 1, t0: t, t1: t + dur, jump: isWalk ? 0 : 1.08 + Math.max(0, b.y - a.y) * 0.35 });
    t += dur;
  }

  // Floating islands with trees on both sides of the course, for depth.
  const scenery: Block[] = [];
  const occupied = new Set<string>();
  route.forEach((b) => occupied.add(key(b.x, b.y, b.z)));
  for (let i = 6; i < route.length; i += 9 + Math.floor(rng() * 6)) {
    const r = route[i];
    const side = rng() < 0.5 ? -1 : 1;
    const ox = r.x + side * (9 + Math.floor(rng() * 12));
    const oy = r.y - 3 - Math.floor(rng() * 5);
    const oz = r.z + Math.floor(rng() * 6);
    const size = 2 + Math.floor(rng() * 2);
    const add = (bx: number, by: number, bz: number, kind: Kind) => {
      const k = key(bx, by, bz);
      if (occupied.has(k)) return;
      occupied.add(k);
      scenery.push({ x: bx, y: by, z: bz, kind });
    };
    for (let dx = -size; dx <= size; dx++)
      for (let dz = -size; dz <= size; dz++) {
        if (Math.abs(dx) === size && Math.abs(dz) === size) continue;
        add(ox + dx, oy, oz + dz, "grass");
        if (Math.abs(dx) < size && Math.abs(dz) < size) add(ox + dx, oy - 1, oz + dz, "dirt");
        if (Math.abs(dx) < size - 1 && Math.abs(dz) < size - 1) add(ox + dx, oy - 2, oz + dz, "stone");
      }
    if (rng() < 0.75) {
      const h = 3 + Math.floor(rng() * 2);
      for (let k = 1; k <= h; k++) add(ox, oy + k, oz, "log");
      for (let lx = -1; lx <= 1; lx++)
        for (let lz = -1; lz <= 1; lz++)
          for (let ly = h - 1; ly <= h + 1; ly++) {
            if (lx === 0 && lz === 0 && ly <= h) continue;
            if (ly === h + 1 && Math.abs(lx) + Math.abs(lz) > 1) continue;
            add(ox + lx, oy + ly, oz + lz, "leaves");
          }
    }
  }
  return { route, moves, total: t, scenery, occupied };
};

const worlds = new Map<number, World>();
const getWorld = (seed: number) => {
  let w = worlds.get(seed);
  if (!w) {
    w = buildWorld(seed);
    worlds.set(seed, w);
  }
  return w;
};

const topCenter = (b: Block): V3 => [b.x + 0.5, b.y + 1, b.z + 0.5];

const positionAt = (w: World, t: number): V3 => {
  const tt = ((t % w.total) + w.total) % w.total;
  let lo = 0;
  let hi = w.moves.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (w.moves[mid].t0 <= tt) lo = mid;
    else hi = mid - 1;
  }
  const m = w.moves[lo];
  const u = clamp01((tt - m.t0) / (m.t1 - m.t0));
  const a = topCenter(w.route[m.from]);
  const b = topCenter(w.route[m.to]);
  const arc = m.jump * 4 * u * (1 - u);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + arc, a[2] + (b[2] - a[2]) * u];
};

const routeIndexAt = (w: World, t: number) => {
  const tt = ((t % w.total) + w.total) % w.total;
  let lo = 0;
  let hi = w.moves.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (w.moves[mid].t0 <= tt) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

const cellColor = (b: Block, face: number, i: number, j: number, n: number, id: number): V3 => {
  const noise = hash3(id * 31 + face, Math.floor((i * 8) / n), Math.floor((j * 8) / n));
  const v = 0.86 + noise * 0.2;
  let base = b.tint ?? BASE[b.kind];
  const row = (j / n) * 8;
  const col = (i / n) * 8;
  if (b.kind === "grass" && face === 5) base = BASE.dirt;
  else if (b.kind === "grass" && face !== 0) {
    const edge = 1.6 + hash3(id, face, Math.floor(col)) * 1.4;
    base = row < edge ? BASE.grass : BASE.dirt;
  }
  if (b.kind === "planks" && Math.floor(row) % 4 === 3) base = [150, 118, 72];
  if (b.kind === "log" && face !== 0 && Math.floor(col) % 3 === 0) base = [86, 66, 40];
  if (b.kind === "log" && face === 0) {
    const d = Math.max(Math.abs(col - 3.5), Math.abs(row - 3.5));
    base = Math.floor(d) % 2 === 0 ? [176, 140, 88] : [150, 118, 72];
  }
  if ((b.kind === "gold" || b.kind === "diamond" || b.kind === "emerald") && (row < 1 || col < 1)) {
    base = mix(base, [255, 255, 255], 0.35);
  }
  if (b.kind === "leaves" && noise > 0.82) base = [38, 92, 26];
  if (b.kind === "concrete") return [base[0] * (0.95 + noise * 0.08), base[1] * (0.95 + noise * 0.08), base[2] * (0.95 + noise * 0.08)];
  return [base[0] * v, base[1] * v, base[2] * v];
};

const SKY_TOP: V3 = [84, 136, 255];
const SKY_HORIZON: V3 = [200, 222, 255];
const VOID: V3 = [92, 118, 196];

export const drawParkour = (seed: number) => {
  const world = getWorld(seed);
  return (ctx: CanvasRenderingContext2D, t: number, W: number, H: number) => {
    const eye = positionAt(world, t);
    const ahead = [0.55, 0.8, 1.05].map((d) => positionAt(world, t + d));
    const target: V3 = [
      (ahead[0][0] + ahead[1][0] + ahead[2][0]) / 3,
      (ahead[0][1] + ahead[1][1] + ahead[2][1]) / 3 - 0.6,
      (ahead[0][2] + ahead[1][2] + ahead[2][2]) / 3,
    ];
    const cam: Camera = {
      x: eye[0],
      y: eye[1] + 1.62,
      z: eye[2] - 0.15,
      yaw: Math.atan2(target[0] - eye[0], target[2] - eye[2]),
      pitch: 0,
      focal: W * 1.22,
      cx: W / 2,
      cy: H / 2,
      near: 0.05,
    };
    const horiz = Math.hypot(target[0] - cam.x, target[2] - cam.z);
    cam.pitch = Math.max(-0.5, Math.min(-0.14, Math.atan2(target[1] - cam.y, horiz) * 0.85));

    // Sky and void.
    const horizonY = cam.cy + cam.focal * Math.tan(cam.pitch);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const hy = Math.max(0.02, Math.min(0.98, horizonY / H));
    g.addColorStop(0, rgb(...SKY_TOP));
    g.addColorStop(hy, rgb(...SKY_HORIZON));
    g.addColorStop(Math.min(1, hy + 0.25), rgb(...mix(SKY_HORIZON, VOID, 0.6)));
    g.addColorStop(1, rgb(...VOID));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Sun.
    const sunDir = 0.55;
    const sc = toCamera(cam, cam.x + Math.sin(sunDir) * 800, cam.y + 330, cam.z + Math.cos(sunDir) * 800);
    if (sc[2] > 1) {
      const [sx, sy] = projectCam(cam, sc);
      const s = 70;
      ctx.fillStyle = "rgba(255,255,220,0.25)";
      ctx.fillRect(sx - s * 1.8, sy - s * 1.8, s * 3.6, s * 3.6);
      ctx.fillStyle = "#FFFDE8";
      ctx.fillRect(sx - s, sy - s, s * 2, s * 2);
    }

    // Clouds: flat slabs drifting overhead.
    const cloudY = cam.y + 38;
    const cs = 12;
    const drift = t * 1.4;
    const gx0 = Math.floor((cam.x - 120 - drift) / cs);
    const gz0 = Math.floor((cam.z - 20) / cs);
    for (let gz = gz0; gz < gz0 + 14; gz++)
      for (let gx = gx0; gx < gx0 + 18; gx++) {
        if (hash3(gx, gz, seed) < 0.72) continue;
        const x0 = gx * cs + drift;
        const z0 = gz * cs;
        const dist = Math.hypot(x0 - cam.x, z0 - cam.z);
        const a = 0.7 * (1 - clamp01((dist - 70) / 120));
        if (a <= 0.02) continue;
        drawWorldPoly(
          ctx,
          cam,
          [
            [x0, cloudY, z0],
            [x0 + cs * 1.2, cloudY, z0],
            [x0 + cs * 1.2, cloudY, z0 + cs * 0.7],
            [x0, cloudY, z0 + cs * 0.7],
          ],
          `rgba(255,255,255,${a.toFixed(3)})`,
        );
      }

    // Gather visible blocks.
    const idx = routeIndexAt(world, t);
    const blocks: { b: Block; d: number; id: number }[] = [];
    for (let i = Math.max(0, idx - 3); i < Math.min(world.route.length, idx + 44); i++) {
      const b = world.route[i];
      blocks.push({ b, d: 0, id: i });
    }
    const zMin = cam.z - 12;
    const zMax = cam.z + 80;
    world.scenery.forEach((b, i) => {
      if (b.z > zMin && b.z < zMax) blocks.push({ b, d: 0, id: 100000 + i });
    });
    for (const item of blocks) {
      const b = item.b;
      item.d = Math.hypot(b.x + 0.5 - cam.x, b.y + 0.5 - cam.y, b.z + 0.5 - cam.z);
    }
    blocks.sort((p, q) => q.d - p.d);

    const fogStart = 24;
    const fogEnd = 95;
    for (const { b, d, id } of blocks) {
      const c0 = toCamera(cam, b.x + 0.5, b.y + 0.5, b.z + 0.5);
      if (c0[2] < -1.5) continue;
      const fog = clamp01((d - fogStart) / (fogEnd - fogStart)) * 0.78;
      const n = d < 9 ? 8 : d < 22 ? 4 : 1;
      const x0 = b.x;
      const x1 = b.x + 1;
      const y0 = b.y;
      const y1 = b.y + 1;
      const z0 = b.z;
      const z1 = b.z + 1;
      const occ = world.occupied;
      // face: 0 top, 1 -x, 2 +x, 3 -z, 4 +z, 5 bottom
      const faces: { face: number; A: V3; B: V3; D: V3; shade: number }[] = [];
      if (cam.y > y1 && !occ.has(key(b.x, b.y + 1, b.z))) faces.push({ face: 0, A: [x0, y1, z0], B: [x1, y1, z0], D: [x0, y1, z1], shade: 1 });
      if (cam.y < y0 && !occ.has(key(b.x, b.y - 1, b.z))) faces.push({ face: 5, A: [x0, y0, z0], B: [x1, y0, z0], D: [x0, y0, z1], shade: 0.5 });
      if (cam.x < x0 && !occ.has(key(b.x - 1, b.y, b.z))) faces.push({ face: 1, A: [x0, y1, z1], B: [x0, y1, z0], D: [x0, y0, z1], shade: 0.78 });
      if (cam.x > x1 && !occ.has(key(b.x + 1, b.y, b.z))) faces.push({ face: 2, A: [x1, y1, z0], B: [x1, y1, z1], D: [x1, y0, z0], shade: 0.78 });
      if (cam.z < z0 && !occ.has(key(b.x, b.y, b.z - 1))) faces.push({ face: 3, A: [x0, y1, z0], B: [x1, y1, z0], D: [x0, y0, z0], shade: 0.64 });
      if (cam.z > z1 && !occ.has(key(b.x, b.y, b.z + 1))) faces.push({ face: 4, A: [x1, y1, z1], B: [x0, y1, z1], D: [x1, y0, z1], shade: 0.64 });

      for (const f of faces) {
        const corner: V3 = [f.B[0] + f.D[0] - f.A[0], f.B[1] + f.D[1] - f.A[1], f.B[2] + f.D[2] - f.A[2]];
        const avg = cellColor(b, f.face, n >> 1, n >> 1, n, id);
        const baseCol = mix([avg[0] * f.shade, avg[1] * f.shade, avg[2] * f.shade], SKY_HORIZON, fog);
        const drew = drawWorldPoly(ctx, cam, [f.A, f.B, corner, f.D], rgb(...baseCol));
        if (!drew || n === 1) continue;
        const grid: V3[] = [];
        let behind = false;
        for (let j = 0; j <= n; j++)
          for (let i = 0; i <= n; i++) {
            const u = i / n;
            const v = j / n;
            const p = toCamera(
              cam,
              f.A[0] + (f.B[0] - f.A[0]) * u + (f.D[0] - f.A[0]) * v,
              f.A[1] + (f.B[1] - f.A[1]) * u + (f.D[1] - f.A[1]) * v,
              f.A[2] + (f.B[2] - f.A[2]) * u + (f.D[2] - f.A[2]) * v,
            );
            if (p[2] < cam.near) behind = true;
            grid.push(p);
          }
        if (behind) continue;
        const proj = grid.map((p) => projectCam(cam, p));
        const row = n + 1;
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            const c = cellColor(b, f.face, i, j, n, id);
            const col = mix([c[0] * f.shade, c[1] * f.shade, c[2] * f.shade], SKY_HORIZON, fog);
            fillPoly(ctx, [proj[j * row + i], proj[j * row + i + 1], proj[(j + 1) * row + i + 1], proj[(j + 1) * row + i]], rgb(...col));
          }
      }
    }

    // Soft vignette.
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  };
};
