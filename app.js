/* ============================================
   REPORTAJE PDF - App Logic v2
   ============================================ */

'use strict';

// ---- Estado ----
// fotos: array de { dataUrl, comentario, numeroReal }
// usamos array simple; al eliminar lo marcamos null
const fotos = [];
let contadorFotos = 0; // número incremental visible para el usuario

// ---- Elementos DOM ----
const reportForm     = document.getElementById('reportForm');
const asuntoEl       = document.getElementById('asunto');
const fechaEl        = document.getElementById('fecha');
const observEl       = document.getElementById('observaciones');
const inputGaleria   = document.getElementById('inputGaleria');
const inputCamara    = document.getElementById('inputCamara');
const btnGaleria     = document.getElementById('btnGaleria');
const btnCamara      = document.getElementById('btnCamara');
const fotosContainer = document.getElementById('fotosContainer');
const fotosEmpty     = document.getElementById('fotosEmpty');
const fotoCounter    = document.getElementById('fotoCounter');
const fotoCounterText= document.getElementById('fotoCounterText');
const btnGenerar     = document.getElementById('btnGenerar');
const toastEl        = document.getElementById('toast');

// ---- Fecha por defecto (hoy) ----
(function setDefaultDate() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm   = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd   = String(hoy.getDate()).padStart(2, '0');
  fechaEl.value = `${yyyy}-${mm}-${dd}`;
})();

// ---- Botones añadir foto ----
btnGaleria.addEventListener('click', () => inputGaleria.click());
btnCamara.addEventListener('click',  () => inputCamara.click());

inputGaleria.addEventListener('change', (e) => handleFiles(e.target.files));
inputCamara.addEventListener('change',  (e) => handleFiles(e.target.files));

// ---- Procesar archivos de imagen ----
function handleFiles(files) {
  if (!files || files.length === 0) return;
  [...files].forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const idx = fotos.length;
      contadorFotos++;
      fotos.push({ dataUrl, comentario: '', numeroReal: contadorFotos });
      renderFotoCard(idx);
      updateUI();
    };
    reader.readAsDataURL(file);
  });
  inputGaleria.value = '';
  inputCamara.value  = '';
}

// ---- Renderizar tarjeta de foto ----
function renderFotoCard(idx) {
  const foto = fotos[idx];
  const card = document.createElement('div');
  card.className = 'foto-card';
  card.dataset.idx = idx;

  card.innerHTML = `
    <div class="foto-card-header">
      <span class="foto-numero">📷 Foto ${foto.numeroReal}</span>
      <button type="button" class="btn-remove-foto">🗑️ Eliminar</button>
    </div>
    <img class="foto-card-img" src="${foto.dataUrl}" alt="Foto ${foto.numeroReal}" loading="lazy" />
    <div class="foto-card-body">
      <label class="foto-comentario-label">Comentario de la foto ${foto.numeroReal}:</label>
      <textarea
        class="foto-comentario"
        placeholder="Escribe aquí el comentario para esta foto..."
        rows="2"
      ></textarea>
    </div>
  `;

  // Sincronizar comentario
  const textarea = card.querySelector('.foto-comentario');
  textarea.addEventListener('input', () => {
    fotos[idx].comentario = textarea.value;
  });

  // Eliminar
  card.querySelector('.btn-remove-foto').addEventListener('click', () => {
    fotos[idx] = null;
    card.style.transition = 'opacity .2s, transform .2s';
    card.style.opacity = '0';
    card.style.transform = 'scale(.95)';
    setTimeout(() => { card.remove(); updateUI(); }, 200);
  });

  fotosContainer.appendChild(card);
}

// ---- Actualizar estado UI ----
function updateUI() {
  const activas = fotos.filter(f => f !== null);
  const n = activas.length;

  fotosEmpty.style.display  = n === 0 ? 'flex' : 'none';
  fotoCounter.style.display = n === 0 ? 'none' : 'flex';

  if (n > 0) {
    const paginas = Math.ceil(n / 4);
    fotoCounterText.textContent =
      `${n} foto${n !== 1 ? 's' : ''} añadida${n !== 1 ? 's' : ''} · ${paginas} página${paginas !== 1 ? 's' : ''} de fotos en el PDF`;
  }
}

// ============================================================
// ---- GENERAR PDF ----
// ============================================================
reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const asunto = asuntoEl.value.trim();
  const fecha  = fechaEl.value;

  if (!asunto) { showToast('⚠️ El asunto es obligatorio'); asuntoEl.focus(); return; }
  if (!fecha)  { showToast('⚠️ Selecciona una fecha'); fechaEl.focus(); return; }

  const fotosActivas = fotos.filter(f => f !== null);

  btnGenerar.disabled = true;
  btnGenerar.classList.add('loading');
  showToast('⏳ Generando PDF...');

  try {
    await generarPDF(asunto, fecha, observEl.value.trim(), fotosActivas);
    showToast('✅ PDF generado correctamente');
  } catch (err) {
    console.error(err);
    showToast('❌ Error al generar el PDF');
  } finally {
    btnGenerar.disabled = false;
    btnGenerar.classList.remove('loading');
  }
});

