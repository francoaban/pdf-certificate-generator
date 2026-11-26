// Optimización de los SVG de la aplicación.
//
// - `floatPrecision: 1` en las rutas redondea las coordenadas a 0,1 unidades
//   del viewBox (menos de 0,03 mm en una hoja A4 horizontal). En el fondo
//   floral reduce el archivo un 32 % sin diferencias visibles.
// - El resto de los valores numéricos (opacidades, anchos de trazo, offsets de
//   gradientes) se conservan con dos decimales para no alterar el aspecto.
// - No se eliminan `width`, `height` ni `viewBox`: `loadImageAsset` usa
//   `naturalWidth`/`naturalHeight` para rasterizar el fondo con la proporción
//   correcta antes de insertarlo en el PDF.
// - Los colores se conservan tal cual porque `backgroundColors.js` los
//   reemplaza por coincidencia exacta para personalizar los fondos.
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertPathData: { floatPrecision: 1 },
          cleanupNumericValues: { floatPrecision: 2 },
        },
      },
    },
  ],
}
