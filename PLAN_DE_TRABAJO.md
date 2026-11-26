# Plan de trabajo — optimización de carga y alineación de textos

**Estado:** propuesto, pendiente de confirmación  
**Repositorio:** `pdf-certificate-generator`  
**Rama base recomendada:** `master` (`30ad6a7`)  
**Fecha:** 23 de noviembre de 2026

---

## 1. Objetivo

Mejorar la carga de información y el uso de recursos del generador de certificados, y agregar alineación configurable para título, subtítulo, ubicación y fecha, sin alterar los diseños actuales.

El plan cubre cuatro frentes:

1. **Carga de información:** importación de planillas, persistencia de opciones, vista previa y exportación por lotes.
2. **Templates e imágenes:** uso eficiente de fondos y conversión controlada de assets raster a SVG.
3. **Alineación de textos:** opciones `auto`, `left`, `center` y `right` para cuatro grupos de texto.
4. **Organización del trabajo:** ramas independientes, criterios de aceptación y orden de integración.

### Fuera de alcance en esta etapa

- Cambiar la estética o la composición de los cuatro estilos existentes.
- Vectorizar fotografías, firmas escaneadas o imágenes subidas por usuarios.
- Reemplazar jsPDF por otro motor de PDF.
- Cambiar el formato de la planilla de entrada o las columnas reconocidas.
- Publicar cambios en producción sin aprobación visual previa.

---

## 2. Diagnóstico actual

### Flujo principal

1. `useWorkbook` recibe el archivo y llama a `excelParser`.
2. `XLSX.read` y `sheet_to_json` se ejecutan en el hilo principal.
3. `App` guarda los registros y columnas en estado.
4. `useSettings` persiste las opciones en `localStorage`; los assets se guardan en IndexedDB.
5. `CertificatePreview` regenera un PDF completo con un debounce de 150 ms.
6. `pdfGenerator.prepare` carga logo, fondo y fuentes; cada estilo dibuja los textos con posiciones fijas.
7. `loadImageAsset` rasteriza SVG/PNG a canvas; `backgroundLoader` recolorea el fondo floral píxel por píxel.

### Fortalezas que deben conservarse

- Caché de fuentes y assets entre certificados.
- Importaciones dinámicas de XLSX, JSZip y QR.
- Validación de configuración guardada e importada.
- Paginación de la tabla de registros.
- Funcionamiento local y offline.
- Cuatro estilos con fondos vectoriales.

### Cuellos de botella detectados

- Parseo de planillas grandes en el hilo principal.
- Guardado en `localStorage` ante cada tecla o movimiento de slider.
- Vista previa que reconstruye todo el PDF ante cualquier cambio, sin cancelar ejecuciones anteriores.
- Recoloreado del fondo floral sobre aproximadamente 2 millones de píxeles en el hilo principal.
- Galería de fondos cargando assets completos.
- ZIP generado completamente en memoria.
- Fuentes TTF completas embebidas en cada PDF.
---

## 3. Decisiones pendientes antes de implementar

| # | Decisión | Recomendación |
|---|---|---|
| 1 | Rama base | Usar `master`, que contiene el código actual. `origin/main` está en el commit inicial. Confirmar si luego se actualiza `main`. |
| 2 | Alcance de alineación de fecha y ubicación | Cuatro controles (`locationAlign`, `dateAlign`) con `auto`; si las alineaciones difieren, mostrar dos líneas. |
| 3 | Alcance de conversión SVG | `rojo-floral.svg` reemplaza al PNG; el PNG se eliminó tras comparar ambos al mismo tamaño y queda disponible en el historial de Git. |
| 4 | SVG subidos por usuarios | No aceptarlos por ahora: requieren sanitización y jsPDF los rasteriza igual. |
| 5 | Archivo `escudo.png` | Eliminado con aprobación del usuario; no tenía referencias en el código. |
| 6 | `certificado-ejemplo.svg` | Eliminado con aprobación del usuario; no tenía referencias en el código. |

---

## 4. Convenciones de trabajo

### Ramas

- Crear ramas cortas desde `master`.
- Un objetivo por rama y un PR por objetivo.
- Rebase sobre `master` antes de abrir el PR.
- Mantener los cambios visuales separados de los cambios de rendimiento cuando sea posible.

```sh
git switch master
git pull origin master
git switch -c perf/importacion-planillas
```

### Commits

Usar convención:

- `feat(alignment): ...`
- `perf(import): ...`
- `perf(preview): ...`
- `assets(svg): ...`
- `test(visual): ...`
- `chore(docs): ...`

