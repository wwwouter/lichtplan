import { Image } from 'react-konva'
import useImage from 'use-image'
import { FloorPlanImage as FloorPlanImageType } from '../types/project'

interface Props {
  image: FloorPlanImageType
}

export function FloorPlanImageLayer({ image }: Props) {
  const [img] = useImage(image.data)

  if (!img) return null

  return <Image image={img} width={image.width} height={image.height} listening={false} />
}
