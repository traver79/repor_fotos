'use strict';

const fotos = [];
let contadorFotos = 0;

const reportForm = document.getElementById('reportForm');
const asuntoEl = document.getElementById('asunto');
const direccionEl = document.getElementById('direccionCliente');
const descripcionEl = document.getElementById('descripcionGeneral');
const fechaEl = document.getElementById('fecha');
const inputGaleria = document.getElementById('inputGaleria');
const inputCamara = document.getElementById('inputCamara');
const btnGaleria = document.getElementById('btnGaleria');
const btnCamara = document.getElementById('btnCamara');
const fotosContainer = document.getElementById('fotosContainer');
const fotosEmpty = document.getElementById('fotosEmpty');
const fotoCounter = document.getElementById('fotoCounter');
const fotoCounterText = document.getElementById('fotoCounterText');
const btnGenerar = document.getElementById('btnGenerar');
const toastEl = document.getElementById('toast');

(function setDefaultDate() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  fechaEl.value = `${yyyy}-${mm}-${dd}`;
})();

btnGaleria.addEventListener('click', () => inputGaleria.click());
btnCamara.addEventListener('click', () => inputCamara.click());
inputGaleria.addEventListener('change', (e) => handleFiles(e.target.files));
inputCamara.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
  if (!files || files.length === 0) return;

  [...files].forEach((file) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const idx = fotos.length;
      contadorFotos += 1;
      fotos.push({ dataUrl: e.target.result, comentario: '', numeroReal: contadorFotos });
      renderFotoCard(idx);
      updateUI();
    };
    reader.readAsDataURL(file);
  });

  inputGaleria.value = '';
  inputCamara.value = '';
}

function renderFotoCard(idx) {
  const foto = fotos[idx];
  const card = document.createElement('div');
  card.className = 'foto-card';
  card.dataset.idx = idx;

  card.innerHTML = `
    <div class="foto-card-header">
      <span class="foto-numero">Foto ${foto.numeroReal}</span>
      <button type="button" class="btn-remove-foto">Eliminar</button>
    </div>
    <img class="foto-card-img" src="${foto.dataUrl}" alt="Foto ${foto.numeroReal}" loading="lazy" />
    <div class="foto-card-body">
      <label class="foto-comentario-label" for="fotoComentario${idx}">Comentario</label>
      <textarea id="fotoComentario${idx}" class="foto-comentario" rows="2" placeholder="Comentario de esta foto"></textarea>
    </div>
  `;

  const textarea = card.querySelector('.foto-comentario');
  textarea.addEventListener('input', () => {
    if (fotos[idx]) fotos[idx].comentario = textarea.value;
  });

  card.querySelector('.btn-remove-foto').addEventListener('click', () => {
    fotos[idx] = null;
    card.remove();
    updateUI();
  });

  fotosContainer.appendChild(card);
}

function updateUI() {
  const activas = fotos.filter((f) => f !== null);
  const n = activas.length;

  fotosEmpty.style.display = n === 0 ? 'flex' : 'none';
  fotoCounter.style.display = n === 0 ? 'none' : 'flex';

  if (n > 0) {
    const paginas = Math.ceil(n / 4);
    fotoCounterText.textContent = `${n} foto${n !== 1 ? 's' : ''} · ${paginas} página${paginas !== 1 ? 's' : ''}`;
  }
}

reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const asunto = asuntoEl.value.trim();
  const direccionCliente = direccionEl.value.trim();
  const descripcionGeneral = descripcionEl.value.trim();
  const fecha = fechaEl.value;

  if (!asunto) {
    showToast('El asunto general es obligatorio');
    asuntoEl.focus();
    return;
  }

  if (!fecha) {
    showToast('Selecciona una fecha');
    fechaEl.focus();
    return;
  }

  const fotosActivas = fotos.filter((f) => f !== null);

  btnGenerar.disabled = true;
  showToast('Generando PDF...');

  try {
    await generarPDF({ asunto, direccionCliente, descripcionGeneral, fecha, fotosActivas });
    showToast('PDF generado');
  } catch (error) {
    console.error(error);
    showToast('Error al generar PDF');
  } finally {
    btnGenerar.disabled = false;
  }
});

