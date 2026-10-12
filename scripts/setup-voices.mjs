#!/usr/bin/env node
// Downloads the Kokoro voice model (with phoneme timings) and checks the Python runtime.
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODELS = join(ROOT, "models");
const RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download";
// The v1.1 export of kokoro-v1.0 includes a duration output, which gives word-accurate captions.
const FILES = [
  { url: `${RELEASE}/model-files-v1.1/kokoro-v1.0.onnx`, name: "kokoro-v1.0.onnx", min: 300e6 },
  { url: `${RELEASE}/model-files-v1.0/voices-v1.0.bin`, name: "voices-v1.0.bin", min: 20e6 },
];

mkdirSync(MODELS, { recursive: true });
for (const f of FILES) {
  const dest = join(MODELS, f.name);
  if (existsSync(dest) && statSync(dest).size >= f.min) {
    console.log(`✓ ${f.name} already present`);
    continue;
  }
  process.stdout.write(`↓ ${f.name} … `);
  const res = await fetch(f.url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}) for ${f.url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(`${dest}.part`));
  renameSync(`${dest}.part`, dest);
  console.log(`${(statSync(dest).size / 1e6).toFixed(0)} MB`);
}

const python = process.env.PYTHON_BIN || "python3";
try {
  execFileSync(python, ["-c", "import kokoro_onnx, soundfile"], { stdio: "ignore" });
  console.log("✓ Python packages kokoro-onnx and soundfile are installed");
} catch {
  console.log(`\nInstall the Python runtime for Kokoro:\n  ${python} -m pip install kokoro-onnx soundfile\n(also needs espeak-ng: apt install espeak-ng / brew install espeak-ng)`);
}