### Definition of Done por rama

- [ ] `pnpm lint` sin errores.
- [ ] `pnpm test` sin errores.
- [ ] `pnpm build` correcto.
- [ ] Sin regresiones visuales con las opciones por defecto.
- [ ] Configuraciones antiguas siguen cargando.
- [ ] Documentación actualizada cuando corresponda.
- [ ] Criterios de aceptación de la rama verificados.

---

## 5. Backlog por ramas

### Rama 1 — `test/paridad-visual`

**Objetivo:** crear la red de seguridad visual antes de tocar assets o estilos.

**Tareas:**

- [ ] Definir fixtures de certificados para los cuatro estilos con opciones por defecto.
- [ ] Agregar fixtures de planillas (1.000, 10.000 y 50.000 filas) e imágenes de prueba.
- [ ] Crear un script reproducible que genere PDFs y los rasterice a PNG.
- [ ] Incorporar comparación visual con `pixelmatch` y/o SSIM.
- [ ] Documentar el umbral aceptado: diferencia de píxeles ≤ 0,5 % y ΔE máximo ≤ 2.
- [ ] Definir si la comparación corre en CI o solo de forma manual antes de un PR visual.

**Archivos principales:**

- `scripts/`
- `tests/fixtures/`
- `package.json`

**Depende de:** nada.

**Estimación:** 1–2 días.

---

### Rama 2 — `assets/vectores-svg`

**Objetivo:** convertir a SVG los assets planos que lo admiten, preservando el diseño.

**Tareas:**

- [ ] Buscar los vectores originales del logo y del fondo floral antes de trazar.
- [ ] Reconstruir `logo-generico` como SVG limpio si no existe el original.
- [ ] Vectorizar `rojo-floral.png` por capas de color, conservando el rojo exacto `#a83837`, el papel blanco y la transparencia.
- [ ] Normalizar `viewBox`, dimensiones, colores y transparencias.
- [ ] Optimizar con SVGO sin eliminar IDs usados por gradientes o `<use>`.
- [ ] Comparar PNG original vs SVG al mismo tamaño.
- [ ] Comparar PDF antes/después: aspecto, tamaño y tiempo de generación.
- [ ] Actualizar `backgrounds.js` y `defaults.js` para usar `backgrounds/rojo-floral.svg`.
- [ ] Pasar el floral por la ruta SVG de `backgroundLoader.js` y quitar el recoloreado por píxeles para ese preset.
- [ ] Agregar `COLOR_MAPS['rojo-floral']` con los colores exactos en `backgroundColors.js`.
- [ ] Actualizar `logo.js` para cargar el SVG y rasterizarlo a un tamaño adecuado para impresión.
- [x] Comparar `rojo-floral.svg` con el PNG al mismo tamaño y eliminar `public/backgrounds/rojo-floral.png`; el PNG sigue disponible en el historial de Git.
- [ ] Actualizar pruebas de fondos, colores y carga.

**Archivos principales:**

- `public/backgrounds/rojo-floral.svg` (nuevo)
- `src/assets/logo-generico.svg` (nuevo)
- `src/certificates/backgrounds.js`
- `src/certificates/defaults.js`
- `src/utils/backgroundLoader.js`
- `src/utils/backgroundColors.js`
- `src/utils/logo.js`
- `src/utils/imageAsset.js`
- `src/certificates/backgrounds.test.js`
- `src/utils/backgroundColors.test.js`

**Depende de:** Rama 1.

**Criterios de aceptación:**

- [ ] El certificado floral se ve igual que antes.
- [ ] El recoloreado produce los mismos tonos que la paleta actual.
- [ ] El PDF no empeora de tamaño sin justificación.
- [ ] La carga del fondo no es más lenta que la actual.
- [ ] La paridad visual está documentada.

**Estimación:** 2–3 días.

**Nota técnica:** jsPDF no inserta SVG directamente con `addImage`; el flujo actual lo rasteriza. Convertir a SVG mejora la fuente, el recoloreado y la nitidez, pero no vuelve vectorial el PDF. La incorporación de `svg2pdf.js` queda como spike opcional y no debe mergearse sin paridad estricta.

---

### Rama 3 — `feat/alineacion-textos`

**Objetivo:** agregar alineación configurable para título, subtítulo, ubicación y fecha.

**Modelo de opciones:**

```js
titleAlign: 'auto',      // auto | left | center | right
subtitleAlign: 'auto',
locationAlign: 'auto',
dateAlign: 'auto',
```

