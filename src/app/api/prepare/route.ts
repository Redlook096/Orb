import { prepare } from "@/server/prepare";
import { asTemplate, fail, json, readBody } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

/** Synthesizes narration and builds the exact timeline so the editor can preview with real audio. */
export async function POST(req: Request) {
  const body = await readBody<{ template?: string; input?: unknown }>(req);
  const template = asTemplate(body?.template);
  if (!template) return fail("Unknown template.");
  try {
    return json(await prepare(template, body?.input));
  } catch (e) {
    return fail((e as Error).message, 422);
  }
}
