import { capabilities } from "@/server/config";
import { json } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json({ capabilities: capabilities() });
}
