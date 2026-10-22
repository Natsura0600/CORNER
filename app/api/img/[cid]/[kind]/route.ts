import { getImage } from "@/lib/data";

/** Sirve el logo o la portada del complejo. La URL lleva ?v=versión, así que se cachea para siempre. */
export async function GET(_req: Request, ctx: { params: Promise<{ cid: string; kind: string }> }) {
  const { cid, kind } = await ctx.params;
  if (kind !== "logo" && kind !== "cover") return new Response("No encontrado", { status: 404 });
  const data = await getImage(cid, kind);
  const m = data ? /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(data) : null;
  if (!m) return new Response("No encontrado", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" },
  });
}
