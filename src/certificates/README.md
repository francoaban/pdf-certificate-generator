# Estilos de certificado

Cuatro variantes de certificado A4 horizontal generadas con **jsPDF**. Cada estilo
declara su fondo, su fuente caligráfica y su propia composición; el resto (datos,
logo, formato de documento, nombre de archivo y exportación) lo resuelve el
generador existente en `src/utils/pdfGenerator.js`.

| id         | Nombre          | Fondo                          | Caligrafía    |
| ---------- | --------------- | ------------------------------ | ------------- |
| `clasico`  | Clásico dorado  | `backgrounds/clasico.svg`      | Great Vibes   |
| `moderno`  | Moderno         | `backgrounds/moderno.svg`      | Sacramento    |
| `elegante` | Elegante        | `backgrounds/elegante.svg`     | Pinyon Script |
| `botanico` | Botánico        | `backgrounds/botanico.svg`     | Parisienne    |

La caligrafía de la tabla es la que se usa con `options.nameFont = 'auto'`. La
opción `nameFont` permite elegir `great-vibes`, `parisienne`, `pinyon-script`,
`sacramento`, `serif` o `sans` para el nombre y apellido completo. Las fuentes
TTF se cargan además de la fuente del estilo cuando hace falta.

## Uso

El estilo se elige con `options.style` (por defecto `clasico`). Todas las APIs
respetan esa opción:

```js
import {
  DEFAULT_OPTIONS,
  generateCertificate,
  generateBulkPdf,
  generateZip,
  buildPreviewUrl,
} from '../utils/pdfGenerator'

const record = {
  id: 1,
  nombre: 'María José',
  apellido: 'Pérez González',
  docType: 'DNI',
  docNumber: '30123456',
}

await generateCertificate(record, { ...DEFAULT_OPTIONS, style: 'elegante' })
await generateBulkPdf(records, { ...DEFAULT_OPTIONS, style: 'moderno' })
await generateZip(records, { ...DEFAULT_OPTIONS, style: 'botanico' }, onProgress)
const previewUrl = await buildPreviewUrl(record, { ...DEFAULT_OPTIONS, style: 'clasico' })
```

La línea del documento se controla con `options.showDocument` (`true` por
defecto). Si se desactiva, el documento sigue disponible para la tabla y el
nombre de archivo, pero no se dibuja en el certificado. `options.docDots`
mantiene o quita los separadores de miles.

Los textos aceptan marcadores `**texto**` para negrita, incluso en una parte del
cuerpo (`... su dedicación. **Gracias por participar.**`). Las fuentes del
título, subtítulo y cuerpo se eligen de forma independiente con
`options.titleFont`, `options.subtitleFont` y `options.bodyFont`; `auto`
conserva la tipografía de cada estilo. Cada texto se escala por separado con
`options.titleSize`, `subtitleSize`, `preTextSize`, `nameSize`, `bodySize`,
`dateSize`, `signatureSize` y `documentSize` (100 por defecto, entre 80 y 150).
La fecha y la ubicación se dibujan debajo del cuerpo y alineadas a la derecha. El
logo se ubica arriba a la izquierda con una altura del 30 % de la hoja y ancho
proporcional.

En la interfaz, el estilo se elige en **Configuración → Diseño → Estilo del
certificado** y los tamaños de cada texto en **Configuración → Personalizar
Textos**.

## Cómo funciona

- `styles/*.js`: cada archivo exporta un objeto con `id`, `name`, `description`,
  `background`, `fonts` y `draw(doc, { options, view, logo })`.
- `shared.js`: utilidades de dibujo (texto ajustado, firmas, logo) y carga de
  recursos. Los SVG se rasterizan a JPEG/PNG y las fuentes TTF se registran en
  jsPDF; ambos se cachean entre certificados.
- `styles/index.js`: registro de estilos y metadatos para el selector.
- `pdfGenerator.js`: prepara fondo, logo y fuentes una sola vez y reutiliza los
  recursos en la vista previa, la exportación individual, el PDF combinado y el ZIP.

