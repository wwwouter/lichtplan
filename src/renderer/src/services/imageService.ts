import { FloorPlanImage } from '../types/project'

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

export async function loadFloorPlanImage(
  data: string,
  fileName: string
): Promise<FloorPlanImage> {
  const { width, height } = await getImageDimensions(data)
  return { data, width, height, fileName }
}
