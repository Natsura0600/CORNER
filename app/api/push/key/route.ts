import { ok } from "@/lib/api";
import { publicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ key: await publicKey() });
}
