import { getSession } from "@/lib/auth";
import { getComplejo } from "@/lib/data";
import { addDays, todayStr } from "@/lib/time";
import CopyLink from "@/components/CopyLink";
import AgendaClient from "./AgendaClient";

export const metadata = { title: "Agenda" };

export default async function AgendaPage() {
  const s = await getSession();
  const c = (await getComplejo(s!.cid!))!;
  const today = todayStr();
  const days = Array.from({ length: Math.max(c.daysAhead, 14) + 1 }, (_, i) => addDays(today, i));
  return (
    <>
      <div className="panel-title">
        <div style={{ display: "grid", gap: 6 }}>
          <p className="eyebrow">{c.name}</p>
          <h1>Agenda</h1>
        </div>
      </div>
      <CopyLink path={`/c/${c.slug}`} />
      <AgendaClient days={days} />
    </>
  );
}
