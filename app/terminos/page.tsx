import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, CONTACT_WHATSAPP, LEGAL } from "@/lib/config";
import { GRACE_DAYS, TRIAL_DAYS } from "@/lib/plans";

export const metadata = { title: "Términos y condiciones" };

export default function Terminos() {
  const contacto = [CONTACT_EMAIL && `el email ${CONTACT_EMAIL}`, CONTACT_WHATSAPP && `WhatsApp al +${CONTACT_WHATSAPP}`].filter(Boolean).join(" o ") || "los canales de contacto publicados en el sitio";
  return (
    <LegalPage title="Términos y condiciones">
      <p>Estos términos regulan el uso de Córner, una plataforma de reservas online para complejos deportivos operada por {LEGAL.owner} (“Córner”, “nosotros”). Al usar el sitio, crear una cuenta o reservar un turno, aceptás estos términos.</p>

      <h2>1. Qué es Córner</h2>
      <p>Córner es una herramienta que permite a los complejos deportivos (“Complejos”) publicar sus canchas y horarios, y a los jugadores (“Usuarios”) reservar turnos. Córner no es dueño ni administra las canchas: el servicio deportivo lo presta cada Complejo, que es el único responsable por sus instalaciones, precios, horarios, cobros y atención.</p>

      <h2>2. Reservas de turnos (para jugadores)</h2>
      <ul>
        <li>Para reservar indicás tu nombre y un WhatsApp de contacto. Los datos tienen que ser verdaderos.</li>
        <li>La reserva queda registrada en la agenda del Complejo. El pago del turno se hace directamente en el Complejo, salvo que el Complejo indique otra cosa.</li>
        <li>Podés cancelar online dentro del plazo que fija cada Complejo, informado al momento de reservar. Fuera de ese plazo, tenés que coordinar con el Complejo.</li>
        <li>El Complejo puede cancelar o reprogramar un turno por lluvia, mantenimiento u otras causas. Cualquier reclamo por el turno se resuelve con el Complejo.</li>
        <li>No está permitido hacer reservas falsas o reservar turnos sin intención de usarlos. Podemos bloquear el uso del sitio a quien lo haga.</li>
      </ul>

      <h2>3. Cuentas de Complejos</h2>
      <ul>
        <li>Para usar el panel, el Complejo crea una cuenta con un email y una contraseña. Es responsable de mantener la contraseña en secreto y de todo lo que se haga con su cuenta.</li>
        <li>El Complejo es responsable de que la información que publica (canchas, precios, horarios, políticas de cancelación, imágenes y textos) sea correcta y de tener los derechos para usar las imágenes y logos que sube.</li>
        <li>El Complejo se compromete a tratar los datos de sus clientes de acuerdo con la Ley 25.326 de Protección de Datos Personales y a usarlos solo para gestionar sus turnos.</li>
      </ul>

      <h2>4. Prueba gratis, planes y pagos</h2>
      <ul>
        <li>Cada Complejo nuevo tiene una prueba gratis de {TRIAL_DAYS} días. No se pide tarjeta. Cuando termina, la prueba se cancela automáticamente y la página del Complejo deja de tomar reservas hasta que contrate un plan. No se cobra nada de forma automática.</li>
        <li>Los planes (Inicial, Club y Pro) tienen las funciones y límites publicados en la <Link href="/#comparar">página de planes</Link>. El abono es mensual o anual y se paga por adelantado.</li>
        <li>Si un plan pago vence y no se renueva, hay {GRACE_DAYS} días de gracia. Después, la página deja de tomar reservas hasta que se regularice el pago. Los datos se conservan.</li>
        <li>Si el Complejo pasa a un plan con menos funciones o canchas, las que excedan el nuevo plan dejan de mostrarse hasta que vuelva a un plan que las incluya.</li>
        <li>Podemos actualizar los precios. Los cambios se avisan con al menos 30 días de anticipación y aplican desde el siguiente período.</li>
      </ul>

      <h2>5. Uso aceptable</h2>
      <p>No se puede usar Córner para actividades ilegales, para enviar contenido ofensivo o engañoso, para intentar acceder a cuentas ajenas, ni para afectar el funcionamiento del servicio. Podemos suspender cuentas que incumplan estos términos.</p>

      <h2>6. Disponibilidad y responsabilidad</h2>
      <p>Trabajamos para que Córner funcione siempre, pero puede haber interrupciones por mantenimiento, fallas de terceros (hosting, base de datos, conectividad) o causas de fuerza mayor. Córner se ofrece “tal como está”. En la medida que lo permita la ley, no somos responsables por lucro cesante ni por daños indirectos, ni por conflictos entre Complejos y Usuarios sobre turnos, precios o el servicio deportivo. Nuestra responsabilidad total frente a un Complejo no supera lo que pagó en los últimos 3 meses.</p>

      <h2>7. Propiedad intelectual</h2>
      <p>La marca Córner, el software y el diseño del sitio son de {LEGAL.owner}. El Complejo conserva los derechos sobre su nombre, logo, fotos y textos, y nos autoriza a mostrarlos en su página de reservas y en el buscador de canchas mientras use el servicio.</p>

      <h2>8. Baja del servicio</h2>
      <p>El Complejo puede dejar de usar Córner cuando quiera, avisándonos por {contacto}. Si lo pide, eliminamos su cuenta y sus datos dentro de los 30 días, salvo lo que debamos conservar por obligación legal.</p>

      <h2>9. Cambios en estos términos</h2>
      <p>Podemos modificar estos términos. Publicaremos la versión nueva con su fecha de actualización y, si el cambio es importante, avisaremos a los Complejos con anticipación.</p>

      <h2>10. Ley aplicable y contacto</h2>
      <p>Estos términos se rigen por las leyes de la República Argentina. Para cualquier controversia son competentes los tribunales ordinarios de {LEGAL.city}, sin perjuicio de los derechos que la Ley 24.240 de Defensa del Consumidor otorga a los consumidores. Para consultas escribinos por {contacto}.</p>
    </LegalPage>
  );
}
