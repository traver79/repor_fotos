# 📷 Reportaje PDF

PWA (Progressive Web App) para crear reportajes fotográficos en PDF directamente desde el móvil.

## ✨ Características

- **Formulario completo**: Asunto, fecha (hoy por defecto) y observaciones
- **Gestión de fotos**: Elige desde la galería o captura con la cámara
- **Comentarios por foto**: Añade texto descriptivo a cada imagen
- **Previsualización**: Ve las fotos antes de generar el PDF
- **Generación PDF**: PDF profesional con cabecera, fotos y comentarios
- **PWA**: Instalable en móvil, funciona offline (fotos ya cargadas)
- **Sin servidor**: Todo funciona en el navegador, sin backend

## 🚀 Cómo usar

### Opción 1 – GitHub Pages (recomendado)

1. Haz fork de este repositorio
2. Ve a **Settings → Pages → Branch: main → / (root)**
3. Abre la URL que te dé GitHub Pages en tu móvil
4. Instala la app: menú del navegador → "Añadir a pantalla de inicio"

### Opción 2 – Servidor local

```bash
# Con Python
python3 -m http.server 8080

# Con Node.js / npx
npx serve .
```

Abre `http://localhost:8080` en tu navegador.

### Opción 3 – Cualquier hosting estático

Sube todos los archivos a Netlify, Vercel, Cloudflare Pages, etc.

## 📁 Estructura

```
reportaje-pdf/
├── index.html          # App principal
├── style.css           # Estilos
├── app.js              # Lógica + generación PDF
├── sw.js               # Service Worker (offline)
├── manifest.json       # Manifiesto PWA
├── generate-icons.js   # Script helper para iconos
└── icons/
    ├── icon-192.png    # Icono PWA
    └── icon-512.png    # Icono PWA grande
```

## 🔧 Dependencias externas (CDN)

- **jsPDF 2.5.1** – Generación de PDF en el cliente
- **Google Fonts** – Tipografías Syne y DM Sans

No hay dependencias npm necesarias para ejecutar la app.

## 📄 Formato del PDF generado

- Cabecera con franja de color, nombre del app y fecha
- Asunto en tamaño grande
- Observaciones (si las hay)
- Fotos con numeración y comentarios
- Pie de página con numeración
- Todo en A4 portrait

## 🔮 Próximas mejoras

- [ ] Selector de plantillas de PDF
- [ ] Logo personalizado en cabecera
- [ ] Reordenar fotos con drag & drop
- [ ] Exportar también a DOCX
- [ ] Modo claro / oscuro

## 📝 Licencia

MIT – úsalo libremente.
