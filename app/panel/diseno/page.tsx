import DisenoClient from "./DisenoClient";

export const metadata = { title: "Diseño" };

export default function Page() {
  return (
    <>
      <div className="panel-title">
        <div style={{ display: "grid", gap: 6 }}>
          <p className="eyebrow">Tu página de reservas</p>
          <h1>Diseño</h1>
        </div>
      </div>
      <DisenoClient />
    </>
  );
}
