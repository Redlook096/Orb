# Orb — viral short-form video studio

Orb makes faceless, ready-to-post vertical videos: Reddit stories, fake text chats, split-screen clips, tweet threads, AI chats, Would You Rather, quizzes, blur frames and auto-captioned clips. Pick a frame, fill in the inputs (or let Claude write them), choose a voice, gameplay and caption style, and Orb renders a 1080×1920 MP4.

It is a from-scratch remake of the tool set popularized by Crayo, with a Framelabs-style "pick a frame → add inputs → export" menu and guides.

## What's inside

**Frames (video formats)**

| Frame | What it renders |
| --- | --- |
| Reddit Story | Post card pops in while the title is read, then the story plays with word-by-word captions over gameplay |
| Fake Texts | iMessage, WhatsApp or Instagram DM chat (light/dark) with typing dots, send/receive sounds and a voice per person |
| Split-Screen | Your clip on top, gameplay below, captions on the seam (auto-transcribed) |
| Tweet Thread | X-style cards slide in; each word lights up as it is spoken |
| AI Chat | ChatGPT-style chat: prompt typed into the composer, answer streams in synced to the voice |
| Would You Rather | Red vs blue options, countdown ring, animated vote split |
| Quiz | Question card, options fly in, countdown, correct answer reveal |
| Blur Frame | Landscape clip in a blurred 9:16 frame with a headline box and captions |
| Auto Captions | Ten caption styles burned into any video |

**Tools:** AI Voiceover (WAV/MP3 + word timings), Auto Captions, Script Writer and Idea Generator (Claude), Video Downloader (yt-dlp), Transcriber (SRT).

**Rendering quality**

- Remotion renders every frame in headless Chrome: 1080×1920, 30 fps, H.264 CRF 18, AAC 192 kbps, with the audio mastered to −14 LUFS (the level TikTok, Shorts and Reels normalize to).
- Captions are timed to the words the voice actually speaks. Kokoro returns per-phoneme durations, ElevenLabs returns character timestamps, and OpenAI audio is aligned with Whisper. Ten caption styles: Classic, Hormozi, Beast, Karaoke, Highlight Box, Minimal, Neon, Marker, One Word, 3D Pop.
- Six procedural "gameplay" backgrounds are drawn per frame, deterministic and royalty-free: Block Parkour (first-person voxel parkour), Rail Runner (endless runner with trains and coins), Neon Drive, Ring Escape, Liquid Gradient and Hyperspace. You can also upload your own gameplay.
- Sound effects and five music beds are synthesized by `scripts/generate-audio.mjs`, so there is no third-party audio to license.

## Quick start

Requirements: Node.js 22+, FFmpeg, Python 3.10+ and eSpeak NG (used by Kokoro's phonemizer).

```bash
npm install
python3 -m pip install kokoro-onnx soundfile   # local neural voices
npm run setup:voices                           # downloads the Kokoro model (~350 MB) into models/
cp .env.example .env                           # optional API keys
npm run dev                                    # http://localhost:3000
```

The first render bundles the video project with webpack, so it takes a bit longer. For production:

```bash
npm run build && npm start
```

Or run everything in Docker:

```bash
docker build -t orb . && docker run -p 3000:3000 -v orb-data:/data --env-file .env orb
```

### Optional keys (`.env`)

| Variable | Unlocks |
| --- | --- |
| `ANTHROPIC_API_KEY` | Script Writer, Idea Generator and "Write with AI" in every editor (Claude Opus 5.5 by default, `ANTHROPIC_MODEL` to change) |
| `ELEVENLABS_API_KEY` | ElevenLabs voices, including cloned ones |
| `OPENAI_API_KEY` | OpenAI voices and Whisper transcription for clip captions |
| `WHISPER_MODEL` | Local transcription with `pip install faster-whisper` (`tiny`, `base`, `small`, …) |
| `REMOTION_BROWSER_EXECUTABLE` | Use an existing headless Chrome instead of Remotion's download |
| `RENDER_CONCURRENCY` | Parallel frame renderers (defaults to CPU count − 1) |

Without any keys, Orb still renders every frame with the 24 local Kokoro voices. If a project names a voice whose provider isn't configured, Orb substitutes a local voice of the same gender and shows a warning.

## How it works

```
src/
  remotion/            Video engine (shared by the live Player and the renderer)
    templates/<frame>/ meta.ts: defaults, speech requests, pure timeline builder
                       Video.tsx: the composition
    backgrounds/       Canvas-drawn procedural gameplay (tiny software 3D projector)
    components/        Captions, audio, icons, font loading
  server/              Node-only pipeline
    tts/               Kokoro (Python worker), ElevenLabs, OpenAI, eSpeak; cached by content hash
    prepare.ts         Speech + transcription → exact timeline
    render.ts          Remotion renderMedia, then FFmpeg loudness mastering
    jobs.ts            Render queue persisted to storage/jobs
  app/                 Next.js App Router UI and API routes
scripts/               Kokoro worker, Whisper worker, audio synthesis, model setup
```

1. The editor keeps a project (`input`) per frame in the browser and previews it with the Remotion Player. Voice timing is estimated until you press **Preview with voice**.
2. `/api/prepare` synthesizes each speech segment once (cached), then calls the frame's pure `timeline()` builder, so the preview and the final render use the same timeline.
3. `/api/render` queues a job: prepare → `renderMedia` → mastering → thumbnail. Uploads, voice clips and renders live in `storage/`.

## Licensing notes

- **Remotion** is free for individuals and companies with up to three employees; larger companies need a [Remotion company license](https://remotion.dev/license).
- **Kokoro-82M** model weights are Apache 2.0. Fonts are SIL OFL via Fontsource.
- Platform-styled chat and post cards are generic recreations for parody and storytelling formats. Orb ships no third-party logos.
- Only download or reuse videos you own or have permission to use.
