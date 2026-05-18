import { useEffect, useRef } from 'react'
import { Image } from 'react-konva'
import Konva from 'konva'
import useImage from 'use-image'
import { FloorPlanImage as FloorPlanImageType } from '../types/project'

interface Props {
  image: FloorPlanImageType
}

export function FloorPlanImageLayer({ image }: Props) {
  const imageRef = useRef<Konva.Image>(null)
  const [img] = useImage(image.data)

  useEffect(() => {
    const node = imageRef.current
    if (!node || !img) return

    if (image.grayscale) {
      node.cache()
      node.filters([Konva.Filters.Grayscale])
    } else {
      node.filters([])
      node.clearCache()
    }

    node.getLayer()?.batchDraw()
  }, [img, image.grayscale])

  if (!img) return null

  return (
    <Image
      ref={imageRef}
      image={img}
      width={image.width}
      height={image.height}
      listening={false}
    />
  )
}
