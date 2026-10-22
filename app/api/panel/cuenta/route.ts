import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { fail, handle, ok, requireOwner, str } from "@/lib/api";
import { createUser, deleteUser, saveComplejo, saveUser } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Cambiar email y/o contraseña. Pide la contraseña actual y cierra la sesión en los demás dispositivos. */
export async function PUT(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    const current = String(b.currentPassword ?? "");
    const newEmail = str(b.email, 120).toLowerCase();
    const newPass = String(b.newPassword ?? "");
    const u = a.user;
    if (!(await bcrypt.compare(current, u.passHash))) return fail("La contraseña actual no es correcta.", 403);

    const changeEmail = !!newEmail && newEmail !== u.email;
    const changePass = newPass.length > 0;
    if (!changeEmail && !changePass) return fail("No hay cambios para guardar.");
    if (changeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return fail("Revisá el email nuevo.");
    if (changePass && newPass.length < 8) return fail("La contraseña nueva tiene que tener al menos 8 caracteres.");
    if (changePass && (await bcrypt.compare(newPass, u.passHash))) return fail("La contraseña nueva es igual a la actual.");

    const next = {
      ...u,
      email: changeEmail ? newEmail : u.email,
      passHash: changePass ? await bcrypt.hash(newPass, 10) : u.passHash,
      sv: (u.sv ?? 0) + 1,
    };

    if (changeEmail) {
      const created = await createUser(next);
      if (!created) return fail("Ya hay una cuenta con ese email.", 409);
      await deleteUser(u.email);
      a.complejo.ownerEmail = newEmail;
      await saveComplejo(a.complejo);
    } else {
      await saveUser(next);
    }
    // Sesión nueva en este dispositivo; las demás quedan vencidas
    await createSession({ email: next.email, role: "owner", cid: a.complejo.id, sv: next.sv });
    return ok({ email: next.email, changed: { email: changeEmail, password: changePass } });
  } catch (e) {
    return handle(e);
  }
}
