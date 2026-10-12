import { createJob } from "@/server/jobs";
import { validateInput, withDefaults } from "@/server/prepare";
import { asTemplate, fail, json, readBody } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readBody<{ template?: string; input?: unknown }>(req);
  const template = asTemplate(body?.template);
  if (!template) return fail("Unknown template.");
  const input = withDefaults(template, body?.input);
  try {
    validateInput(template, input);
  } catch (e) {
    return fail((e as Error).message, 422);
  }
  const job = createJob(template, input);
  return json({ id: job.id, status: job.status });
}
