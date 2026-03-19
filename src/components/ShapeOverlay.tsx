import { useEffect, useRef } from 'react'

interface TimedShape {
  id?: string
  type: 'line' | 'circle'
  startX: number
  startY: number
  endX: number
  endY: number
  sourceWidth?: number
  sourceHeight?: number
  visibleFrom?: number
  visibleTo?: number
}

interface ShapeOverlayProps {
  width: number
  height: number
  shapes: TimedShape[]
  currentTime: number
}

function isShapeVisibleAtTime(shape: TimedShape, time: number): boolean {
  if (shape.visibleFrom === undefined || shape.visibleTo === undefined) {
    return true
  }

  return time >= shape.visibleFrom && time <= shape.visibleTo
}

function getScaledShape(shape: TimedShape, width: number, height: number): TimedShape {
  if (!shape.sourceWidth || !shape.sourceHeight) {
    return shape
  }

  const scaleX = width / shape.sourceWidth
  const scaleY = height / shape.sourceHeight

  return {
    ...shape,
    startX: shape.startX * scaleX,
    startY: shape.startY * scaleY,
    endX: shape.endX * scaleX,
    endY: shape.endY * scaleY,
  }
}

function ShapeOverlay({ width, height, shapes, currentTime }: ShapeOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    shapes
      .filter((shape) => isShapeVisibleAtTime(shape, currentTime))
      .map((shape) => getScaledShape(shape, width, height))
      .forEach((shape) => {
        ctx.beginPath()
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 2

        if (shape.type === 'line') {
          ctx.moveTo(shape.startX, shape.startY)
          ctx.lineTo(shape.endX, shape.endY)
        }

        if (shape.type === 'circle') {
          const radius = Math.sqrt(
            Math.pow(shape.endX - shape.startX, 2) +
            Math.pow(shape.endY - shape.startY, 2)
          )
          ctx.arc(shape.startX, shape.startY, radius, 0, Math.PI * 2)
        }

        ctx.stroke()
      })
  }, [width, height, shapes, currentTime])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        backgroundColor: 'transparent',
        pointerEvents: 'none',
        border: 'none'
      }}
    />
  )
}

export default ShapeOverlay
