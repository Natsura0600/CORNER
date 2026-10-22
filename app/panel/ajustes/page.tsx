import AjustesClient from "./AjustesClient";
import PushSetup from "@/components/PushSetup";

export const metadata = { title: "Ajustes" };

export default function Page() {
  return (
    <>
      <div className="panel-title">
        <div style={{ display: "grid", gap: 6 }}>
          <p className="eyebrow">Configuración</p>
          <h1>Ajustes y plan</h1>
        </div>
      </div>
      <div style={{ maxWidth: 900 }}><PushSetup /></div>
      <AjustesClient />
    </>
  );
}