**Comportamiento:**

- `auto` conserva el diseño actual:
  - Clásico, Elegante y Botánico: título/subtítulo centrados; fecha/ubicación a la derecha.
  - Moderno: título/subtítulo a la izquierda; fecha/ubicación a la derecha.
- Si `locationAlign` y `dateAlign` coinciden, ubicación y fecha se dibujan en una sola línea.
- Si difieren, se dibujan en dos líneas.
- Si no hay ubicación, solo se dibuja la fecha.
- El cálculo de `signatureY` debe contemplar el alto adicional de dos líneas.

**Tareas:**

- [ ] Agregar los cuatro campos a `DEFAULT_OPTIONS`.
- [ ] Agregar `ALIGN_IDS` y normalización en `optionsSchema.js`.
- [ ] Crear `resolveTextAlign`, `getTextBounds` y `drawAlignedText` en `shared.js`.
- [ ] Crear `drawPlaceAndDate` para resolver una o dos líneas.
- [ ] Reemplazar `drawCenteredText` por el helper alineable en los cuatro estilos.
- [ ] Mantener líneas decorativas y diamantes en su posición actual.
- [ ] En Moderno, usar un área segura que no invada el logo.
- [ ] Crear el componente `AlignField` con botones Automático / Izquierda / Centro / Derecha.
- [ ] Agregar controles de título y subtítulo en `ContentSettings.jsx`.
- [ ] Agregar controles de ubicación y fecha en `DateSignatureSettings.jsx`.
- [ ] Actualizar README y documentación de estilos.
- [ ] Agregar tests de esquema, anclas, render y dos líneas.
- [ ] Verificar que las configuraciones antiguas usen `auto` sin migración manual.

**Archivos principales:**

- `src/certificates/defaults.js`
- `src/utils/optionsSchema.js`
- `src/certificates/shared.js`
- `src/certificates/styles/classic.js`
- `src/certificates/styles/elegant.js`
- `src/certificates/styles/botanical.js`
- `src/certificates/styles/modern.js`
- `src/features/settings/SettingsPanel/sections/ContentSettings.jsx`
- `src/features/settings/SettingsPanel/sections/DateSignatureSettings.jsx`
- Nuevo: `src/features/settings/components/AlignField.jsx`
- `src/utils/optionsSchema.test.js`
- `src/certificates/shared.test.js`

**Depende de:** Rama 1 para regresión visual.

**Estimación:** 2–3 días.

---

### Rama 4 — `perf/importacion-planillas`

**Objetivo:** evitar que la importación de planillas bloquee la interfaz.

**Tareas:**

- [ ] Crear un Web Worker para `readWorkbook` y `parseSheet`.
- [ ] Transferir el `ArrayBuffer` al worker y devolver solo registros y columnas.
- [ ] Permitir cancelar o terminar el worker al cambiar de archivo.
- [ ] Evaluar `XLSX.read` con `dense: true` y `cellDates: true`.
- [ ] Evaluar `sheet_to_json` con `raw: true` y encabezados con `header: 1`.
- [ ] Mantener la normalización de fechas y documentos existente.
- [ ] Medir tiempo de importación, long tasks y memoria pico antes/después.
- [ ] Agregar pruebas con archivos de 1.000, 10.000 y 50.000 filas.
- [ ] Mantener la compatibilidad con CSV UTF-8, UTF-16 y Windows-1252.
- [ ] Documentar límites y advertencias para archivos muy grandes.

**Archivos principales:**

- `src/features/import/hooks/useWorkbook.js`
- `src/utils/excelParser.js`
- Nuevo worker en `src/features/import/workers/`
- `src/utils/excelParser.test.js`

**Depende de:** nada.

**Criterios de aceptación:**

- [ ] La interfaz responde durante toda la importación.
- [ ] No hay long tasks mayores a 200 ms atribuibles al parseo.
- [ ] El tiempo total no empeora más de 10 % respecto de la línea base.
- [ ] Los formatos y columnas soportados siguen funcionando.

**Estimación:** 2–3 días.

---

### Rama 5 — `perf/preview-persistencia`

**Objetivo:** reducir renders y escrituras innecesarias.

**Tareas:**

