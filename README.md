# Córner

Turnos online para complejos de fútbol, pádel y tenis. Usa el mismo esquema que Minuta: landing, registro de complejos, panel por complejo, superadmin, Next.js en Vercel y Upstash Redis.

## Qué incluye

| Ruta | Para quién | Qué hace |
|---|---|---|
| `/` | Dueños de complejos | Landing con funciones, planes (mensual/anual) y CTA de registro |
| `/canchas` | Jugadores | Directorio de complejos con filtro por ciudad y deporte |
| `/c/[slug]` | Jugadores | Página de reservas del complejo: deporte, día, horarios libres y reserva sin seña |
| `/c/[slug]/reserva/[id]` | Jugadores | Ver la reserva y cancelarla dentro del plazo que fija el complejo |
| `/registro`, `/login` | Dueños | Alta del complejo con 14 días de prueba e ingreso |
| `/panel` | Dueños | Agenda en grilla, carga manual, turnos fijos semanales, bloqueos y estadísticas del día |
| `/panel/canchas` | Dueños | Canchas: deporte, duración del turno, horario, precio de día y de noche |
| `/panel/ajustes` | Dueños | Datos del complejo, WhatsApp, link propio, hora de tarifa nocturna, anticipación y cancelación |
| `/panel/diseno` | Dueños | Color, encabezado, logo, portada, tipografía, descripción e Instagram de su página (según plan) |
| `/admin` | Vos (superadmin) | Todos los complejos: plan, pagado hasta, +1 mes / +1 año, extender prueba, activar, suspender o borrar |
| `/marca` | Todos | Logo, colores, tipografía y piezas para redes, con descarga del kit completo |
| `/terminos`, `/privacidad` | Todos | Términos y condiciones y política de privacidad (Ley 25.326) |

**Doble reserva.** Cada turno toma un candado atómico en Redis (`SET NX` sobre cancha + día + hora). Si dos personas reservan a la vez, solo una lo consigue. Lo probé con 5 reservas simultáneas al mismo horario: entró una sola.

**Agenda en vivo.** Con el panel abierto, cada 15 segundos se consulta si hubo cambios. Cada consulta es un solo comando a Upstash y se pausa cuando la pestaña no está a la vista. La hora actual y los horarios que ya pasaron se calculan en el navegador, sin consultar la base; la agenda completa solo se vuelve a pedir cuando algo cambió. Consumo aproximado: unos 4.500 comandos por día por complejo con el panel abierto 14 horas. Si entra una reserva online, aparece sola en la grilla, resaltada en rojo, con un aviso abajo a la derecha, un sonido corto y el contador en el título de la pestaña ("(1) Nueva reserva"). Si la reserva es para otro día, el aviso tiene un botón para ir a esa fecha.

**Planes reales.** Lo que incluye cada plan está en `lib/plans.ts` (`PLAN_DEF`) y se aplica en todo el sistema: cantidad de canchas visibles y reservables, tarifa nocturna, estadísticas, logo y encabezado, portada y tipografía, y exportar a Excel. La tabla comparativa de la landing está en `lib/config.ts` (`COMPARE`); si cambiás un plan, actualizá las dos.

**Prueba y vencimientos.** La prueba gratis vence sola a los 14 días: la página deja de tomar reservas y el panel avisa. Los planes pagos tienen 3 días de gracia después de la fecha de "pagado hasta". No hace falta ningún proceso programado: el estado se calcula en cada pedido. Desde `/admin` registrás pagos con "+1 mes" o "+1 año".

**Editar turnos.** Desde el detalle de cualquier turno, "Editar o mover" permite cambiar cancha, día, horario, nombre y WhatsApp. La reserva mantiene su link, así el jugador sigue viéndola. Los turnos fijos se pueden mover solo ese día o todas las semanas. Si el turno tiene WhatsApp, aparece un botón para avisarle el cambio al cliente.

**Cuenta.** En Ajustes y plan, el dueño cambia su email y su contraseña (pide la actual). Al cambiarlos se cierra la sesión en sus otros dispositivos.

**App y notificaciones.** El panel se puede instalar como app (manifest + service worker) y manda notificaciones push cuando un jugador reserva o cancela, aunque el panel esté cerrado. Las claves VAPID se generan solas la primera vez y quedan guardadas en Upstash, así que no hay que configurar nada. En Android y en computadoras funciona desde el navegador; en iPhone (iOS 16.4 o más nuevo) primero hay que agregar Córner a la pantalla de inicio y abrirlo desde ese ícono. Tocar la notificación abre la agenda en ese día con el turno seleccionado.

**Buscador escalable.** Cada complejo tiene una ficha compacta en un solo hash de Redis (`dir`), así `/canchas` lee 1 comando aunque haya cientos de complejos. Además el resultado se guarda en caché 5 minutos y se renueva al instante cuando un complejo cambia algo. Tiene paginación de a 24.

**Privacidad.** La página pública solo muestra si un horario está libre u ocupado, nunca nombres ni teléfonos.

## Probar en tu compu

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Sin las variables de Upstash, la app usa una base en memoria que se borra al reiniciar, así que sirve para probar.

Para entrar como superadmin en local, creá un archivo `.env.local` con:

```
SUPERADMIN_EMAIL=vos@mail.com
SUPERADMIN_PASSWORD=una-clave
```

## Subirlo a Vercel

1. **Upstash.** En console.upstash.com creá una base Redis nueva, separada de la de Minuta. Copiá `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` desde la pestaña REST API.
2. **GitHub.** Subí esta carpeta a un repo nuevo.
3. **Vercel.** New Project, importá el repo y cargá estas variables (están explicadas en `.env.example`):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `AUTH_SECRET`: una clave larga al azar (por ejemplo, el resultado de `openssl rand -base64 32`)
   - `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`
   - `NEXT_PUBLIC_CONTACT_WHATSAPP` (opcional): tu WhatsApp comercial. Si está cargado, aparece el botón "Escribinos por WhatsApp"
4. Deploy. Ingresá en `/login` con el email y la clave de superadmin para ver `/admin`.

## Dónde cambiar cosas

- **Planes y qué incluye cada uno:** `lib/plans.ts`
- **Textos legales:** `app/terminos/page.tsx` y `app/privacidad/page.tsx`. Completá `NEXT_PUBLIC_LEGAL_OWNER`, `NEXT_PUBLIC_LEGAL_CITY` y `NEXT_PUBLIC_CONTACT_EMAIL`, y hacelos revisar por un abogado antes de vender.
- **Branding kit:** está en `public/marca/` (incluye el zip completo).
- **Frecuencia del chequeo en vivo:** `POLL_MS` en `app/panel/AgendaClient.tsx`.

- **Precios y planes de la landing:** `lib/config.ts` (`PLANS`, `ANNUAL_DISCOUNT`, `COMPARE`)
- **Colores y tipografía:** las variables al principio de `app/globals.css`
- **Textos de la landing:** `app/page.tsx`

## Variables opcionales nuevas

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: solo si querés fijar vos las claves de notificaciones. Si no están, se generan solas.

## Para más adelante

- Seña con Mercado Pago: el modelo ya separa precio y origen de la reserva, así que se puede sumar sin rehacer nada.
- Recordatorios automáticos por WhatsApp, usando la API oficial de Meta o un proveedor.
- Cobro automático del abono mensual a los complejos. Hoy el plan se cambia a mano desde `/admin`.
- Recuperar contraseña por email.
