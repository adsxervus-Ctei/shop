// Mi Tienda · Canal WhatsApp (Fase 3, OPCIONAL, NO ACTIVO)
// Requiere la API de WhatsApp Business (Cloud API de Meta): tiene costo por conversación,
// plantillas aprobadas y verificación del negocio. Por eso aquí solo queda la interfaz.
//
// Para activarlo en el futuro:
//   1. Crear la app en developers.facebook.com, agregar WhatsApp y verificar el número.
//   2. Aprobar una plantilla, por ejemplo "nueva_oferta_domicilio" con variables {{1}} valor y {{2}} negocio.
//   3. Definir WHATSAPP_TOKEN y WHATSAPP_NUMERO_ID en el entorno.
//   4. Implementar enviar() con un POST a https://graph.facebook.com/v20.0/{NUMERO_ID}/messages.
// El despachador (notificaciones.mjs) ya llama a este adaptador; mientras no esté activo, no hace nada.

export const whatsappActivo = () => false;

export async function enviarWhatsApp({ telefono, plantilla, variables }) {
  void telefono; void plantilla; void variables;
  return { ok: false, motivo: 'WhatsApp no está configurado (fase 3)' };
}

/* ---------- Mi Tienda v9: código de ingreso por WhatsApp (Cloud API de Meta) ----------
   Se activa SOLO con estas variables de entorno:
     WHATSAPP_TOKEN            token permanente del usuario del sistema (Business Manager)
     WHATSAPP_NUMERO_ID        "Phone number ID" del número de WhatsApp Business
     WHATSAPP_PLANTILLA_CODIGO nombre de la plantilla de AUTENTICACIÓN aprobada (ej: codigo_ingreso)
     WHATSAPP_IDIOMA           idioma de la plantilla (por defecto es_CO; debe ser igual al aprobado)
   Meta cobra cada mensaje de autenticación. Mientras no estén, el servidor no envía nada. */
export const whatsappCodigoActivo = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_NUMERO_ID && process.env.WHATSAPP_PLANTILLA_CODIGO);

export async function enviarCodigoWhatsApp(telefono, codigo, enviar = fetch) {
  if (!whatsappCodigoActivo()) return { ok: false, motivo: 'no_configurado' };
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_NUMERO_ID}/messages`;
  const cuerpo = {
    messaging_product: 'whatsapp', to: '57' + telefono, type: 'template',
    template: {
      name: process.env.WHATSAPP_PLANTILLA_CODIGO, language: { code: process.env.WHATSAPP_IDIOMA || 'es_CO' },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: codigo }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: codigo }] }
      ]
    }
  };
  try {
    const r = await enviar(url, { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    if (!r.ok) { const d = await r.text(); console.error('[whatsapp] Meta respondió', r.status, d.slice(0, 300)); return { ok: false, motivo: 'meta_' + r.status }; }
    return { ok: true };
  } catch (e) { console.error('[whatsapp]', e.message); return { ok: false, motivo: 'sin_red' }; }
}
