import CanchasClient from "./CanchasClient";

export const metadata = { title: "Canchas" };

export default async function Page({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const { nuevo } = await searchParams;
  return (
    <>
      <div className="panel-title">
        <div style={{ display: "grid", gap: 6 }}>
          <p className="eyebrow">Configuración</p>
          <h1>Canchas</h1>
        </div>
      </div>
      {nuevo && (
        <div className="card" style={{ display: "grid", gap: 6 }}>
          <b>¡Bienvenido a Córner!</b>
          <span className="muted">Cargá tus canchas con su horario y precios. Apenas guardes, tu página de reservas queda lista para compartir.</span>
        </div>
      )}
      <CanchasClient />
    </>
  );
}