// ============================================================
// PDF: layout 2×2 (4 fotos por página de contenido)
// ============================================================
async function generarPDF(asunto, fecha, observaciones, fotosActivas) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW  = doc.internal.pageSize.getWidth();   // 210
  const pageH  = doc.internal.pageSize.getHeight();  // 297
  const margin = 12;
  const contentW = pageW - margin * 2;               // 186
  const fechaFormateada = formatearFecha(fecha);

  // ── helper: dibuja la cabecera roja en la página actual ──
  function drawHeader(isFirst) {
    doc.setFillColor(230, 57, 70);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isFirst ? 10 : 8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('REPORTAJE FOTOGRÁFICO', margin, 9);
    if (isFirst) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(255, 210, 210);
      doc.text(fechaFormateada, pageW - margin, 9, { align: 'right' });
    }
  }

  // ── helper: pie de página ──
  // Se llama al final cuando ya sabemos totalPages
  function drawFooters(totalPages) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 190);
      doc.text(
        `Página ${p} de ${totalPages}  ·  ${fechaFormateada}`,
        pageW / 2, pageH - 5, { align: 'center' }
      );
    }
  }

  // ============================================================
  // PÁGINA 1: Portada / datos generales
  // ============================================================
  drawHeader(true);

  let y = 30;

  // Asunto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 40);
  const asuntoLines = doc.splitTextToSize(asunto, contentW);
  asuntoLines.forEach(line => { doc.text(line, margin, y); y += 8; });

  y += 2;
  doc.setDrawColor(230, 57, 70);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // Observaciones
  if (observaciones) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 50, 60);
    doc.text('OBSERVACIONES', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 70);
    const obsLines = doc.splitTextToSize(observaciones, contentW);
    obsLines.forEach(line => { doc.text(line, margin, y); y += 5; });
    y += 3;
  }

  // Si no hay fotos, cerrar aquí
  if (fotosActivas.length === 0) {
    drawFooters(doc.internal.getNumberOfPages());
    doc.save(`reportaje_${fecha.replace(/-/g,'')}.pdf`);
    return;
  }

  // Resumen de fotos en portada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 50, 60);
  doc.text('CONTENIDO', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 70);
  const pagsFotos = Math.ceil(fotosActivas.length / 4);
  doc.text(
    `${fotosActivas.length} fotografía${fotosActivas.length !== 1 ? 's' : ''} en ${pagsFotos} página${pagsFotos !== 1 ? 's' : ''}`,
    margin, y
  );

  // ============================================================
  // PÁGINAS DE FOTOS: layout 2 columnas × 2 filas = 4 por página
  // ============================================================

  // Medidas de cada celda
  const colGap  = 6;   // separación horizontal entre columnas
  const rowGap  = 5;   // separación vertical entre filas
  const comH    = 10;  // altura reservada para el comentario (1-2 líneas)
  const headerH = 22;  // altura de la cabecera roja
  const footerH = 10;  // margen inferior para pie de página
  const usableH = pageH - headerH - margin - footerH;

  // Cada celda ocupa la mitad del ancho disponible
  const cellW = (contentW - colGap) / 2;
  // Dos filas: cada fila = (usableH - rowGap) / 2 , descontando comentario
  const rowH  = (usableH - rowGap) / 2;
  const imgH  = rowH - comH - 4; // altura de la imagen dentro de la fila

  // Posiciones X de cada columna
  const colX = [margin, margin + cellW + colGap];

  // Procesamos las fotos de 4 en 4
  for (let i = 0; i < fotosActivas.length; i++) {
    const posEnPagina = i % 4; // 0..3

    // Al inicio de cada grupo de 4 → nueva página
    if (posEnPagina === 0) {
      doc.addPage();
      drawHeader(false);
    }

    const col = posEnPagina % 2;       // 0 = izq, 1 = der
    const row = Math.floor(posEnPagina / 2); // 0 = arriba, 1 = abajo

    const x  = colX[col];
    const yBase = headerH + margin + row * (rowH + rowGap);

    const foto = fotosActivas[i];

    // Número de foto pequeño
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(200, 80, 90);
    doc.text(`FOTO ${foto.numeroReal}`, x, yBase + 4);

    // Imagen
    const imgY = yBase + 6;
    const format = getImgFormat(foto.dataUrl);

    // Calcular dimensiones preservando aspecto dentro de cellW × imgH
    const dims = await getImageDimensions(foto.dataUrl);
    let dw = cellW, dh = (cellW * dims.height) / dims.width;
    if (dh > imgH) { dh = imgH; dw = (imgH * dims.width) / dims.height; }
    const imgX = x + (cellW - dw) / 2;

    // Fondo gris de la celda imagen
    doc.setFillColor(235, 235, 240);
    doc.rect(x, imgY, cellW, imgH, 'F');

    doc.addImage(foto.dataUrl, format, imgX, imgY, dw, dh);

    // Comentario debajo de la imagen
    const comY = imgY + imgH + 1.5;
    if (foto.comentario) {
      doc.setFillColor(248, 248, 252);
      doc.rect(x, comY, cellW, comH - 1, 'F');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 80);
      const comLines = doc.splitTextToSize(foto.comentario, cellW - 2);
      const maxLines = 2;
      comLines.slice(0, maxLines).forEach((line, li) => {
        doc.text(line, x + 1.5, comY + 3.5 + li * 3.5);
      });
    } else {
      doc.setFillColor(240, 240, 245);
      doc.rect(x, comY, cellW, comH - 1, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(180, 180, 200);
      doc.text('Sin comentario', x + 1.5, comY + 3.5);
    }
  }

  // ── Pie de página en TODAS las páginas ──
  drawFooters(doc.internal.getNumberOfPages());

  // ── Descargar ──
  doc.save(`reportaje_${fecha.replace(/-/g,'')}.pdf`);
}

// ---- Helpers ----

function getImgFormat(dataUrl) {
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  if (dataUrl.includes('image/png'))  return 'PNG';
  if (dataUrl.includes('image/webp')) return 'WEBP';
  return 'JPEG';
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 4, height: 3 });
    img.src = dataUrl;
  });
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-');
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
}

function showToast(msg, duration = 2800) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ---- Service Worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('SW registrado'))
      .catch(err => console.warn('SW error:', err));
  });
}
