import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyGrayscaleToImageData,
  getFloorPlanDownloadFileName
} from '../services/imageService'
import { useProjectStore } from '../stores/useProjectStore'

describe('floor plan image grayscale', () => {
  beforeEach(() => {
    useProjectStore.getState().newProject()
  })

  it('stores the grayscale setting on the active floor image', () => {
    const floorId = useProjectStore.getState().activeFloorId

    useProjectStore.getState().setFloorImage(floorId, {
      data: 'data:image/png;base64,image-data',
      width: 100,
      height: 80,
      fileName: 'plattegrond.png',
      grayscale: false
    })

    useProjectStore.getState().setFloorImageGrayscale(floorId, true)

    const floor = useProjectStore.getState().project.floors.find((item) => item.id === floorId)!
    expect(floor.floorPlanImage?.grayscale).toBe(true)
  })

  it('does not create history when no floor image exists', () => {
    const floorId = useProjectStore.getState().activeFloorId

    useProjectStore.getState().setFloorImageGrayscale(floorId, true)

    expect(useProjectStore.getState().isDirty).toBe(false)
    expect(useProjectStore.getState().canUndo).toBe(false)
  })

  it('restores the previous grayscale setting with undo', () => {
    const floorId = useProjectStore.getState().activeFloorId

    useProjectStore.getState().setFloorImage(floorId, {
      data: 'data:image/png;base64,image-data',
      width: 100,
      height: 80,
      fileName: 'plattegrond.png',
      grayscale: false
    })
    useProjectStore.getState().setFloorImageGrayscale(floorId, true)

    useProjectStore.getState().undo()

    const floor = useProjectStore.getState().project.floors.find((item) => item.id === floorId)!
    expect(floor.floorPlanImage?.grayscale).toBe(false)
  })

  it('uses a clear PNG file name for downloading the floor plan image', () => {
    expect(
      getFloorPlanDownloadFileName({
        data: 'data:image/jpeg;base64,image-data',
        width: 100,
        height: 80,
        fileName: 'woning.jpg',
        grayscale: false
      })
    ).toBe('woning.png')

    expect(
      getFloorPlanDownloadFileName({
        data: 'data:image/jpeg;base64,image-data',
        width: 100,
        height: 80,
        fileName: 'woning.jpg',
        grayscale: true
      })
    ).toBe('woning-grijs.png')
  })

  it('converts image pixels to grayscale while preserving alpha', () => {
    const imageData = {
      data: new Uint8ClampedArray([100, 150, 200, 128]),
      width: 1,
      height: 1,
      colorSpace: 'srgb'
    } as ImageData

    applyGrayscaleToImageData(imageData)

    expect(Array.from(imageData.data)).toEqual([141, 141, 141, 128])
  })
})