async function generarPDF({ asunto, direccionCliente, descripcionGeneral, fecha, fotosActivas }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  const footerY = pageH - 8;

  function drawHeader(title) {
    doc.setFillColor(238, 238, 238);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text(title, margin, 17);
  }

  drawHeader('Reporte fotográfico');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(`Fecha: ${formatearFecha(fecha)}`, margin, 35);

  let y = 48;
  y = drawBlock(doc, 'Asunto general', asunto, margin, y, contentW);
  y = drawBlock(doc, 'Dirección del cliente', direccionCliente || 'No indicada', margin, y, contentW);
  y = drawBlock(doc, 'Descriptivo', descripcionGeneral || 'Sin descriptivo', margin, y, contentW);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const totalPagFotos = Math.ceil((fotosActivas.length || 1) / 4);
  doc.text(`Fotos: ${fotosActivas.length} (${totalPagFotos} página${totalPagFotos !== 1 ? 's' : ''})`, margin, y + 3);

  if (fotosActivas.length > 0) {
    const headerBottom = 25;
    const footerSpace = 12;
    const colGap = 6;
    const rowGap = 6;
    const comentarioH = 16;

    const usableH = pageH - headerBottom - margin - footerSpace;
    const cellW = (contentW - colGap) / 2;
    const rowH = (usableH - rowGap) / 2;
    const imgH = rowH - comentarioH - 6;

    const colX = [margin, margin + cellW + colGap];

    for (let i = 0; i < fotosActivas.length; i += 1) {
      const pos = i % 4;

      if (pos === 0) {
        doc.addPage();
        drawHeader('Fotos');
      }

      const col = pos % 2;
      const row = Math.floor(pos / 2);
      const x = colX[col];
      const yBase = headerBottom + margin + row * (rowH + rowGap);
      const foto = fotosActivas[i];

      doc.setDrawColor(170);
      doc.setLineWidth(0.2);
      doc.rect(x, yBase, cellW, rowH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`Foto ${foto.numeroReal}`, x + 2, yBase + 4);

      const imgY = yBase + 6;
      const format = getImgFormat(foto.dataUrl);
      const dims = await getImageDimensions(foto.dataUrl);

      let dw = cellW - 2;
      let dh = (dw * dims.height) / dims.width;
      if (dh > imgH) {
        dh = imgH;
        dw = (dh * dims.width) / dims.height;
      }
      const imgX = x + (cellW - dw) / 2;

      doc.addImage(foto.dataUrl, format, imgX, imgY, dw, dh);

      const comentarioY = yBase + rowH - comentarioH + 6;
      const comentarioTexto = (foto.comentario || 'Sin comentario').trim();
      const lineas = doc.splitTextToSize(comentarioTexto, cellW - 4).slice(0, 3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      lineas.forEach((linea, idx) => {
        doc.text(linea, x + 2, comentarioY + idx * 3.2);
      });
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Página ${page} de ${totalPages}`, pageW / 2, footerY, { align: 'center' });
  }

  const baseDireccion = sanitizeFilePart(direccionCliente || 'sin_direccion');
  doc.save(`reporte_${baseDireccion}_${fecha.replace(/-/g, '')}.pdf`);
}

function sanitizeFilePart(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'sin_direccion';
}

function drawBlock(doc, title, value, x, y, width) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(value, width);
  let textY = y + 7;
  lines.forEach((line) => {
    doc.text(line, x, textY);
    textY += 6;
  });

  const dividerY = textY + 2;
  doc.line(x, dividerY, x + width, dividerY);
  return dividerY + 7;
}

function getImgFormat(dataUrl) {
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/webp')) return 'WEBP';
  return 'JPEG';
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 4, height: 3 });
    img.src = dataUrl;
  });
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
}

function showToast(msg, duration = 2500) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch((err) => console.warn('SW error:', err));
  });
}
