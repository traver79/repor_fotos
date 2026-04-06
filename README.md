# Reportaje PDF

Aplicación web/PWA para generar reportes fotográficos en PDF desde móvil o escritorio, sin backend.

## Qué hace ahora

- Formulario simple con:
  - Asunto general (obligatorio)
  - Dirección del cliente
  - Descriptivo
  - Fecha (obligatoria, con valor por defecto hoy)
- Carga de fotos desde galería o cámara.
- Comentario individual por foto.
- Salida en PDF A4:
  - Portada con datos del reporte.
  - Páginas de fotos en cuadrícula 2x2 (4 fotos por página).
  - Encabezado gris claro y pie con numeración.

## Uso rápido

### Opción 1: servidor local

```bash
python3 -m http.server 8080
# o
npx serve .
```

Abrir `http://localhost:8080`.

### Opción 2: hosting estático

Publica estos archivos en GitHub Pages, Netlify, Vercel, Cloudflare Pages o similar.

## Estructura del proyecto

```txt
.
├── index.html
├── style.css
├── app.js
├── sw.js
├── manifest.json
├── generate-icons.js
└── icons/
```

## Dependencias

- `jsPDF` desde CDN para generar el PDF en cliente.
- No requiere instalación de paquetes para ejecutarse.

## PWA y caché (importante)

La app usa Service Worker (`sw.js`) para cachear recursos.

Si ves una versión vieja (por ejemplo, estilos antiguos o cambios de PDF que no aparecen):

1. Haz una recarga forzada del navegador.
2. Cierra y vuelve a abrir la app instalada.
3. En DevTools, limpia storage/cache del sitio.

El registro del SW está configurado para reducir problemas de caché en despliegues.

## Nota sobre conflictos de merge

Si GitHub marca conflictos en `app.js`:

1. Abre el archivo en la rama de trabajo.
2. Elimina cualquier bloque con:
   - `<<<<<<<`
   - `=======`
   - `>>>>>>>`
3. Deja una única versión final válida.
4. Ejecuta:

```bash
node --check app.js
```

5. Commit y push de la resolución.

## Licencia

MIT.
