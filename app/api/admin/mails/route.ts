import { fail, handle, ok, requireSuperadmin } from "@/lib/api";
import { adminEmail, mailConfigured, sendMail, testMail } from "@/lib/mail";
import { runReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await requireSuperadmin();
  if ("error" in a) return a.error;
  return ok({ configured: mailConfigured(), from: process.env.MAIL_FROM ?? "", admin: adminEmail(), cron: !!process.env.CRON_SECRET });
}

export async function POST(req: Request) {
  try {
    const a = await requireSuperadmin();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    if (b.action === "test") {
      const to = adminEmail();
      if (!to) return fail("Cargá ADMIN_NOTIFY_EMAIL o SUPERADMIN_EMAIL para saber a dónde mandar la prueba.");
      const r = await sendMail(testMail(to));
      return r.ok ? ok({ sent: to }) : fail(`No se pudo mandar: ${r.error}`, 502);
    }
    if (b.action === "run") return ok(await runReminders());
    return fail("Acción inválida.");
  } catch (e) {
    return handle(e);
  }
}