- [ ] Aplicar debounce de 400–500 ms al guardado de opciones.
- [ ] Guardar al ocultar la pestaña, al desmontar y al perder foco.
- [ ] Evitar escrituras en cada tick de sliders y campos de texto.
- [ ] Aplicar debounce de 300 ms a la vista previa.
- [ ] Implementar una sola ejecución de preview a la vez.
- [ ] Descartar resultados viejos y liberar blobs.
- [ ] Pasar `AbortSignal` a `buildPreviewUrl`, `prepare` y `drawCertificate`.
- [ ] No regenerar la vista previa cuando solo cambian opciones no visuales.
- [ ] Usar `useDeferredValue` en la búsqueda de la tabla.
- [ ] Medir latencia de preview y cantidad de renders descartados.

**Archivos principales:**

- `src/features/settings/hooks/useSettings.js`
- `src/utils/optionsStorage.js`
- `src/features/certificates/components/CertificatePreview.jsx`
- `src/utils/pdfGenerator.js`
- `src/features/records/components/DataTable.jsx`

**Depende de:** Rama 4 (opcional, para pruebas combinadas).

**Criterios de aceptación:**

- [ ] Arrastrar un slider no genera una escritura por evento.
- [ ] No se ejecutan dos previews superpuestas.
- [ ] La última opción elegida siempre gana.
- [ ] No se pierden cambios al cerrar o cambiar de pestaña.

**Estimación:** 1–2 días.

---

### Rama 6 — `perf/recursos-imagenes`

**Objetivo:** optimizar decodificación, rasterizado, cachés y miniaturas.

**Tareas:**

- [ ] Evaluar `createImageBitmap` y `OffscreenCanvas` para reducir bloqueos.
- [ ] Calcular el tamaño de rasterizado según el DPI final.
- [ ] Usar PNG para líneas finas y JPEG para fotografías.
- [ ] Acotar `ASSET_CACHE` y `COLORIZED_CACHE` con política LRU.
- [ ] Liberar canvas e imágenes cuando corresponda.
- [ ] Agregar miniaturas o `loading="lazy"`/`decoding="async"` en la galería.
- [ ] Evaluar guardar blobs en IndexedDB en lugar de data URLs base64.
- [ ] Medir memoria y tiempo de carga con imágenes de 5–20 MP.
- [ ] Evaluar subconjuntos TTF para reducir el PDF y la PWA.

**Archivos principales:**

- `src/utils/imageAsset.js`
- `src/certificates/shared.js`
- `src/utils/backgroundLoader.js`
- `src/features/settings/components/BackgroundPicker.jsx`
- `src/utils/optionsStorage.js`

**Depende de:** Ramas 2 y 5.

**Criterios de aceptación:**

- [ ] La carga de imágenes no bloquea la interfaz de forma perceptible.
- [ ] La memoria no crece sin límite durante una sesión larga.
- [ ] La calidad visual se mantiene.
- [ ] El tamaño de los assets y de la PWA no empeora sin justificación.

**Estimación:** 2–3 días.

---

### Rama 7 — `perf/exportacion-lote`

**Objetivo:** reducir el consumo de memoria al exportar muchos certificados.

**Tareas:**

- [ ] Evaluar ZIP en streaming con `fflate` o una alternativa equivalente.
- [ ] O generar por lotes con liberación explícita de PDFs.
- [ ] Agregar progreso y cancelación.
- [ ] Definir límites y advertencias para lotes masivos.
- [ ] Medir memoria y tiempo con 100, 1.000 y 10.000 certificados.
- [ ] Comparar tamaño de ZIP y compatibilidad con Windows/macOS.

**Archivos principales:**

- `src/utils/pdfGenerator.js`
- `src/features/certificates/hooks/useCertificateGeneration.js`
- `package.json`

**Depende de:** Rama 5.

**Criterios de aceptación:**

- [ ] La generación por lotes no agota la memoria en los escenarios medidos.
- [ ] El ZIP resultante es válido y legible.
- [ ] La cancelación funciona y libera recursos.
- [ ] El progreso refleja el avance real.

**Estimación:** 1–2 días.

---

### Rama 8 — `chore/limpieza-docs`

**Objetivo:** cerrar el trabajo y dejar el repositorio coherente.

**Tareas:**

- [x] Confirmar el destino de `src/assets/escudo.png` y `public/templates/certificado-ejemplo.svg`: eliminarlos por aprobación del usuario.
- [ ] Eliminar assets sin uso si se aprueba.
- [ ] Actualizar `README.md`.
- [ ] Actualizar `src/certificates/README.md`.
- [ ] Documentar el pipeline de assets y las decisiones de SVG.
- [ ] Documentar las nuevas opciones de alineación.
- [ ] Revisar que la PWA siga cacheando todo lo necesario.
- [ ] Verificar instalador de Electron si corresponde.

