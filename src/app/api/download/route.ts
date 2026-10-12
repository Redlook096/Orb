import { downloadVideo } from "@/server/downloader";
import { fail, json, readBody } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 1800;

export async function POST(req: Request) {
  const body = await readBody<{ url?: string }>(req);
  try {
    return json(await downloadVideo(String(body?.url ?? "").trim()));
  } catch (e) {
    return fail((e as Error).message, 422);
  }
}
