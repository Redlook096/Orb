#!/usr/bin/env node
// Synthesizes Orb's sound effects and royalty-free music beds from scratch.
// Output: public/sfx/*.mp3 and public/music/*.mp3 (needs ffmpeg on PATH).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;

// ---------- utilities ----------
let seed = 1234567;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const NOTE = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
const n = (name) => {
  const m = name.match(/^([A-G][#b]?)(-?\d)$/);
  return 12 * (Number(m[2]) + 1) + NOTE[m[1]];
};

const writeWav = (path, channels) => {
  const len = channels[0].length;
  const nc = channels.length;
  const b = Buffer.alloc(44 + len * nc * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + len * nc * 2, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(nc, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * nc * 2, 28);
  b.writeUInt16LE(nc * 2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(len * nc * 2, 40);
  let o = 44;
  for (let i = 0; i < len; i++)
    for (let c = 0; c < nc; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      b.writeInt16LE(Math.round(v * 32767), o);
      o += 2;
    }
  writeFileSync(path, b);
};

const normalize = (chs, peak = 0.89) => {
  let m = 0;
  for (const ch of chs) for (const v of ch) m = Math.max(m, Math.abs(v));
  if (m > 0) for (const ch of chs) for (let i = 0; i < ch.length; i++) ch[i] *= peak / m;
  return chs;
};

const exportMp3 = (name, chs, dir, bitrate = "128k", loudness = null) => {
  const tmp = join(tmpdir(), `orb-${name}-${process.pid}.wav`);
  writeWav(tmp, chs);
  mkdirSync(dir, { recursive: true });
  const filters = loudness ? ["-af", `loudnorm=I=${loudness}:TP=-1.5:LRA=11`, "-ar", String(SR)] : [];
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, ...filters, "-codec:a", "libmp3lame", "-b:a", bitrate, join(dir, `${name}.mp3`)]);
  rmSync(tmp);
  console.log(`  ${dir.replace(ROOT + "/", "")}/${name}.mp3`);
};

// One-pole filters.
const lowpass = (x, cutoff) => {
  const a = Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) x[i] = y = (1 - a) * x[i] + a * y;
  return x;
};
const highpass = (x, cutoff) => {
  const a = Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  let px = 0;
  for (let i = 0; i < x.length; i++) {
    y = a * (y + x[i] - px);
    px = x[i];
    x[i] = y;
  }
  return x;
};

// Schroeder reverb returning a stereo wet signal.
const reverb = (x, size = 1, damp = 0.3) => {
  const out = [new Float32Array(x.length), new Float32Array(x.length)];
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116];
  const aps = [225, 556, 441, 341];
  for (let c = 0; c < 2; c++) {
    const wet = new Float32Array(x.length);
    combs.forEach((d0) => {
      const d = Math.round((d0 + c * 23) * size);
      const line = new Float32Array(d);
      let idx = 0;
      let filt = 0;
      const fb = 0.84;
      for (let i = 0; i < x.length; i++) {
        const y = line[idx];
        filt = y * (1 - damp) + filt * damp;
        line[idx] = x[i] + filt * fb;
        idx = (idx + 1) % d;
        wet[i] += y;
      }
    });
    aps.forEach((d0) => {
      const d = Math.round((d0 + c * 13) * size);
      const line = new Float32Array(d);
      let idx = 0;
      for (let i = 0; i < x.length; i++) {
        const b = line[idx];
        const y = -wet[i] + b;
        line[idx] = wet[i] + b * 0.5;
        idx = (idx + 1) % d;
        wet[i] = y;
      }
    });
    for (let i = 0; i < x.length; i++) out[c][i] = wet[i] * 0.12;
  }
  return out;
};

const add = (dst, src, at = 0, gain = 1) => {
  const o = Math.round(at * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) if (o + i >= 0) dst[o + i] += src[i] * gain;
};

// ---------- instruments ----------
const env = (i, a, d, total) => {
  const t = i / SR;
  if (t < a) return t / a;
  return Math.exp(-(t - a) / d) * (t < total ? 1 : Math.max(0, 1 - (t - total) / 0.05));
};

const kick = (punch = 1) => {
  const x = buf(0.45);
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const f = 48 + 110 * Math.exp(-t * 28) * punch;
    ph += (2 * Math.PI * f) / SR;
    x[i] = Math.sin(ph) * Math.exp(-t * 7.5) + (i < 80 ? noise() * 0.4 * (1 - i / 80) : 0);
  }
  return x;
};
const snare = () => {
  const x = buf(0.3);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] = noise() * Math.exp(-t * 18) * 0.8 + Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 25) * 0.6;
  }
  return highpass(x, 400);
};
const clap = () => {
  const x = buf(0.3);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const burst = [0, 0.011, 0.022].reduce((a, o) => a + (t >= o ? Math.exp(-(t - o) * 90) : 0), 0);
    x[i] = noise() * (burst * 0.5 + Math.exp(-t * 14) * 0.5);
  }
  return highpass(lowpass(x, 5200), 700);
};
const hat = (open = false) => {
  const x = buf(open ? 0.25 : 0.06);
  for (let i = 0; i < x.length; i++) x[i] = noise() * Math.exp(-(i / SR) * (open ? 14 : 70));
  return highpass(x, 7000);
};
const cowbell = (freq = 1) => {
  const x = buf(0.35);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const s = Math.sign(Math.sin(2 * Math.PI * 540 * freq * t)) + Math.sign(Math.sin(2 * Math.PI * 800 * freq * t));
    x[i] = s * 0.35 * Math.exp(-t * 9);
  }
  return lowpass(highpass(x, 600), 3500);
};
const bass808 = (note, dur, slideFrom = null) => {
  const x = buf(dur + 0.1);
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const target = midi(note);
    const f = slideFrom ? midi(slideFrom) + (target - midi(slideFrom)) * Math.min(1, t / 0.08) : target;
    ph += (2 * Math.PI * f) / SR;
    x[i] = Math.tanh(Math.sin(ph) * 1.8) * env(i, 0.005, dur * 0.9, dur);
  }
  return x;
};
const subBass = (note, dur) => {
  const x = buf(dur);
  const f = midi(note);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * env(i, 0.01, dur * 0.6, dur - 0.05);
  }
  return x;
};
const pluck = (note, dur = 0.8, bright = 0.5) => {
  // Karplus–Strong.
  const f = midi(note);
  const p = Math.round(SR / f);
  const line = new Float32Array(p).map(() => noise());
  const x = buf(dur);
  let idx = 0;
  for (let i = 0; i < x.length; i++) {
    const a = line[idx];
    const b = line[(idx + 1) % p];
    line[idx] = (a * bright + b * (1 - bright)) * 0.996;
    x[i] = a;
    idx = (idx + 1) % p;
  }
  return lowpass(x, 4200);
};
const epiano = (note, dur, vel = 1) => {
  const f = midi(note);
  const x = buf(dur + 0.6);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const idxm = 1.6 * Math.exp(-t * 5);
    const m = Math.sin(2 * Math.PI * f * t) * idxm;
    const v = Math.sin(2 * Math.PI * f * t + m) + 0.18 * Math.sin(2 * Math.PI * f * 4 * t) * Math.exp(-t * 9);
    x[i] = v * vel * env(i, 0.004, 1.1, dur) * (1 + 0.03 * Math.sin(2 * Math.PI * 5 * t));
  }
  return x;
};
const pad = (notes, dur, bright = 1800) => {
  const x = buf(dur + 1);
  for (const note of notes) {
    const f = midi(note);
    for (const det of [-0.12, 0.08, 0.15]) {
      const ff = f * Math.pow(2, det / 12);
      let ph = rand();
      for (let i = 0; i < x.length; i++) {
        ph += ff / SR;
        const saw = 2 * (ph - Math.floor(ph)) - 1;
        const t = i / SR;
        const a = Math.min(1, t / 0.9) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 1));
        x[i] += saw * a * 0.12;
      }
    }
  }
  return lowpass(lowpass(x, bright), bright * 1.4);
};
const bell = (freq, dur = 1.6) => {
  const x = buf(dur);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] =
      Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3) +
      0.5 * Math.sin(2 * Math.PI * freq * 2.76 * t) * Math.exp(-t * 6) +
      0.25 * Math.sin(2 * Math.PI * freq * 5.4 * t) * Math.exp(-t * 10);
  }
  return x;
};

