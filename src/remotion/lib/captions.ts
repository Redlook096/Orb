import type { CaptionStyleId, WordTiming } from "./types";

export interface CaptionPage {
  words: WordTiming[];
  start: number;
  end: number;
}

const endsSentence = (w: string) => /[.!?]["')\]]*$/.test(w);
const endsClause = (w: string) => /[,;:]["')\]]*$/.test(w);

/** Groups timed words into short on-screen pages, breaking at punctuation and pauses. */
export const buildPages = (words: WordTiming[], maxWords: number, maxChars = 22): CaptionPage[] => {
  const pages: CaptionPage[] = [];
  let cur: WordTiming[] = [];
  const flush = () => {
    if (cur.length) pages.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const chars = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
    if (
      cur.length > 0 &&
      (cur.length >= maxWords ||
        chars > maxChars ||
        (prev && (endsSentence(prev.text) || w.start - prev.end > 0.45)) ||
        (prev && endsClause(prev.text) && cur.length >= 2))
    ) {
      flush();
    }
    cur.push(w);
  });
  flush();
  // Hold each page until the next begins (bounded), so text never flickers off between words.
  for (let i = 0; i < pages.length; i++) {
    const next = pages[i + 1];
    const hold = next ? Math.min(next.start, pages[i].end + 0.6) : pages[i].end + 0.5;
    pages[i].end = Math.max(pages[i].end, hold);
  }
  return pages;
};

export interface CaptionStyle {
  name: string;
  font: string;
  weight: number;
  size: number;
  fill: string;
  stroke: number;
  strokeColor: string;
  /** Extra text-shadow appended after the outline ring. */
  shadow?: string;
  letterSpacing?: number;
  /** How the active word is emphasised. */
  active: "color" | "box" | "karaoke" | "glow" | "none";
  anim: "pop" | "bounce" | "fade" | "slam" | "rise";
  tilt?: number;
  defaultMaxWords: number;
  defaultUppercase: boolean;
  defaultHighlight: string;
  /** Show only the word being spoken. */
  single?: boolean;
  extrude?: boolean;
}

export const CAPTION_STYLES: Record<CaptionStyleId, CaptionStyle> = {
  classic: {
    name: "Classic",
    font: "Montserrat",
    weight: 900,
    size: 92,
    fill: "#FFFFFF",
    stroke: 11,
    strokeColor: "#000000",
    shadow: "0 8px 18px rgba(0,0,0,0.45)",
    active: "color",
    anim: "pop",
    defaultMaxWords: 3,
    defaultUppercase: true,
    defaultHighlight: "#FFE135",
  },
  hormozi: {
    name: "Hormozi",
    font: "Montserrat",
    weight: 900,
    size: 98,
    fill: "#FFFFFF",
    stroke: 10,
    strokeColor: "#000000",
    shadow: "0 10px 0 rgba(0,0,0,0.55)",
    active: "color",
    anim: "bounce",
    tilt: 2.2,
    defaultMaxWords: 2,
    defaultUppercase: true,
    defaultHighlight: "#3CFF6B",
  },
  beast: {
    name: "Beast",
    font: "Bangers",
    weight: 400,
    size: 132,
    fill: "#FFFFFF",
    stroke: 12,
    strokeColor: "#000000",
    shadow: "0 10px 0 #000000",
    letterSpacing: 3,
    active: "color",
    anim: "slam",
    defaultMaxWords: 2,
    defaultUppercase: true,
    defaultHighlight: "#FF2E4C",
  },
  karaoke: {
    name: "Karaoke",
    font: "Poppins",
    weight: 800,
    size: 84,
    fill: "#FFFFFF",
    stroke: 9,
    strokeColor: "#000000",
    shadow: "0 6px 14px rgba(0,0,0,0.5)",
    active: "karaoke",
    anim: "rise",
    defaultMaxWords: 4,
    defaultUppercase: false,
    defaultHighlight: "#00E5FF",
  },
  box: {
    name: "Highlight Box",
    font: "Poppins",
    weight: 800,
    size: 82,
    fill: "#FFFFFF",
    stroke: 0,
    strokeColor: "#000000",
    shadow: "0 6px 20px rgba(0,0,0,0.65)",
    active: "box",
    anim: "pop",
    defaultMaxWords: 3,
    defaultUppercase: true,
    defaultHighlight: "#7C3AED",
  },
  minimal: {
    name: "Minimal",
    font: "Inter",
    weight: 700,
    size: 66,
    fill: "#FFFFFF",
    stroke: 0,
    strokeColor: "#000000",
    shadow: "0 3px 6px rgba(0,0,0,0.8), 0 6px 28px rgba(0,0,0,0.6)",
    active: "none",
    anim: "fade",
    defaultMaxWords: 6,
    defaultUppercase: false,
    defaultHighlight: "#FFFFFF",
  },
  neon: {
    name: "Neon",
    font: "Montserrat",
    weight: 800,
    size: 88,
    fill: "#FFFFFF",
    stroke: 0,
    strokeColor: "#000000",
    active: "glow",
    anim: "pop",
    defaultMaxWords: 3,
    defaultUppercase: true,
    defaultHighlight: "#FF2BD6",
  },
  marker: {
    name: "Marker",
    font: '"Permanent Marker"',
    weight: 400,
    size: 98,
    fill: "#FFFFFF",
    stroke: 9,
    strokeColor: "#000000",
    shadow: "0 8px 0 rgba(0,0,0,0.6)",
    active: "color",
    anim: "bounce",
    tilt: 3,
    defaultMaxWords: 3,
    defaultUppercase: false,
    defaultHighlight: "#FFD60A",
  },
  single: {
    name: "One Word",
    font: "Anton",
    weight: 400,
    size: 168,
    fill: "#FFFFFF",
    stroke: 12,
    strokeColor: "#000000",
    shadow: "0 12px 24px rgba(0,0,0,0.5)",
    letterSpacing: 2,
    active: "color",
    anim: "slam",
    single: true,
    defaultMaxWords: 1,
    defaultUppercase: true,
    defaultHighlight: "#FFE135",
  },
  pop3d: {
    name: "3D Pop",
    font: "Montserrat",
    weight: 900,
    size: 96,
    fill: "#FFFFFF",
    stroke: 7,
    strokeColor: "#111111",
    active: "color",
    anim: "bounce",
    extrude: true,
    defaultMaxWords: 2,
    defaultUppercase: true,
    defaultHighlight: "#FF9F1C",
  },
};

/** A round outline drawn with a ring of text-shadows, which avoids the miter spikes of text-stroke. */
export const outlineShadow = (width: number, color: string): string[] => {
  if (width <= 0) return [];
  const out: string[] = [];
  const rings = width > 6 ? [width, width * 0.6] : [width];
  for (const r of rings) {
    const steps = Math.max(16, Math.round(r * 2.4));
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      out.push(`${(Math.cos(a) * r).toFixed(2)}px ${(Math.sin(a) * r).toFixed(2)}px 0 ${color}`);
    }
  }
  return out;
};
