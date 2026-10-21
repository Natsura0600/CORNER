import AjustesClient from "./AjustesClient";

export const metadata = { title: "Ajustes" };

export default function Page() {
  return (
    <>
      <div className="panel-title">
        <div style={{ display: "grid", gap: 6 }}>
          <p className="eyebrow">Configuración</p>
          <h1>Ajustes del complejo</h1>
        </div>
      </div>
      <AjustesClient />
    </>
  );
}