// ---------- sound effects ----------
const sfx = {
  pop: () => {
    const x = buf(0.14);
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (420 + 1600 * (1 - Math.exp(-t * 60)))) / SR;
      x[i] = Math.sin(ph) * Math.exp(-t * 38);
    }
    return [x];
  },
  send: () => {
    const x = buf(0.32);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      x[i] = noise() * Math.sin(Math.PI * Math.min(1, t / 0.3)) * 0.5;
    }
    const swoosh = highpass(lowpass(x, 3000), 900);
    const tone = buf(0.32);
    let ph = 0;
    for (let i = 0; i < tone.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (700 + 900 * t)) / SR;
      tone[i] = Math.sin(ph) * Math.exp(-t * 14) * 0.5;
    }
    add(swoosh, tone, 0.12);
    return [swoosh];
  },
  receive: () => {
    const x = buf(0.6);
    add(x, bell(1318.5, 0.5), 0, 0.6);
    add(x, bell(1760, 0.45), 0.11, 0.6);
    return [x];
  },
  notify: () => {
    const x = buf(0.9);
    add(x, bell(988, 0.8), 0, 0.6);
    add(x, bell(1318.5, 0.7), 0.14, 0.55);
    return [x];
  },
  whoosh: () => {
    const x = buf(0.55);
    const a = Math.exp((-2 * Math.PI * 600) / SR);
    let y = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      const cutoff = 300 + 4500 * Math.sin(Math.PI * Math.min(1, t / 0.55));
      const k = Math.exp((-2 * Math.PI * cutoff) / SR);
      y = (1 - k) * noise() + k * y;
      x[i] = y * Math.sin(Math.PI * Math.min(1, t / 0.55)) * 2.2;
    }
    void a;
    return [highpass(x, 150)];
  },
  swoosh: () => {
    const x = buf(0.28);
    let y = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      const k = Math.exp((-2 * Math.PI * (800 + 6000 * (t / 0.28))) / SR);
      y = (1 - k) * noise() + k * y;
      x[i] = y * Math.sin(Math.PI * (t / 0.28)) * 1.6;
    }
    return [highpass(x, 400)];
  },
  ding: () => [bell(1046.5, 1.6)],
  tick: () => {
    const x = buf(0.06);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      x[i] = (noise() * 0.6 + Math.sin(2 * Math.PI * 2900 * t)) * Math.exp(-t * 160);
    }
    return [highpass(x, 1200)];
  },
  correct: () => {
    const x = buf(0.9);
    ["C6", "E6", "G6", "C7"].forEach((nn, k) => add(x, bell(midi(n(nn)), 0.7), k * 0.075, 0.45));
    return [x];
  },
  wrong: () => {
    const x = buf(0.5);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      const s = Math.sign(Math.sin(2 * Math.PI * 140 * t)) + Math.sign(Math.sin(2 * Math.PI * 147 * t));
      x[i] = s * 0.4 * (t < 0.42 ? 1 : 0) * Math.min(1, t / 0.01);
    }
    return [lowpass(x, 1800)];
  },
  typing: () => {
    const x = buf(0.7);
    let t = 0.02;
    while (t < 0.62) {
      const c = buf(0.03);
      for (let i = 0; i < c.length; i++) c[i] = noise() * Math.exp(-(i / SR) * 260);
      add(x, highpass(c, 2500), t, 0.5 + rand() * 0.4);
      t += 0.07 + rand() * 0.07;
    }
    return [x];
  },
};

