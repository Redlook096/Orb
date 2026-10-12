import { cancelJob } from "@/server/jobs";
import { fail, json } from "../../../_util";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return cancelJob((await params).id) ? json({ ok: true }) : fail("Not found", 404);
}
