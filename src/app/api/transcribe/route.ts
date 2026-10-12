import { transcribe, toSrt } from "@/server/transcribe";
import { urlToPath } from "@/server/storage";
import { fail, json, readBody } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 1800;

export async function POST(req: Request) {
  const body = await readBody<{ src?: string }>(req);
  const file = body?.src ? urlToPath(body.src) : null;
  if (!file) return fail("Choose a clip from your library.");
  try {
    const t = await transcribe(file);
    return json({ words: t.words, engine: t.engine, srt: toSrt(t.words) });
  } catch (e) {
    return fail((e as Error).message, 422);
  }
}
