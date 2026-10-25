import bcrypt from "bcryptjs";
import { after } from "next/server";
import { createSession } from "@/lib/auth";
import { cleanPhone, fail, handle, ok, str } from "@/lib/api";
import { createUser, newId, reserveSlug, saveComplejo, saveUser } from "@/lib/data";
import type { Complejo } from "@/lib/types";
import { TRIAL_DAYS } from "@/lib/plans";
import { adminEmail, newSignupAdminMail, sendMail, welcomeMail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const email = str(b.email, 120).toLowerCase();
    const password = String(b.password ?? "");
    const name = str(b.complejo, 60);
    const city = str(b.city, 60);
    const whatsapp = cleanPhone(b.whatsapp);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Revisá el email.");
    if (password.length < 8) return fail("La contraseña tiene que tener al menos 8 caracteres.");
    if (name.length < 3) return fail("Poné el nombre del complejo.");
    if (city.length < 2) return fail("Poné la ciudad.");
    if (whatsapp.length < 10) return fail("Poné el WhatsApp con código de área (ej: 11 5555 0000).");
    if (b.terms !== "on" && b.terms !== true) return fail("Para crear la cuenta tenés que aceptar los términos y la política de privacidad.");

    const id = newId("c");
    const passHash = await bcrypt.hash(password, 10);
    const created = await createUser({ email, passHash, complejoId: id, createdAt: Date.now() });
    if (!created) return fail("Ya existe una cuenta con ese email. Iniciá sesión.", 409);

    let c: Complejo;
    try {
      const slug = await reserveSlug(name, id);
      c = {
        id,
        slug,
        name,
        city,
        address: "",
        whatsapp: whatsapp.startsWith("54") ? whatsapp : "549" + whatsapp,
        nightFrom: 19 * 60,
        daysAhead: 14,
        cancelHours: 6,
        active: true,
        plan: "prueba",
        trialEnds: Date.now() + TRIAL_DAYS * 86400000,
        paidUntil: null,
        ownerEmail: email,
        createdAt: Date.now(),
      };
      await saveComplejo(c);
    } catch (e) {
      await saveUser({ email, passHash, complejoId: "", createdAt: Date.now() });
      throw e;
    }
    await createSession({ email, role: "owner", cid: id });
    // Los mails salen después de responder, así el registro no espera
    const nuevo = c;
    after(async () => {
      await sendMail(welcomeMail(nuevo));
      if (adminEmail()) await sendMail(newSignupAdminMail(nuevo));
    });
    return ok({ ok: true });
  } catch (e) {
    return handle(e);
  }
}
