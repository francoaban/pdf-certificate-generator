import { DEFAULT_NAME_FONT } from './fonts.js'

export const FONT_SIZE_MIN = 80
export const FONT_SIZE_MAX = 150
export const FONT_SIZE_STEP = 5
export const FONT_SIZE_DEFAULT = 100

/**
 * Opciones por defecto para la generación de certificados.
 * Las cuatro variantes (clásico, moderno, elegante y botánico) comparten
 * esta configuración; el estilo se elige con `style`.
 */
export function getCurrentDate() {
  return new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const DEFAULT_OPTIONS = {
  title: 'CERTIFICADO',
  subtitle: 'DE RECONOCIMIENTO',
  preText: 'Se otorga el presente certificado a',
  bodyText: 'Por su destacada participación y compromiso, otorgándose el presente en reconocimiento a su dedicación y esfuerzo.',
  titleFont: 'auto', // auto conserva la fuente del estilo
  subtitleFont: 'auto',
  bodyFont: 'auto',
  // Porcentaje de tamaño de cada texto; 100 = tamaño original del estilo.
  titleSize: FONT_SIZE_DEFAULT,
  subtitleSize: FONT_SIZE_DEFAULT,
  preTextSize: FONT_SIZE_DEFAULT,
  nameSize: FONT_SIZE_DEFAULT,
  bodySize: FONT_SIZE_DEFAULT,
  dateSize: FONT_SIZE_DEFAULT,
  signatureSize: FONT_SIZE_DEFAULT,
  documentSize: FONT_SIZE_DEFAULT,
  signatureLeft: 'Director/a',
  signatureRight: 'Coordinador/a',
  date: '',
  useLogo: true,
  customLogo: null,
  backgroundFromLogo: false, // marca de agua con el logo personalizado
  signatureLeftImage: null,
  signatureRightImage: null,
  caseMode: 'asis', // asis | upper | title
  nameFont: DEFAULT_NAME_FONT, // auto | great-vibes | parisienne | pinyon-script | sacramento | serif | sans
  showDocument: true, // mostrar el documento en el certificado
  docDots: true, // 12.345.678 vs 12345678
  defaultDocType: 'auto', // auto o un id de DOC_TYPES
  fileNameFormat: 'nombre-apellido',
  city: 'San Salvador de Jujuy',
  showCity: true,
  province: 'Jujuy',
  showProvince: false,
  country: 'Argentina',
  showCountry: false,
  imageBackground: null, // asset {dataUrl, ratio, name} o URL/data URL para integraciones
  showImageBackground: false, // si false, usa el fondo del estilo o `background` en lugar de la imagen personalizada

  // --- Diseño ---
  style: 'clasico', // clasico | moderno | elegante | botanico
  useBackground: true,
  background: null, // URL o data URL para reemplazar el fondo del estilo
  backgroundFit: 'cover', // cover (llenar y recortar) | contain (ajustar sin recortar)
  primaryColor: null, // color decorativo principal del fondo (hex) | null = paleta del fondo
  secondaryColor: null, // color decorativo secundario del fondo (hex) | null = paleta del fondo
  showVerificationQr: true,
}