Los fondos viven en `public/backgrounds/` y las fuentes en `public/fonts/`. El
selector de fondos muestra una galería con `backgrounds/generico.svg`,
`backgrounds/rojo-floral.png` y los fondos de los cuatro estilos; también
permite elegir `cover` o `contain` como ajuste, personalizar el color principal
del fondo floral y los colores principal y secundario de los detalles
decorativos de los SVG. El papel y los textos mantienen sus colores para
conservar el contraste. En el fondo floral solo se recolorean los trazos rojos;
el papel blanco y el resto del diseño se conservan. Las fuentes están
incluidas en el precache de la PWA para que la app funcione offline.

## Agregar o personalizar un estilo

1. Copiá un archivo de `styles/` y cambiá `id`, `name`, `description`, `background`,
   `fonts` y el método `draw`.
2. Registralo en `styles/index.js`.
3. Si usás otra fuente TTF, agregala a `public/fonts/` y declarárala en `fonts`:

```js
fonts: {
  script: { family: 'MiFuente', file: 'fonts/MiFuente-Regular.ttf' },
}
```

Para reemplazar solo el fondo sin crear un estilo nuevo, activá
`options.showImageBackground` y asigná `options.imageBackground` con un asset
`{ dataUrl, ratio, name }` (lo que produce el selector de archivos de la app) o,
para integraciones, con una URL, un data URL o una ruta de `public/`. Si la
opción está desactivada, se usa el fondo del estilo seleccionado. Para desactivar
todo fondo, `options.useBackground = false`.

El ajuste se controla con `options.backgroundFit`:

- `cover` (por defecto): llena la página conservando la proporción y recorta el
  excedente de forma centrada.
- `contain`: muestra la imagen completa, conserva la proporción y la centra con
  márgenes.

Los fondos se pueden elegir desde `BACKGROUND_PRESETS`; el estilo define la
composición y el fondo solo reemplaza la imagen.

Los colores decorativos se controlan con `options.primaryColor` y
`options.secondaryColor` (hexadecimales). Si quedan en `null`, se usa la paleta
del fondo activo definida en `BACKGROUND_PALETTES`. La personalización se aplica
a los SVG de `public/backgrounds/`; en el fondo floral, `primaryColor` recolorea
sus trazos rojos. Las imágenes subidas o remotas conservan sus colores. El
reemplazo de colores y el recoloreado del floral están en
`src/utils/backgroundColors.js`; la carga con colores en
`src/utils/backgroundLoader.js`.

Con un logo personalizado, `options.backgroundFromLogo = true` dibuja una marca
de agua centrada sobre el fondo. El logo ocupa hasta un tercio del ancho de la
hoja y se limita en alto para no invadir los textos; el cálculo está en
`src/utils/backgroundLogo.js`. La marca de agua se repite en cada página del PDF
combinado.

La línea de lugar y fecha usa `city` (o `location` en integraciones directas),
`province` y `country` según sus opciones `showCity`, `showProvince` y
`showCountry`.

Los logos y fondos configurados por el usuario se almacenan en IndexedDB; las
opciones restantes se guardan en localStorage. La fecha vacía significa usar
la fecha actual y se calcula al generar el certificado.

Al importar una planilla se reconocen también las columnas `curso`, `horas`,
`fecha`, `instructor` y `codigo` (incluidas variantes habituales). Las fechas se
normalizan a un texto legible (incluidos seriales de Excel). Se generan códigos
únicos para filas sin código y los códigos repetidos se marcan en la tabla para
corregirlos o regenerarlos, sin bloquear el resto de la importación. Los PDF
incluyen los datos por fila, un QR offline con el código y datos del certificado,
y firmas opcionales en PNG. El QR permite consultar la información sin conexión;
no representa una validación criptográfica ni consulta un registro público.

La configuración se puede exportar e importar como JSON, incluidas las imágenes
y firmas guardadas en IndexedDB.

## Notas

- `country` es la opción canónica. Las configuraciones antiguas con `contry` se
  migran al leerlas; `locations` también se migra a `city`.
- El logo es el que ya usa la app: `options.customLogo` o el logo por defecto de
  `src/utils/logo.js`. Se dibuja conservando su relación de aspecto.
- Los nombres se dibujan con la fuente elegida en `nameFont`; con `auto` se usa
  la TTF cursiva declarada por cada estilo. La fuente se registra en el PDF para
  conservar caracteres latinos extendidos.
- Las fuentes incluidas son SIL Open Font License 1.1; ver `public/fonts/README.md`
  y los archivos `OFL-*.txt` de cada familia.
