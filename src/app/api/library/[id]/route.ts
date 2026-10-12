import { deleteUpload } from "@/server/library";
import { fail, json } from "../../_util";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return deleteUpload((await params).id) ? json({ ok: true }) : fail("Not found", 404);
}
