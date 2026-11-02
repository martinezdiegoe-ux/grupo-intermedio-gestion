export type PhotoSize = { width: number; height: number }
export type PhotoPosition = { x: number; y: number }

export const clampPosition = (value: number) => Math.max(-100, Math.min(100, value))

// Work in original-image pixels so the preview and saved photo share one crop.
export function getPhotoCrop(size: PhotoSize, zoom: number, position: PhotoPosition) {
  const side = Math.min(size.width, size.height) / Math.max(1, Math.min(3, zoom))
  return {
    x: (size.width - side) * (clampPosition(position.x) + 100) / 200,
    y: (size.height - side) * (clampPosition(position.y) + 100) / 200,
    side,
  }
}

export async function cropPhoto(image: HTMLImageElement, zoom: number, position: PhotoPosition): Promise<File> {
  const crop = getPhotoCrop({ width: image.naturalWidth, height: image.naturalHeight }, zoom, position)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo preparar la foto. Probá con otra imagen.')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, 512, 512)
  context.drawImage(image, crop.x, crop.y, crop.side, crop.side, 0, 0, 512, 512)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error('No se pudo recortar la foto.')), 'image/jpeg', 0.9)
  })
  return new File([blob], 'foto-perfil.jpg', { type: 'image/jpeg' })
}
