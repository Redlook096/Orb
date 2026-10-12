import { deleteJob, getJob, queuePosition } from "@/server/jobs";
import { fail, json } from "../../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const job = getJob((await params).id);
  if (!job) return fail("Not found", 404);
  return json({ ...job, queuePosition: queuePosition(job.id) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return deleteJob((await params).id) ? json({ ok: true }) : fail("Not found", 404);
}
