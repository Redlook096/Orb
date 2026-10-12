import { listVoices } from "@/server/tts/voices";
import { json } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json({ voices: await listVoices() });
}
