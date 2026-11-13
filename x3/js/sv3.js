/* Mi Tienda · Servus 3.0 · detalles del encabezado y del pie con la diagramación tipo marketplace
   - "Línea de atención" en el pie de página: sale solo si HM_CONFIG.lineaAtencion tiene un número (js/config.js).
   - El selector de categoría del buscador muestra el nombre corto para que quepa.
   Lo demás de la portada nueva está en sv-inicio.js (secciones) y sv02.js (franja de pautas con la foto difuminada). */
(function () {
  'use strict';
  const LM = window.LM; if (!LM) return;
  const linea = String((window.HM_CONFIG || {}).lineaAtencion || '').trim();
  const p = document.getElementById('svLinea');
  if (p && linea) { p.querySelector('b').textContent = linea; p.hidden = false; }
  const sel = document.getElementById('qCat');
  if (sel) sel.setAttribute('aria-label', 'Buscar en la categoría');
})();
