/** A tiny software 3D projector for canvas-drawn backgrounds. */
export interface Camera {
  x: number;
  y: number;
  z: number;
  /** Radians; 0 looks toward +z, positive turns toward +x. */
  yaw: number;
  /** Radians; positive looks up. */
  pitch: number;
  focal: number;
  cx: number;
  cy: number;
  near: number;
}

export type V3 = [number, number, number];
export type V2 = [number, number];

export const toCamera = (c: Camera, x: number, y: number, z: number): V3 => {
  const dx = x - c.x;
  const dy = y - c.y;
  const dz = z - c.z;
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  const x1 = dx * cy - dz * sy;
  const z1 = dx * sy + dz * cy;
  const cp = Math.cos(c.pitch);
  const sp = Math.sin(c.pitch);
  return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp];
};

export const projectCam = (c: Camera, p: V3): V2 => [c.cx + (c.focal * p[0]) / p[2], c.cy - (c.focal * p[1]) / p[2]];

/** Clips a camera-space polygon against the near plane (Sutherland–Hodgman). */
export const clipNear = (poly: V3[], near: number): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ain = a[2] >= near;
    const bin = b[2] >= near;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (near - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, near]);
    }
  }
  return out;
};

export const fillPoly = (ctx: CanvasRenderingContext2D, pts: V2[], color: string) => {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
};

/** Projects and fills a world-space polygon, clipping it if it crosses the camera plane. */
export const drawWorldPoly = (ctx: CanvasRenderingContext2D, c: Camera, world: V3[], color: string): boolean => {
  const cam = world.map((p) => toCamera(c, p[0], p[1], p[2]));
  const clipped = cam.some((p) => p[2] < c.near) ? clipNear(cam, c.near) : cam;
  if (clipped.length < 3) return false;
  fillPoly(ctx, clipped.map((p) => projectCam(c, p)), color);
  return true;
};

export const rgb = (r: number, g: number, b: number) =>
  `rgb(${Math.max(0, Math.min(255, r)) | 0},${Math.max(0, Math.min(255, g)) | 0},${Math.max(0, Math.min(255, b)) | 0})`;

export const hexToRgb = (hex: string): V3 => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
