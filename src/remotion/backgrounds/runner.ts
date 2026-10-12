import { mulberry32, hash3 } from "../lib/random";
import { type Camera, type V3, clamp01, drawWorldPoly, mix, projectCam, rgb, toCamera } from "./engine3d";

const LANES = [-2.6, 0, 2.6];
const SPEED = 15;

interface Row {
  z: number;
  /** Per lane: what stands there. */
  lanes: ("train" | "barrier" | null)[];
  trainLen: number[];
  runnerLane: number;
  jump: boolean;
  trainColor: number[];
}

interface Course {
  rows: Row[];
  coins: { lane: number; z: number }[];
  buildings: { side: -1 | 1; z: number; depth: number; width: number; height: number; color: V3 }[];
}

const TRAIN_COLORS: V3[] = [
  [220, 64, 52],
  [38, 120, 210],
  [242, 184, 36],
  [60, 170, 92],
  [130, 84, 200],
];
const BUILDING_COLORS: V3[] = [
  [236, 168, 120],
  [140, 196, 220],
  [232, 214, 150],
  [196, 150, 196],
  [158, 210, 160],
  [240, 140, 140],
  [210, 210, 220],
];

const buildCourse = (seed: number): Course => {
  const rng = mulberry32(seed * 104729 + 7);
  const rows: Row[] = [];
  const coins: Course["coins"] = [];
  let z = 46;
  let lane = 1;
  while (z < SPEED * 1500) {
    const lanes: Row["lanes"] = [null, null, null];
    const trainLen = [0, 0, 0];
    const trainColor = [0, 0, 0];
    let jump = false;
    const kind = rng();
    if (kind < 0.62) {
      const blocked = rng() < 0.55 ? 2 : 1;
      const free = Math.floor(rng() * 3);
      const order = [0, 1, 2].filter((l) => l !== free).sort(() => rng() - 0.5).slice(0, blocked);
      for (const l of order) {
        lanes[l] = "train";
        trainLen[l] = rng() < 0.5 ? 16 : 26;
        trainColor[l] = Math.floor(rng() * TRAIN_COLORS.length);
      }
      const freeLanes = [0, 1, 2].filter((l) => lanes[l] === null);
      lane = freeLanes.sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane))[0];
    } else if (kind < 0.82) {
      lanes[0] = lanes[1] = lanes[2] = "barrier";
      jump = true;
    } else {
      const tl = Math.floor(rng() * 3);
      lanes[tl] = "train";
      trainLen[tl] = 20;
      trainColor[tl] = Math.floor(rng() * TRAIN_COLORS.length);
      for (let l = 0; l < 3; l++) if (l !== tl) lanes[l] = "barrier";
      if (lane === tl) lane = tl === 1 ? 0 : 1;
      jump = true;
    }
    rows.push({ z, lanes, trainLen, runnerLane: lane, jump, trainColor });
    // Coins leading into the next obstacle along the runner's lane.
    const maxLen = Math.max(...trainLen, 3);
    const gap = 26 + Math.floor(rng() * 14);
    if (rng() < 0.7) for (let k = 0; k < 7; k++) coins.push({ lane, z: z + maxLen + 6 + k * 2.1 });
    z += maxLen + gap;
  }
  const buildings: Course["buildings"] = [];
  for (const side of [-1, 1] as const) {
    let bz = -10;
    while (bz < SPEED * 1500) {
      const depth = 7 + rng() * 9;
      buildings.push({
        side,
        z: bz,
        depth,
        width: 6 + rng() * 6,
        height: 5 + rng() * 16,
        color: BUILDING_COLORS[Math.floor(rng() * BUILDING_COLORS.length)],
      });
      bz += depth + 1.5 + rng() * 3;
    }
  }
  return { rows, coins, buildings };
};

const courses = new Map<number, Course>();
const getCourse = (seed: number) => {
  let c = courses.get(seed);
  if (!c) {
    c = buildCourse(seed);
    courses.set(seed, c);
  }
  return c;
};

const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

const rowIndexAfter = (rows: Row[], z: number) => {
  let lo = 0;
  let hi = rows.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].z + 6 < z) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

