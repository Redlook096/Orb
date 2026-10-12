<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Orb project notes

- `src/remotion/**/meta.ts`, `lib/types.ts`, `lib/speech.ts`, `lib/captions.ts` and `lib/assets.ts` are imported by API routes, which run under the `react-server` condition. They must not import `remotion` (or anything that does). Browser/renderer-only helpers that need `staticFile` live in `lib/static.ts`.
- Timeline builders (`timeline(input, speech?)`) must stay pure: the live Player, `/api/prepare` and the renderer all call them and must agree frame for frame.
- Remotion's `AbsoluteFill` sets `height: 100%`. When offsetting one with `top`, also set `height`, or canvases inside get stretched.
- Sound effects are referenced as `sfx:<name>` in timelines and resolved with `resolveSrc` at play time; relative `/api/files/` and `/demo/` URLs are made absolute for the renderer in `src/server/render.ts`.
- Every `AudioClip` should carry a `duration`; open-ended audio sequences pile up and exceed the Player's shared audio tags.
- Verify video changes by rendering: `npx remotion still src/remotion/index.ts <template> out.png --frame=N` or a full job through `/api/render`.