// ---------- music ----------
const makeTrack = (bpm, bars, build) => {
  const beat = 60 / bpm;
  const len = bars * 4 * beat;
  const L = buf(len + 2);
  const R = buf(len + 2);
  const send = buf(len + 2);
  const api = {
    beat,
    // pan: -1..1
    put(x, at, gain = 1, pan = 0, rev = 0) {
      add(L, x, at, gain * Math.min(1, 1 - pan));
      add(R, x, at, gain * Math.min(1, 1 + pan));
      if (rev) add(send, x, at, gain * rev);
    },
  };
  build(api);
  const [wl, wr] = reverb(send, 1.15, 0.35);
  for (let i = 0; i < L.length; i++) {
    L[i] += wl[i];
    R[i] += wr[i];
  }
  // Fold the reverb tail back to the start so the loop is seamless.
  const n0 = Math.round(len * SR);
  for (let i = n0; i < L.length; i++) {
    L[i - n0] += L[i];
    R[i - n0] += R[i];
  }
  const outL = L.slice(0, n0);
  const outR = R.slice(0, n0);
  // Gentle bus saturation.
  for (let i = 0; i < n0; i++) {
    outL[i] = Math.tanh(outL[i] * 1.2);
    outR[i] = Math.tanh(outR[i] * 1.2);
  }
  return normalize([outL, outR]);
};

