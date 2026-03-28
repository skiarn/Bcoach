import { FFmpeg } from '@ffmpeg/ffmpeg'

let ffmpegInstance: FFmpeg | null = null
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null

async function toRuntimeBlobUrl(assetPath: string, mimeType: string): Promise<string> {
  const response = await fetch(assetPath)
  if (!response.ok) {
    throw new Error(`Failed to fetch FFmpeg asset: ${assetPath}`)
  }

  const bytes = await response.arrayBuffer()
  const blob = new Blob([bytes], { type: mimeType })
  return URL.createObjectURL(blob)
}

async function loadFfmpegCore(ffmpeg: FFmpeg): Promise<void> {
  const basePath = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  const coreAssetUrl = `${basePath}ffmpeg/ffmpeg-core.js`
  const wasmAssetUrl = `${basePath}ffmpeg/ffmpeg-core.wasm`
  const coreURL = await toRuntimeBlobUrl(coreAssetUrl, 'text/javascript')
  const wasmURL = await toRuntimeBlobUrl(wasmAssetUrl, 'application/wasm')

  console.log('[FFmpeg] Loading core from assets:', coreAssetUrl, wasmAssetUrl)

  try {
    await ffmpeg.load({ coreURL, wasmURL })
    console.log('[FFmpeg] Core loaded successfully')
  } catch (error) {
    console.error('[FFmpeg] Failed to load core:', error)
    throw error
  }
}

export async function getFfmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    console.log('[FFmpeg] Returning cached instance')
    return ffmpegInstance
  }

  if (ffmpegLoadingPromise) {
    console.log('[FFmpeg] Waiting for ongoing load...')
    return ffmpegLoadingPromise
  }

  console.log('[FFmpeg] Creating new instance...')
  const ffmpeg = new FFmpeg()
  ffmpegLoadingPromise = loadFfmpegCore(ffmpeg)
    .then(() => {
      ffmpegInstance = ffmpeg
      console.log('[FFmpeg] Instance ready')
      return ffmpeg
    })
    .catch((error) => {
      console.error('[FFmpeg] Load failed:', error)
      throw error
    })
    .finally(() => {
      ffmpegLoadingPromise = null
    })

  return ffmpegLoadingPromise
}

export function toSafeFileStem(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'video'
}