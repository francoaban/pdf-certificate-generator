const DEFAULT_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    image.src = url
  })
}

/**
 * Procesa un archivo de imagen y devuelve un asset listo para guardar en
 * IndexedDB: { dataUrl, ratio, name, width, height }.
 *
 * Es la misma ruta para logos y fondos; cada llamada ajusta límites, formato y
 * si se aplana la transparencia sobre blanco.
 */
export async function processImageFile(
  file,
  {
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    maxBytes = 5 * 1024 * 1024,
    maxPixels = 24_000_000,
    maxWidth = 2400,
    maxHeight = 1600,
    mime = 'image/jpeg',
    quality = 0.9,
    fill = mime === 'image/jpeg' ? '#ffffff' : null,
    maxDataUrlLength = Infinity,
    nameMaxLength = 200,
    label = 'La imagen',
  } = {},
) {
  if (!file) throw new Error('No se seleccionó ninguna imagen.')
  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Formato no admitido. Usá PNG, JPG o WebP.')
  }
  if (file.size > maxBytes) {
    throw new Error(`${label} supera los 5 MB.`)
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const width = image.naturalWidth
    const height = image.naturalHeight
    if (!width || !height) throw new Error('La imagen no tiene dimensiones válidas.')
    if (width * height > maxPixels) {
      throw new Error(`${label} tiene demasiados píxeles. Reducila antes de cargarla.`)
    }

    const scale = Math.min(1, maxWidth / width, maxHeight / height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))

    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo procesar la imagen.')
    if (fill) {
      context.fillStyle = fill
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL(mime, quality)
    canvas.width = 0
    canvas.height = 0

    if (dataUrl.length > maxDataUrlLength) {
      throw new Error(
        `${label} es demasiado pesada después de procesarla. Probá con una imagen más simple.`,
      )
    }

    return {
      dataUrl,
      ratio: width / height,
      name: file.name.slice(0, nameMaxLength),
      width,
      height,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