**Archivos principales:**

- `README.md`
- `src/certificates/README.md`
- `src/assets/`
- `public/templates/`

**Depende de:** Ramas 2, 3, 4, 5, 6 y 7.

**Estimación:** 0,5–1 día.

---

## 6. Orden de ejecución

```text
1. test/paridad-visual
        │
        ├── 2. assets/vectores-svg
        │
        └── 3. feat/alineacion-textos
                    │
4. perf/importacion-planillas
        │
5. perf/preview-persistencia
        │
6. perf/recursos-imagenes
        │
7. perf/exportacion-lote
        │
8. chore/limpieza-docs
```

Las ramas 2 y 3 pueden trabajarse en paralelo porque tocan archivos distintos. Las ramas 4 y 5 también pueden avanzar en paralelo con coordinación sobre `pdfGenerator.js`.

### Zonas de conflicto a vigilar

| Zona | Ramas que la tocan |
|---|---|
| `src/certificates/shared.js` | 3 |
| `src/certificates/styles/*` | 3 |
| `src/utils/backgroundLoader.js` | 2, 6 |
| `src/utils/pdfGenerator.js` | 5, 7 |
| `src/features/settings/**` | 3, 5, 6 |
| `package.json` | 1, 4, 7 |

---

## 7. Métricas de línea base

Medir antes de implementar y repetir después de cada rama relevante.

### Importación

- Tiempo total de importación.
- Cantidad de long tasks mayores a 200 ms.
- Memoria pico.
- Cantidad de filas procesadas.
- Respuesta de la interfaz durante la importación.

### Vista previa y persistencia

- Tiempo hasta la primera vista previa.
- Tiempo por cambio de opción.
- Renders de preview descartados.
- Escrituras en `localStorage` por minuto de edición.

### Generación

- Tiempo por certificado.
- Tiempo total para 100, 1.000 y 10.000 certificados.
- Memoria pico durante ZIP.
- Tamaño de PDF individual, PDF combinado y ZIP.

### Assets

- Peso de cada asset.
- Tiempo de carga y rasterizado.
- Diferencia visual PNG vs SVG.
- Diferencia visual de PDFs antes/después.
- Peso total de la PWA.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El trazado automático altera el diseño | Buscar el vector original; usar paridad visual estricta; conservar los originales hasta aprobar. |
| `svg2pdf.js` no soporta filtros, gradientes o `<use>` | No adoptarlo sin spike y pruebas; mantener rasterizado controlado. |
| Dos líneas de fecha/ubicación chocan con las firmas | Calcular `signatureY` con el alto adicional y probar textos largos. |
| El debounce pierde el último cambio | Flush en `pagehide`, `visibilitychange` y desmontaje. |
| El worker duplica el bundle de XLSX | Carga diferida y verificación del tamaño de chunks y precache PWA. |
| Guardar blobs en IndexedDB rompe configuraciones viejas | Migración versionada y fallback a data URLs. |
| `origin/main` está desactualizada | Trabajar desde `master` y decidir aparte la actualización de la rama principal. |
| Los cambios de rendimiento alteran el PDF | Comparación visual y de tamaño en cada rama. |

---

## 9. Checklist de inicio

- [ ] Confirmar las decisiones pendientes de la sección 3.
- [ ] Verificar que `master` esté actualizado y el árbol limpio.
- [ ] Crear `test/paridad-visual`.
- [ ] Registrar la línea base de métricas.
- [ ] Generar los fixtures de planillas e imágenes.
- [ ] Abrir el primer PR con el arnés de paridad visual.
- [ ] Recién después iniciar las ramas de assets, alineación y rendimiento.

---

## 10. Referencias de código

- `src/features/import/hooks/useWorkbook.js`
- `src/utils/excelParser.js`
- `src/features/settings/hooks/useSettings.js`
- `src/utils/optionsStorage.js`
- `src/features/certificates/components/CertificatePreview.jsx`
- `src/utils/pdfGenerator.js`
- `src/certificates/shared.js`
- `src/certificates/styles/*.js`
- `src/utils/backgroundLoader.js`
- `src/utils/backgroundColors.js`
- `src/utils/imageAsset.js`
- `src/utils/logo.js`
- `src/certificates/defaults.js`
- `src/utils/optionsSchema.js`
- `src/features/settings/SettingsPanel/sections/ContentSettings.jsx`
- `src/features/settings/SettingsPanel/sections/DateSignatureSettings.jsx`
- `public/backgrounds/rojo-floral.png`
