import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, CONTACT_WHATSAPP, LEGAL } from "@/lib/config";

export const metadata = { title: "Política de privacidad" };

export default function Privacidad() {
  const contacto = [CONTACT_EMAIL && `el email ${CONTACT_EMAIL}`, CONTACT_WHATSAPP && `WhatsApp al +${CONTACT_WHATSAPP}`].filter(Boolean).join(" o ") || "los canales de contacto publicados en el sitio";
  return (
    <LegalPage title="Política de privacidad">
      <p>En esta política te contamos qué datos personales se usan en Córner, para qué, con quién se comparten y cómo podés ejercer tus derechos, de acuerdo con la Ley 25.326 de Protección de Datos Personales de la República Argentina.</p>

      <h2>1. Quién es responsable</h2>
      <ul>
        <li><b>Datos de los Complejos</b> (cuenta, email, WhatsApp, datos del complejo): el responsable es {LEGAL.owner}.</li>
        <li><b>Datos de los jugadores que reservan</b> (nombre y WhatsApp): el responsable es el Complejo donde reservás, que los usa para gestionar tu turno. Córner los guarda y procesa por cuenta del Complejo, como prestador del servicio.</li>
      </ul>

      <h2>2. Qué datos se usan</h2>
      <ul>
        <li><b>Jugadores:</b> nombre y apellido, número de WhatsApp y los datos del turno (complejo, cancha, día, horario). No pedimos documento, dirección ni datos de pago.</li>
        <li><b>Complejos:</b> email, contraseña (guardada cifrada, nunca en texto plano), nombre, ciudad, dirección y WhatsApp del complejo, canchas, precios, imágenes y textos que suba, y los turnos que carga.</li>
        <li><b>Datos técnicos:</b> una cookie de sesión para mantener abierta la cuenta del Complejo y, en tu navegador, el nombre y WhatsApp que usaste para reservar, para no tener que escribirlos de nuevo. No usamos cookies de publicidad ni herramientas de seguimiento de terceros.</li>
      </ul>

      <h2>3. Para qué se usan</h2>
      <ul>
        <li>Registrar tu turno y mostrárselo al Complejo en su agenda.</li>
        <li>Que el Complejo pueda contactarte por WhatsApp para confirmar, avisar cambios por lluvia o coordinar el turno.</li>
        <li>Permitirte ver y cancelar tu reserva desde el link que recibís.</li>
        <li>Brindar el servicio a los Complejos, darles soporte y gestionar su plan.</li>
      </ul>
      <p>No vendemos ni alquilamos datos personales y no los usamos para publicidad.</p>

      <h2>4. Con quién se comparten</h2>
      <ul>
        <li>Con el Complejo donde reservaste: ve tu nombre, tu WhatsApp y los datos del turno.</li>
        <li>Con los proveedores que necesitamos para que el servicio funcione: alojamiento del sitio (Vercel) y base de datos (Upstash). Estos proveedores pueden almacenar los datos en servidores ubicados fuera de la Argentina, con medidas de seguridad adecuadas.</li>
        <li>Con autoridades, solo si una ley u orden judicial lo exige.</li>
      </ul>
      <p>La página pública de cada complejo solo muestra si un horario está libre u ocupado. Nunca muestra nombres ni teléfonos de quienes reservaron.</p>

      <h2>5. Cuánto tiempo se guardan</h2>
      <p>Los turnos se conservan mientras el Complejo use Córner, para que pueda consultar su historial. Si el Complejo da de baja su cuenta, eliminamos sus datos y los de sus turnos dentro de los 30 días, salvo obligación legal de conservarlos.</p>

      <h2>6. Tus derechos</h2>
      <p>Podés pedir acceder a tus datos, corregirlos, actualizarlos o eliminarlos. Si reservaste un turno, lo más rápido es pedírselo al Complejo; también podés escribirnos por {contacto} y lo gestionamos con el Complejo. Respondemos dentro de los plazos de la Ley 25.326 (10 días corridos para acceso y 5 días hábiles para rectificación o supresión).</p>
      <p className="legal-note">El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.</p>
      <p className="legal-note">La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>

      <h2>7. Seguridad</h2>
      <p>Usamos conexiones cifradas (HTTPS), contraseñas cifradas y accesos restringidos al panel de cada Complejo. Ningún sistema es infalible, pero si detectamos un incidente que afecte tus datos te lo vamos a informar.</p>

      <h2>8. Menores de edad</h2>
      <p>Las cuentas de Complejos son para mayores de 18 años. Si un menor reserva un turno, se recomienda que lo haga con autorización de un adulto responsable.</p>

      <h2>9. Cambios en esta política</h2>
      <p>Si cambiamos esta política, publicaremos la versión nueva con su fecha de actualización.</p>

      <h2>10. Contacto</h2>
      <p>Por cualquier consulta sobre tus datos escribinos por {contacto}.</p>
    </LegalPage>
  );
}
