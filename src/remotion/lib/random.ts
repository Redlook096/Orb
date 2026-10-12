/** Small deterministic PRNG so every frame renders identically on every machine. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const fmix = (h: number) => {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return h ^ (h >>> 16);
};

/** Well-mixed hash of three integers to [0, 1). */
export const hash3 = (a: number, b: number, c: number): number => {
  let h = fmix(Math.imul(a | 0, 0x9e3779b1) ^ 0x2545f491);
  h = fmix(h ^ Math.imul(b | 0, 0x27d4eb2d));
  h = fmix(h ^ Math.imul(c | 0, 0x165667b1));
  return (h >>> 0) / 4294967296;
};

export const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