const runnerState = (c: Course, z: number) => {
  const i = rowIndexAfter(c.rows, z);
  const row = c.rows[i];
  const prevLane = i > 0 ? c.rows[i - 1].runnerLane : 1;
  const k = smooth((z - (row.z - 15)) / 4.5);
  const x = LANES[prevLane] + (LANES[row.runnerLane] - LANES[prevLane]) * k;
  let y = 0;
  if (row.jump) {
    const u = (z - (row.z - 5.2)) / 9.5;
    if (u > 0 && u < 1) y = 2.1 * 4 * u * (1 - u);
  }
  return { x, y, i };
};

const SKY_TOP: V3 = [70, 150, 245];
const HORIZON: V3 = [214, 234, 252];

type Drawable = { d: number; draw: () => void };

export const drawRunner = (seed: number) => {
  const course = getCourse(seed);
  return (ctx: CanvasRenderingContext2D, t: number, W: number, H: number) => {
    const rz = t * SPEED + 2;
    const r = runnerState(course, rz);
    const cam: Camera = {
      x: r.x * 0.55,
      y: 3.5 + r.y * 0.35,
      z: rz - 7.8,
      yaw: 0,
      pitch: -0.2,
      focal: Math.min(W * 0.92, H * 0.75),
      cx: W / 2,
      cy: 0,
      near: 0.1,
    };
    // Keep the runner's feet near 74% of the frame height for any aspect ratio.
    cam.cy = H * 0.74 - cam.focal * 0.43;
    const far = 150;
    const fogOf = (z: number) => clamp01((z - cam.z - 40) / (far - 40)) * 0.85;
    const shade = (c: V3, k: number, z: number) => rgb(...mix([c[0] * k, c[1] * k, c[2] * k], HORIZON, fogOf(z)));

    // Sky.
    const horizonY = cam.cy + cam.focal * Math.tan(cam.pitch);
    const g = ctx.createLinearGradient(0, 0, 0, horizonY);
    g.addColorStop(0, rgb(...SKY_TOP));
    g.addColorStop(1, rgb(...HORIZON));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizonY + 2);
    // Puffy clouds with parallax.
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 7; i++) {
      const cx = ((i * 380 - t * 18 + hash3(i, seed, 1) * 300) % (W + 600)) - 300;
      const cy = horizonY * (0.15 + hash3(i, seed, 2) * 0.55);
      const s = 50 + hash3(i, seed, 3) * 60;
      ctx.beginPath();
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.9, cy + s * 0.2, s * 0.8, 0, Math.PI * 2);
      ctx.arc(cx - s * 0.9, cy + s * 0.25, s * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.2, cy - s * 0.45, s * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground plane.
    ctx.fillStyle = rgb(...mix([118, 150, 92], HORIZON, 0.35));
    ctx.fillRect(0, horizonY, W, H - horizonY);
    const zN = cam.z + 0.2;
    for (let z = Math.floor(zN / 10) * 10; z < cam.z + far; z += 10) {
      const z0 = Math.max(z, zN);
      const z1 = z + 10;
      drawWorldPoly(ctx, cam, [[-4.3, 0, z0], [4.3, 0, z0], [4.3, 0, z1], [-4.3, 0, z1]], shade([146, 128, 112], 1, z0));
      for (const s of [-1, 1]) {
        drawWorldPoly(ctx, cam, [[s * 4.3, 0, z0], [s * 6, 0, z0], [s * 6, 0, z1], [s * 4.3, 0, z1]], shade([170, 170, 170], 1, z0));
      }
    }
    // Sleepers and rails.
    for (const x0 of LANES) {
      const start = Math.floor(zN / 1.3) * 1.3;
      for (let z = start; z < cam.z + 90; z += 1.3) {
        if (z < zN) continue;
        drawWorldPoly(ctx, cam, [[x0 - 0.95, 0.02, z], [x0 + 0.95, 0.02, z], [x0 + 0.95, 0.02, z + 0.38], [x0 - 0.95, 0.02, z + 0.38]], shade([112, 78, 54], 1, z));
      }
      for (const rx of [-0.6, 0.6]) {
        for (let z = Math.floor(zN / 8) * 8; z < cam.z + far; z += 8) {
          const z0 = Math.max(z, zN);
          drawWorldPoly(ctx, cam, [[x0 + rx - 0.06, 0.1, z0], [x0 + rx + 0.06, 0.1, z0], [x0 + rx + 0.06, 0.1, z + 8], [x0 + rx - 0.06, 0.1, z + 8]], shade([206, 208, 214], 1, z0));
        }
      }
    }

    const items: Drawable[] = [];
    const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: V3, extra?: (face: string) => void) => {
      const cz = Math.max(z0, cam.z + 0.5);
      if (z1 < cam.z + 0.3 || z0 > cam.z + far) return;
      const d = Math.hypot((x0 + x1) / 2 - cam.x, (z0 + z1) / 2 - cam.z) + (z1 - z0) * 0.25;
      items.push({
        d,
        draw: () => {
          if (cam.y > y1) drawWorldPoly(ctx, cam, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], shade(color, 1.08, cz));
          if (cam.x < x0) drawWorldPoly(ctx, cam, [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]], shade(color, 0.78, cz));
          if (cam.x > x1) drawWorldPoly(ctx, cam, [[x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [x1, y0, z0]], shade(color, 0.78, cz));
          if (cam.z < z0) drawWorldPoly(ctx, cam, [[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], shade(color, 0.92, z0));
          extra?.("all");
        },
      });
    };

    // Buildings.
    for (const b of course.buildings) {
      if (b.z + b.depth < cam.z || b.z > cam.z + far) continue;
      const inner = b.side * 6.4;
      const outer = b.side * (6.4 + b.width);
      const x0 = Math.min(inner, outer);
      const x1 = Math.max(inner, outer);
      box(x0, x1, 0, b.height, b.z, b.z + b.depth, b.color, () => {
        // Windows on the face that looks at the tracks.
        const fx = b.side < 0 ? x1 : x0;
        if ((b.side < 0 && cam.x > fx) || (b.side > 0 && cam.x < fx)) {
          for (let wy = 1.6; wy < b.height - 1; wy += 2.4)
            for (let wz = b.z + 1; wz < b.z + b.depth - 1; wz += 2.2) {
              drawWorldPoly(ctx, cam, [[fx, wy + 1.2, wz], [fx, wy + 1.2, wz + 1.2], [fx, wy, wz + 1.2], [fx, wy, wz]], shade([70, 96, 130], 1, wz));
            }
        }
      });
    }

    // Obstacles.
    const first = rowIndexAfter(course.rows, cam.z - 30);
    for (let i = first; i < course.rows.length && course.rows[i].z < cam.z + far; i++) {
      const row = course.rows[i];
      row.lanes.forEach((what, l) => {
        const x = LANES[l];
        if (what === "train") {
          const len = row.trainLen[l];
          const col = TRAIN_COLORS[row.trainColor[l]];
          box(x - 1.2, x + 1.2, 0.15, 3.7, row.z, row.z + len, col, () => {
            if (cam.z < row.z) {
              const z = row.z - 0.01;
              drawWorldPoly(ctx, cam, [[x - 0.95, 3.3, z], [x + 0.95, 3.3, z], [x + 0.95, 2.2, z], [x - 0.95, 2.2, z]], shade([40, 52, 70], 1, z));
              drawWorldPoly(ctx, cam, [[x - 1.2, 1.25, z], [x + 1.2, 1.25, z], [x + 1.2, 0.95, z], [x - 1.2, 0.95, z]], shade([250, 250, 250], 1, z));
              for (const hx of [-0.75, 0.75]) {
                const p = toCamera(cam, x + hx, 0.7, z);
                if (p[2] > cam.near) {
                  const [sx, sy] = projectCam(cam, p);
                  ctx.fillStyle = "#FFF3B0";
                  ctx.beginPath();
                  ctx.arc(sx, sy, (cam.focal * 0.17) / p[2], 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
            const sx = cam.x < x - 1.2 ? x - 1.21 : cam.x > x + 1.2 ? x + 1.21 : null;
            if (sx !== null) {
              for (let wz = row.z + 1.2; wz < row.z + len - 1; wz += 2.6) {
                drawWorldPoly(ctx, cam, [[sx, 3.0, wz], [sx, 3.0, wz + 1.6], [sx, 2.0, wz + 1.6], [sx, 2.0, wz]], shade([44, 60, 84], 1, wz));
              }
            }
          });
        } else if (what === "barrier") {
          const z = row.z;
          if (z < cam.z + 0.5) return;
          items.push({
            d: Math.hypot(x - cam.x, z - cam.z),
            draw: () => {
              for (const px of [-0.9, 0.9]) {
                drawWorldPoly(ctx, cam, [[x + px - 0.08, 1.2, z], [x + px + 0.08, 1.2, z], [x + px + 0.08, 0, z], [x + px - 0.08, 0, z]], shade([90, 90, 90], 1, z));
              }
              for (let s = 0; s < 6; s++) {
                const a = x - 1.1 + (s * 2.2) / 6;
                drawWorldPoly(ctx, cam, [[a, 1.25, z], [a + 2.2 / 6, 1.25, z], [a + 2.2 / 6, 0.75, z], [a, 0.75, z]], shade(s % 2 ? [250, 250, 250] : [226, 52, 48], 1, z));
              }
            },
          });
        }
      });
    }

    // Coins.
    for (const c of course.coins) {
      if (c.z < rz + 0.6 || c.z > cam.z + 90) continue;
      const p = toCamera(cam, LANES[c.lane], 1.05 + Math.sin(c.z + t * 4) * 0.08, c.z);
      if (p[2] < cam.near) continue;
      items.push({
        d: Math.hypot(LANES[c.lane] - cam.x, c.z - cam.z),
        draw: () => {
          const [sx, sy] = projectCam(cam, p);
          const rad = (cam.focal * 0.42) / p[2];
          const spin = Math.abs(Math.cos(t * 5 + c.z * 0.7));
          ctx.save();
          ctx.translate(sx, sy);
          ctx.scale(Math.max(0.12, spin), 1);
          const fog = fogOf(c.z);
          ctx.fillStyle = rgb(...mix([214, 150, 20], HORIZON, fog));
          ctx.beginPath();
          ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = rgb(...mix([255, 214, 64], HORIZON, fog));
          ctx.beginPath();
          ctx.arc(0, 0, rad * 0.78, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        },
      });
    }

    items.sort((a, b) => b.d - a.d);
    // The runner is always the closest object; draw everything else first.
    for (const it of items) it.draw();

    // Runner, drawn as a sprite seen from behind.
    const foot = toCamera(cam, r.x, r.y, rz);
    const ground = toCamera(cam, r.x, 0.02, rz);
    if (foot[2] > cam.near) {
      const [fx, fy] = projectCam(cam, foot);
      const [gx, gy] = projectCam(cam, ground);
      const s = cam.focal / foot[2];
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(gx, gy, s * 0.55 * (1 - r.y * 0.12), s * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      drawRunnerSprite(ctx, fx, fy, s, t, r.y > 0.05);
    }
  };
};

const drawRunnerSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, airborne: boolean) => {
  const phase = t * 13;
  const swing = airborne ? 0.4 : Math.sin(phase);
  const u = s / 100; // 1 world unit = 100 sprite units
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(u, u);
  const bob = airborne ? 0 : Math.abs(Math.sin(phase)) * -6;
  ctx.translate(0, bob);
  const limb = (lx: number, ly: number, len: number, w: number, angle: number, color: string, shoe?: string) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-w / 2, 0, w, len, w / 2);
    ctx.fill();
    if (shoe) {
      ctx.fillStyle = shoe;
      ctx.beginPath();
      ctx.roundRect(-w / 2 - 3, len - 10, w + 6, 18, 8);
      ctx.fill();
      ctx.fillStyle = "#e23b3b";
      ctx.fillRect(-w / 2 - 3, len + 2, w + 6, 5);
    }
    ctx.restore();
  };
  // Legs (back view: alternate lift).
  const legLift = (side: number) => (airborne ? -18 : Math.max(0, side * swing) * -26);
  limb(-15, -88 + legLift(1), 82, 24, airborne ? 0.25 : 0, "#2f4f86", "#f4f4f4");
  limb(15, -88 + legLift(-1), 82, 24, airborne ? -0.25 : 0, "#2f4f86", "#f4f4f4");
  // Arms.
  limb(-38, -150, 62, 18, 0.25 + swing * 0.5, "#e8562f");
  limb(38, -150, 62, 18, -0.25 - swing * 0.5, "#e8562f");
  // Torso (hoodie) and backpack.
  ctx.fillStyle = "#f2683c";
  ctx.beginPath();
  ctx.roundRect(-36, -160, 72, 82, 22);
  ctx.fill();
  ctx.fillStyle = "#2b2d42";
  ctx.beginPath();
  ctx.roundRect(-27, -148, 54, 56, 14);
  ctx.fill();
  ctx.fillStyle = "#3d405b";
  ctx.fillRect(-20, -128, 40, 6);
  // Head with backwards cap.
  ctx.fillStyle = "#6b3e26";
  ctx.beginPath();
  ctx.arc(0, -184, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f8ef1";
  ctx.beginPath();
  ctx.arc(0, -190, 27, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-14, -172, 28, 10);
  ctx.restore();
};
