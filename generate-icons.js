#!/usr/bin/env node
// Script auxiliar para generar los iconos PNG con canvas
// Ejecutar: node generate-icons.js (requiere npm install canvas)
// O simplemente usa cualquier imagen 192x192 y 512x512 como icon-192.png e icon-512.png

console.log(`
Para los iconos de la PWA, necesitas dos archivos PNG:
  - icons/icon-192.png  (192x192 px)
  - icons/icon-512.png  (512x512 px)

Puedes generarlos de cualquiera de estas formas:
  1. Usa una herramienta online como https://realfavicongenerator.net
  2. Usa cualquier imagen cuadrada y renómbrala
  3. Ejecuta: npm install canvas && node generate-icons.js --create

El script puede crear iconos básicos si tiene el módulo 'canvas' instalado.
`);

if (process.argv.includes('--create')) {
  try {
    const { createCanvas } = require('canvas');
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync('icons')) fs.mkdirSync('icons');

    [192, 512].forEach(size => {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Fondo
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, size, size);

      // Círculo accent
      const cx = size / 2;
      const cy = size / 2;
      const r  = size * 0.38;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#e63946';
      ctx.fill();

      // Cámara emoji simplificado
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${size * 0.32}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📷', cx, cy + size * 0.02);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(path.join('icons', `icon-${size}.png`), buffer);
      console.log(`✅ icons/icon-${size}.png generado`);
    });
  } catch (e) {
    console.error('Error: instala canvas con: npm install canvas');
  }
}
