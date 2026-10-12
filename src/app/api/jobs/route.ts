import { listJobs } from "@/server/jobs";
import { json } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json({ jobs: listJobs().map(({ input: _i, timeline: _t, ...rest }) => rest) });
}
