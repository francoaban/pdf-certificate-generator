# Generador de certificados

Aplicación web para generar certificados PDF a partir de planillas Excel o CSV.

## Organización del código

La lógica nueva se organiza por funcionalidad dentro de `src/features/`:

- `import/`: carga de Excel/CSV, selector de archivo y selección de hoja.
- `records/`: tabla, reglas de registros y códigos de certificado.
- `certificates/`: vista previa y coordinación de generación individual o por lote.
- `settings/`: paneles, selectores visuales, opciones y persistencia.
- `components/` y `hooks/` en la raíz: elementos globales compartidos, como el
  capturador global de errores y el aviso de actualización.
- `utils/` y `certificates/` en la raíz: módulos existentes que se irán
  incorporando a las funcionalidades cuando se trabajen; no se duplican para
  completar una estructura de carpetas.

`src/App.jsx` coordina la pantalla y conecta los hooks de cada funcionalidad.
Las reglas de dominio se mantienen independientes de los componentes para
facilitar su prueba y evolución.

Además de nombre y documento, reconoce columnas opcionales `curso`, `horas`,
`fecha`, `instructor` y `codigo`. Las fechas de la planilla se normalizan a un
formato legible (`12 de octubre de 2026`), incluidas las fechas seriales de
Excel. Genera un código único y un QR offline por certificado; el QR contiene
los datos para consulta local, no una validación contra un servidor. Los códigos
repetidos se marcan en la tabla para corregirlos, sin bloquear la importación.
Las firmas pueden llevar imágenes PNG transparentes, y el nombre puede usar la
caligrafía del estilo o una fuente elegida entre Great Vibes, Parisienne,
Pinyon Script, Sacramento, serif o sans. El título, el subtítulo y el cuerpo
tienen selección de tipografía independiente, y cualquier texto acepta
`**texto**` para negrita. Cada texto del certificado —título, subtítulo, texto
previo, nombre, documento, cuerpo, fecha y firmas— tiene su propio tamaño, con
un rango de 80 % a 150 %. La fecha y la ubicación se muestran debajo
del cuerpo, alineadas a la derecha; el logo se ubica arriba a la izquierda con
un alto del 30 % de la hoja. Al cargar un logo personalizado se
puede activar **«Generar fondo con el logo»**, que agrega una marca de agua
centrada de hasta un tercio del ancho de la hoja. Las opciones se pueden
importar/exportar como JSON para compartirlas entre dispositivos o
instalaciones. La configuración importada se valida antes de aplicarse.

Los archivos se procesan localmente en el navegador: las planillas, los datos y
las imágenes no se envían a ningún servidor. El límite de carga es de 20 MB y se
admiten `.xlsx`, `.xls` y `.csv` (incluidos CSV en UTF-8 y Windows-1252). La
plantilla de ejemplo incluye las columnas `Nombre`, `Apellido`,
`Tipo de documento`, `Documento`, `Curso`, `Horas`, `Fecha`, `Instructor` y
`Código`; las columnas opcionales pueden omitirse. Si no incluís la columna
`Tipo de documento`, se asume DNI: para DNIs extranjeros, pasaportes u otros
tipos conviene traer esa columna explícita. El documento se muestra en el
certificado por defecto y se puede ocultar desde **Configuración → Datos** sin
quitarlo de la tabla ni del nombre de archivo. La imagen de fondo personalizada se
elige desde un archivo PNG, JPG o WebP (máximo 5 MB), se reduce y se guarda
localmente en el dispositivo con el mismo mecanismo que el logo y las firmas.
También se pueden elegir fondos predeterminados desde una galería —incluido el
fondo **Rojo floral**—, personalizar el color principal del fondo floral o
definir un color principal y otro secundario para los detalles decorativos de
los fondos vectoriales, y elegir si la
imagen cubre la página o se ajusta completa, siempre conservando su proporción y
centrada. Los colores no modifican el papel ni los textos, para mantener el
contraste. Las configuraciones antiguas con una URL HTTPS siguen siendo
compatibles, pero para uso sin conexión conviene cargar el archivo desde este
dispositivo.

## Requisitos

- Node.js 22.12 o superior
- pnpm 11.10.0

La versión de pnpm está declarada en `package.json` y la de Node en `engines`.

## Desarrollo

Instalá las dependencias y levantá el servidor local:

```sh
pnpm install
pnpm dev
```

## Aplicación de escritorio para Windows

La aplicación también se puede ejecutar como programa de escritorio con
Electron. Para probarla durante el desarrollo, usá:

```sh
pnpm desktop:dev
```

En Windows, generá el instalador `.exe` con:

```sh
pnpm install --frozen-lockfile
pnpm build:win
```

El instalador x64 queda en `release/` y permite elegir la carpeta de
instalación; también crea accesos directos en el escritorio y el menú Inicio.
La aplicación procesa planillas y genera certificados localmente, sin
necesidad de conexión. El instalador no está firmado digitalmente, por lo que
Windows puede mostrar una advertencia de SmartScreen al instalarlo.

## Uso sin conexión

Generá la versión instalable con `pnpm build` y publicá el contenido de `dist/`
en un sitio HTTPS. Las rutas del build son relativas, así que también funciona
en una subcarpeta (por ejemplo, GitHub Pages). Abrí el sitio una vez con
conexión y esperá a que termine la carga inicial; después podés instalarlo desde
el navegador. El service worker guarda los archivos de la aplicación para abrirla
y generar certificados sin internet. Cuando hay una actualización disponible, la
app muestra un aviso para aplicarla. En iOS, usá “Añadir a pantalla de inicio”
desde Safari.

## Despliegue en Vercel

Importá el repositorio en Vercel y dejá la raíz del proyecto como directorio
raíz. El archivo `vercel.json` configura la instalación reproducible con pnpm,
el build de Vite y la publicación de `dist/`. Vercel sirve la aplicación desde
la raíz del dominio; el build ajusta automáticamente las rutas de recursos para
ese caso. El service worker y el manifiesto se sirven sin caché persistente para
que las actualizaciones de la PWA se detecten correctamente.

La aplicación y la generación de PDF se ejecutan en el navegador; Vercel solo
aloja los archivos estáticos. No se requieren funciones serverless ni variables
de entorno para el flujo actual. La CI valida instalación, lint, pruebas y build
antes de integrar cambios.

La instalación o actualización de dependencias de desarrollo requiere descargar
paquetes (o tenerlos previamente en la caché local de pnpm); no es necesaria
para usar la aplicación ya compilada e instalada.

## Comandos

```sh
pnpm build    # Genera la versión de producción en dist/
pnpm preview  # Sirve localmente la versión de producción
pnpm lint     # Ejecuta ESLint
pnpm test     # Ejecuta las pruebas con Vitest
```
