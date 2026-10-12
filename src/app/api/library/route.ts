import { listUploads } from "@/server/library";
import { listJobs } from "@/server/jobs";
import { json } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const renders = listJobs().map(({ input: _input, timeline: _timeline, ...rest }) => rest);
  return json({ uploads: listUploads(), renders });
}
