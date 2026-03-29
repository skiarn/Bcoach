import { fetchFile } from '@ffmpeg/util'
import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { getFfmpeg, toSafeFileStem } from './ffmpegClient.ts'
import { normalizeEmbeddedAnalysisMetadata } from './analysisMetadata.ts'

export interface ExtractedVideoMetadata {
  metadata: EmbeddedAnalysisMetadata
}

function fileDataToUint8Array(fileData: unknown): Uint8Array {
  if (fileData instanceof Uint8Array) {
    return fileData
  }

  if (typeof fileData === 'string') {
    return new TextEncoder().encode(fileData)
  }

  if (fileData instanceof ArrayBuffer) {
    return new Uint8Array(fileData)
  }

  if (ArrayBuffer.isView(fileData)) {
    return new Uint8Array(fileData.buffer, fileData.byteOffset, fileData.byteLength)
  }

  return new Uint8Array()
}

function isValidMetadata(value: unknown): value is EmbeddedAnalysisMetadata {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<EmbeddedAnalysisMetadata>
  return (
    (candidate.schemaVersion === 1 || candidate.schemaVersion === 2) &&
    Array.isArray(candidate.feedback) &&
    Array.isArray(candidate.nextSteps) &&
    Array.isArray(candidate.shapes)
  )
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function decodeBase64(value: string): string {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new TextDecoder().decode(bytes)
}

function getExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return '.webm'
  }

  return fileName.slice(lastDotIndex)
}

export async function appendMetadataToVideo(
  videoBlob: Blob,
  metadata: EmbeddedAnalysisMetadata,
  fileName: string
): Promise<Blob> {
  console.log('[Metadata] Getting FFmpeg instance...')
  const ffmpeg = await getFfmpeg()

  const extension = getExtension(fileName)
  const stem = toSafeFileStem(fileName)
  const inputName = `${stem}-input${extension}`
  const outputName = `${stem}-output${extension}`
  const encodedMetadata = encodeBase64(JSON.stringify(metadata))

  console.log('[Metadata] Writing input file:', inputName, videoBlob.size, 'bytes')
  await ffmpeg.writeFile(inputName, await fetchFile(videoBlob))
  console.log('[Metadata] Input file written')

  console.log('[Metadata] Running ffmpeg exec...')
  const startTime = Date.now()

  try {
    await ffmpeg.exec([
      '-i',
      inputName,
      '-map',
      '0',
      '-c',
      'copy',
      '-metadata',
      `comment=bcoach:${encodedMetadata}`,
      '-movflags',
      'use_metadata_tags',
      outputName,
    ])

    const elapsed = Date.now() - startTime
    console.log('[Metadata] FFmpeg exec completed in', elapsed, 'ms')
  } catch (error) {
    console.error('[Metadata] FFmpeg exec failed:', error)
    throw error
  }

  console.log('[Metadata] Reading output file...')
  const outputData = fileDataToUint8Array(await ffmpeg.readFile(outputName))
  console.log('[Metadata] Output file read:', outputData.length, 'bytes')

  console.log('[Metadata] Cleaning up temp files...')
  await Promise.all([
    ffmpeg.deleteFile(inputName).catch(() => {}),
    ffmpeg.deleteFile(outputName).catch(() => {}),
  ])
  console.log('[Metadata] Cleanup done')

  return new Blob([outputData], { type: videoBlob.type || 'video/webm' })
}

export async function extractMetadataFromVideo(
  videoBlob: Blob,
  fileName: string
): Promise<ExtractedVideoMetadata | null> {
  const ffmpeg = await getFfmpeg()
  const extension = getExtension(fileName)
  const stem = toSafeFileStem(fileName)
  const inputName = `${stem}-probe${extension}`
  const metadataName = `${stem}-metadata.txt`

  await ffmpeg.writeFile(inputName, await fetchFile(videoBlob))

  try {
    await ffmpeg.exec(['-i', inputName, '-f', 'ffmetadata', metadataName])
  } catch {
    await Promise.all([
      ffmpeg.deleteFile(inputName).catch(() => {}),
      ffmpeg.deleteFile(metadataName).catch(() => {}),
    ])

    return null
  }

  const metadataData = fileDataToUint8Array(await ffmpeg.readFile(metadataName))
  const metadataText = new TextDecoder().decode(metadataData)

  await Promise.all([
    ffmpeg.deleteFile(inputName).catch(() => {}),
    ffmpeg.deleteFile(metadataName).catch(() => {}),
  ])

  const commentLine = metadataText
    .split('\n')
    .find((line) => line.toLowerCase().startsWith('comment='))

  if (!commentLine) {
    return null
  }

  const value = commentLine.slice(commentLine.indexOf('=') + 1)
  if (!value.startsWith('bcoach:')) {
    return null
  }

  const metadataJson = decodeBase64(value.slice('bcoach:'.length))

  let parsed: unknown
  try {
    parsed = JSON.parse(metadataJson)
  } catch {
    return null
  }

  if (!isValidMetadata(parsed)) {
    return null
  }

  const normalized = normalizeEmbeddedAnalysisMetadata(parsed)
  if (!normalized) {
    return null
  }

  return {
    metadata: normalized,
  }
}

export function buildAnalyzedVideoFileName(baseName: string): string {
  const trimmed = baseName.trim()
  const fallback = 'analysis.webm'

  if (!trimmed) {
    return fallback
  }

  const lastDotIndex = trimmed.lastIndexOf('.')
  const hasExtension = lastDotIndex > 0 && lastDotIndex < trimmed.length - 1

  if (!hasExtension) {
    return `${trimmed}-analysis.webm`
  }

  const name = trimmed.slice(0, lastDotIndex)
  const extension = trimmed.slice(lastDotIndex)
  return `${name}-analysis${extension}`
}
