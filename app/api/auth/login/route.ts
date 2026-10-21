import bcrypt from "bcryptjs";
import { createSession, isSuperadmin } from "@/lib/auth";
import { fail, handle, ok, str } from "@/lib/api";
import { getUser } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const email = str(b.email, 120).toLowerCase();
    const password = String(b.password ?? "");
    if (isSuperadmin(email, password)) {
      await createSession({ email, role: "superadmin" });
      return ok({ redirect: "/admin" });
    }
    const u = await getUser(email);
    if (!u || !u.complejoId || !(await bcrypt.compare(password, u.passHash))) return fail("Email o contraseña incorrectos.", 401);
    await createSession({ email, role: "owner", cid: u.complejoId });
    return ok({ redirect: "/panel" });
  } catch (e) {
    return handle(e);
  }
}
