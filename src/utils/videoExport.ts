import { Shape } from '../types/analysis.ts'

const RENDER_FRAME_RATE = 30

function isShapeVisibleAtTime(shape: Shape, time: number): boolean {
  if (shape.visibleFrom === undefined || shape.visibleTo === undefined) {
    return true
  }

  return time >= shape.visibleFrom && time <= shape.visibleTo
}

function scaleShape(shape: Shape, width: number, height: number): Shape {
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

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
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
}

function getSupportedOutputMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || 'video/webm'
}

async function createPreparedVideoElement(videoBlob: Blob): Promise<HTMLVideoElement> {
  const url = URL.createObjectURL(videoBlob)
  const video = document.createElement('video')
  video.src = url
  video.muted = false
  video.playsInline = true
  video.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      reject(new Error('Kunde inte läsa videons metadata för export.'))
    }

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('error', onError)
    }

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('error', onError)
  })

  return video
}

export async function burnOverlayShapesIntoVideo(videoBlob: Blob, shapes: Shape[]): Promise<Blob> {
  const video = await createPreparedVideoElement(videoBlob)

  try {
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Kunde inte starta canvas-rendering för export.')
    }

    const canvasStream = canvas.captureStream(RENDER_FRAME_RATE)
    const elementStream = video.captureStream()
    const composedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...elementStream.getAudioTracks(),
    ])

    const outputMimeType = getSupportedOutputMimeType()
    const recorder = new MediaRecorder(composedStream, { mimeType: outputMimeType })
    const chunks: Blob[] = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    const completed = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: recorder.mimeType || outputMimeType }))
      }

      recorder.onerror = () => {
        reject(new Error('Kunde inte spela in den exporterade videon.'))
      }
    })

    await video.play()
    recorder.start(200)

    await new Promise<void>((resolve, reject) => {
      let rafId = 0

      const renderFrame = () => {
        if (video.ended || video.paused) {
          resolve()
          return
        }

        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(video, 0, 0, width, height)

        shapes
          .filter((shape) => isShapeVisibleAtTime(shape, video.currentTime))
          .map((shape) => scaleShape(shape, width, height))
          .forEach((shape) => drawShape(ctx, shape))

        rafId = window.requestAnimationFrame(renderFrame)
      }

      const handleEnded = () => {
        window.cancelAnimationFrame(rafId)
        resolve()
      }

      const handleError = () => {
        window.cancelAnimationFrame(rafId)
        reject(new Error('Videoexporten avbröts på grund av ett uppspelningsfel.'))
      }

      video.addEventListener('ended', handleEnded, { once: true })
      video.addEventListener('error', handleError, { once: true })

      rafId = window.requestAnimationFrame(renderFrame)
    })

    if (recorder.state !== 'inactive') {
      recorder.stop()
    }

    return completed
  } finally {
    URL.revokeObjectURL(video.src)
  }
}