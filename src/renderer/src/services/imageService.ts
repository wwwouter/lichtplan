import { FloorPlanImage } from '../types/project'

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return loadImageElement(dataUrl).then((img) => ({
    width: img.naturalWidth,
    height: img.naturalHeight
  }))
}

export async function loadFloorPlanImage(
  data: string,
  fileName: string
): Promise<FloorPlanImage> {
  const { width, height } = await getImageDimensions(data)
  return { data, width, height, fileName, grayscale: false }
}

export async function createFloorPlanDownloadDataUrl(image: FloorPlanImage): Promise<string> {
  const img = await loadImageElement(image.data)
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Kan plattegrond niet renderen voor download.')
  }

  context.drawImage(img, 0, 0, image.width, image.height)

  if (image.grayscale) {
    const imageData = context.getImageData(0, 0, image.width, image.height)
    applyGrayscaleToImageData(imageData)
    context.putImageData(imageData, 0, 0)
  }

  return canvas.toDataURL('image/png')
}

export function applyGrayscaleToImageData(imageData: ImageData): ImageData {
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
    data[i] = value
    data[i + 1] = value
    data[i + 2] = value
  }

  return imageData
}

export function getFloorPlanDownloadFileName(image: FloorPlanImage): string {
  const baseName = image.fileName.replace(/\.[^/.]+$/, '') || 'plattegrond'
  return `${baseName}${image.grayscale ? '-grijs' : ''}.png`
}
