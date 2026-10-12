import Anthropic from "@anthropic-ai/sdk";
import { generate, LlmUnavailableError, SCHEMAS, type GenerateKind } from "@/server/llm";
import { fail, json, readBody } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await readBody<{ kind?: string; prompt?: string }>(req);
  const kind = body?.kind as GenerateKind | undefined;
  if (!kind || !(kind in SCHEMAS)) return fail("Unknown generator.");
  try {
    return json(await generate(kind, (body?.prompt ?? "").slice(0, 4000)));
  } catch (e) {
    if (e instanceof LlmUnavailableError) return fail(e.message, 503);
    if (e instanceof Anthropic.AuthenticationError) return fail("The Anthropic API key was rejected.", 401);
    if (e instanceof Anthropic.RateLimitError) return fail("Rate limited by the AI provider. Try again in a moment.", 429);
    if (e instanceof Anthropic.APIError) return fail(`AI provider error (${e.status}): ${e.message}`, 502);
    return fail((e as Error).message, 500);
  }
}