const chord = (root, quality) => {
  const r = n(root);
  const shapes = {
    maj: [0, 4, 7],
    min: [0, 3, 7],
    maj7: [0, 4, 7, 11],
    min7: [0, 3, 7, 10],
    dom7: [0, 4, 7, 10],
    min9: [0, 3, 7, 10, 14],
    maj9: [0, 4, 7, 11, 14],
  };
  return shapes[quality].map((s) => r + s);
};

const music = {
  suspense: () =>
    makeTrack(84, 16, ({ beat, put }) => {
      const prog = [chord("D3", "min"), chord("Bb2", "maj"), chord("G2", "min"), chord("A2", "maj")];
      for (let bar = 0; bar < 16; bar++) {
        const c = prog[Math.floor(bar / 2) % 4];
        const t0 = bar * 4 * beat;
        if (bar % 2 === 0) put(pad(c, 8 * beat, 900), t0, 0.5, 0, 0.6);
        for (let e = 0; e < 8; e++) put(subBass(c[0] - 12, beat * 0.45), t0 + e * beat * 0.5, e % 2 ? 0.35 : 0.55);
        if (bar >= 2) {
          put(kick(0.8), t0, 0.7);
          put(kick(0.8), t0 + 2.5 * beat, 0.5);
          for (let q = 0; q < 8; q++) put(hat(), t0 + q * beat * 0.5, 0.12, 0.3);
        }
        if (bar >= 4 && bar % 2 === 1) {
          const arp = [c[0] + 24, c[1] + 24, c[2] + 24, c[1] + 24];
          arp.forEach((note, k) => put(epiano(note, beat * 0.8, 0.5), t0 + k * beat, 0.35, k % 2 ? 0.4 : -0.4, 0.7));
        }
        if (bar >= 8) put(snare(), t0 + 3 * beat, 0.25, 0, 0.4);
      }
    }),
  lofi: () =>
    makeTrack(80, 16, ({ beat, put }) => {
      const prog = [chord("F3", "maj7"), chord("E3", "min7"), chord("D3", "min7"), chord("C3", "maj7")];
      const swing = beat * 0.08;
      for (let bar = 0; bar < 16; bar++) {
        const c = prog[bar % 4];
        const t0 = bar * 4 * beat;
        c.forEach((note, k) => put(epiano(note + 12, beat * 3.6, 0.55), t0 + k * 0.018, 0.32, (k - 1.5) * 0.25, 0.5));
        put(subBass(c[0] - 12, beat * 1.8), t0, 0.5);
        put(subBass(c[0] - 12, beat * 1.2), t0 + 2.5 * beat, 0.4);
        put(kick(0.7), t0, 0.75);
        put(kick(0.7), t0 + 2.5 * beat, 0.55);
        put(snare(), t0 + beat, 0.38, 0, 0.2);
        put(snare(), t0 + 3 * beat, 0.38, 0, 0.2);
        for (let q = 0; q < 8; q++) put(hat(), t0 + q * beat * 0.5 + (q % 2 ? swing : 0), q % 2 ? 0.1 : 0.16, 0.25);
        if (bar % 4 === 3) [c[3] + 24, c[2] + 24, c[1] + 24].forEach((note, k) => put(pluck(note, 0.9, 0.4), t0 + (2 + k * 0.5) * beat, 0.22, 0.5, 0.6));
      }
      // Vinyl crackle.
      const crackle = buf(16 * 4 * beat);
      for (let i = 0; i < crackle.length; i++) crackle[i] = rand() < 0.0009 ? noise() * 0.6 : noise() * 0.012;
      put(lowpass(crackle, 5000), 0, 0.5);
    }),
  upbeat: () =>
    makeTrack(118, 16, ({ beat, put }) => {
      const prog = [chord("C3", "maj"), chord("G2", "maj"), chord("A2", "min"), chord("F2", "maj")];
      for (let bar = 0; bar < 16; bar++) {
        const c = prog[bar % 4];
        const t0 = bar * 4 * beat;
        for (let q = 0; q < 4; q++) put(kick(1), t0 + q * beat, 0.8);
        put(clap(), t0 + beat, 0.4, 0, 0.3);
        put(clap(), t0 + 3 * beat, 0.4, 0, 0.3);
        for (let q = 0; q < 4; q++) put(hat(true), t0 + (q + 0.5) * beat, 0.12, 0.2);
        for (let e = 0; e < 8; e++) put(subBass(c[0] - 12 + (e % 2 ? 12 : 0), beat * 0.45), t0 + e * beat * 0.5, 0.42);
        const arp = [c[0] + 24, c[1] + 24, c[2] + 24, c[0] + 36];
        for (let s = 0; s < 16; s++) put(pluck(arp[s % 4], 0.35, 0.55), t0 + s * beat * 0.25, s % 4 === 0 ? 0.3 : 0.2, s % 2 ? 0.35 : -0.35, 0.25);
        if (bar % 2 === 0) put(pad(c.map((x) => x + 12), 8 * beat, 2400), t0, 0.22, 0, 0.4);
      }
    }),
  ambient: () =>
    makeTrack(70, 12, ({ beat, put }) => {
      const prog = [chord("C3", "maj9"), chord("A2", "min9"), chord("F2", "maj9"), chord("G2", "dom7")];
      for (let bar = 0; bar < 12; bar += 3) {
        const c = prog[(bar / 3) % 4];
        const t0 = bar * 4 * beat;
        put(pad(c, 12 * beat, 1400), t0, 0.55, 0, 0.9);
        put(pad([c[0] - 12], 12 * beat, 400), t0, 0.5);
        for (let k = 0; k < 6; k++) {
          const note = c[(k * 2) % c.length] + 24;
          put(bell(midi(note), 2.4), t0 + k * 2 * beat + 0.3, 0.09, k % 2 ? 0.6 : -0.6, 1);
        }
      }
    }),
  phonk: () =>
    makeTrack(132, 16, ({ beat, put }) => {
      const roots = ["C#2", "C#2", "A1", "B1"];
      const bell8 = [0, 3, 7, 10, 7, 3, 12, 10];
      for (let bar = 0; bar < 16; bar++) {
        const t0 = bar * 4 * beat;
        const root = n(roots[Math.floor(bar / 2) % 4]);
        put(kick(1.2), t0, 0.95);
        put(kick(1.2), t0 + 1.5 * beat, 0.7);
        put(kick(1.2), t0 + 2.75 * beat, 0.6);
        put(snare(), t0 + 2 * beat, 0.55, 0, 0.2);
        for (let s = 0; s < 8; s++) put(hat(), t0 + s * beat * 0.5, 0.18, 0.2);
        if (bar % 4 === 3) for (let s = 0; s < 6; s++) put(hat(), t0 + 3 * beat + s * beat / 6, 0.14, 0.2);
        put(bass808(root, beat * 1.4), t0, 0.7);
        put(bass808(root + (bar % 2 ? 3 : 0), beat * 1.2, root), t0 + 2 * beat, 0.6);
        if (bar >= 2)
          bell8.forEach((iv, k) => put(cowbell(Math.pow(2, (root + 24 + iv - n("C#4")) / 12)), t0 + k * beat * 0.5, 0.28, k % 2 ? 0.25 : -0.25, 0.25));
      }
    }),
};

console.log("Generating sound effects…");
for (const [name, fn] of Object.entries(sfx)) exportMp3(name, normalize(fn(), 0.8), join(ROOT, "public/sfx"), "128k");
console.log("Generating music beds…");
// Every bed is matched to the same loudness so switching tracks never jumps in volume.
for (const [name, fn] of Object.entries(music)) exportMp3(name, fn(), join(ROOT, "public/music"), "128k", -16);
console.log("Done.");
