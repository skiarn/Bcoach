import { fetchFile } from '@ffmpeg/util'
import { getFfmpeg, toSafeFileStem } from './ffmpegClient.ts'
import { VideoSegment } from '../types/editing.ts'

export type EditProgressCallback = (progress: number) => void

function fileDataToUint8Array(fileData: unknown): Uint8Array {
  if (fileData instanceof Uint8Array) return fileData
  if (typeof fileData === 'string') return new TextEncoder().encode(fileData)
  if (fileData instanceof ArrayBuffer) return new Uint8Array(fileData)
  if (ArrayBuffer.isView(fileData)) {
    const view = fileData as ArrayBufferView
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  }
  return new Uint8Array()
}

function buildAtempoChain(speed: number): string {
  if (speed <= 2.0) return `atempo=${speed}`
  const chain: string[] = []
  let remaining = speed
  while (remaining > 2.0 + 0.001) {
    chain.push('atempo=2.0')
    remaining = remaining / 2.0
  }
  chain.push(`atempo=${remaining.toFixed(4)}`)
  return chain.join(',')
}

interface EffectiveSegment {
  startTime: number
  endTime: number
  speed: number
}

function getEffectiveSegments(
  segments: VideoSegment[],
  duration: number
): EffectiveSegment[] {
  const sorted = [...segments].sort((a, b) => a.startTime - b.startTime)
  const result: EffectiveSegment[] = []
  let cursor = 0

  for (const seg of sorted) {
    const gapStart = cursor
    const gapEnd = Math.min(seg.startTime, duration)

    if (gapEnd - gapStart > 0.05) {
      result.push({ startTime: gapStart, endTime: gapEnd, speed: 1 })
    }

    if (seg.action !== 'remove') {
      const segStart = Math.max(seg.startTime, 0)
      const segEnd = Math.min(seg.endTime, duration)
      if (segEnd - segStart > 0.05) {
        result.push({
          startTime: segStart,
          endTime: segEnd,
          speed: seg.speedFactor ?? 1,
        })
      }
    }

    cursor = seg.endTime
  }

  const remaining = duration - cursor
  if (remaining > 0.05) {
    result.push({ startTime: cursor, endTime: duration, speed: 1 })
  }

  return result
}

function buildFilterComplex(segments: EffectiveSegment[], withAudio: boolean): string {
  const n = segments.length
  const parts: string[] = []
  const concatInputs: string[] = []

  parts.push(`[0:v]split=${n}${segments.map((_, i) => `[sv${i}]`).join('')}`)
  if (withAudio) {
    parts.push(`[0:a]asplit=${n}${segments.map((_, i) => `[sa${i}]`).join('')}`)
  }

  for (let i = 0; i < n; i++) {
    const seg = segments[i]
    const { startTime: s, endTime: e, speed } = seg
    const start = s.toFixed(6)
    const end = e.toFixed(6)

    if (speed === 1) {
      parts.push(`[sv${i}]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${i}]`)
      if (withAudio) {
        parts.push(`[sa${i}]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a${i}]`)
      }
    } else {
      parts.push(
        `[sv${i}]trim=start=${start}:end=${end},setpts=(PTS-STARTPTS)/${speed.toFixed(4)}[v${i}]`
      )
      if (withAudio) {
        const atempoChain = buildAtempoChain(speed)
        parts.push(
          `[sa${i}]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,${atempoChain}[a${i}]`
        )
      }
    }

    if (withAudio) {
      concatInputs.push(`[v${i}][a${i}]`)
    } else {
      concatInputs.push(`[v${i}]`)
    }
  }

  if (withAudio) {
    parts.push(`${concatInputs.join('')}concat=n=${n}:v=1:a=1[outv][outa]`)
  } else {
    parts.push(`${concatInputs.join('')}concat=n=${n}:v=1:a=0[outv]`)
  }

  return parts.join(';')
}

export async function applyVideoEdits(
  videoBlob: Blob,
  fileName: string,
  segments: VideoSegment[],
  duration: number,
  onProgress?: EditProgressCallback
): Promise<Blob> {
  const ffmpeg = await getFfmpeg()
  const stem = toSafeFileStem(fileName)
  const inputName = `${stem}-edit-in.mp4`
  const outputName = `${stem}-edit-out.mp4`

  onProgress?.(0.05)
  await ffmpeg.writeFile(inputName, await fetchFile(videoBlob))
  onProgress?.(0.1)

  const effective = getEffectiveSegments(segments, duration)

  if (effective.length === 0) {
    await ffmpeg.deleteFile(inputName).catch(() => {})
    throw new Error('No segments to keep after editing.')
  }

  const isUnchanged =
    effective.length === 1 &&
    effective[0].speed === 1 &&
    effective[0].startTime < 0.05 &&
    effective[0].endTime > duration - 0.05

  if (isUnchanged) {
    await ffmpeg.deleteFile(inputName).catch(() => {})
    return videoBlob
  }

  const progressListener = onProgress
    ? ({ progress }: { progress: number }) => {
        onProgress(0.1 + Math.min(0.85, progress) * 0.85)
      }
    : null

  if (progressListener) {
    ffmpeg.on('progress', progressListener)
  }

  let outputData: Uint8Array

  try {
    const withAudioArgs = buildExecArgs(inputName, outputName, effective, true)
    let execOk = false

    try {
      await ffmpeg.exec(withAudioArgs)
      execOk = true
    } catch {
      execOk = false
    }

    if (!execOk) {
      const videoOnlyArgs = buildExecArgs(inputName, outputName, effective, false)
      await ffmpeg.exec(videoOnlyArgs)
    }

    outputData = fileDataToUint8Array(await ffmpeg.readFile(outputName))
  } finally {
    if (progressListener) {
      ffmpeg.off('progress', progressListener)
    }
    await Promise.all([
      ffmpeg.deleteFile(inputName).catch(() => {}),
      ffmpeg.deleteFile(outputName).catch(() => {}),
    ])
  }

  onProgress?.(1.0)
  return new Blob([outputData.buffer as ArrayBuffer], { type: 'video/mp4' })
}

function buildExecArgs(
  inputName: string,
  outputName: string,
  effective: EffectiveSegment[],
  withAudio: boolean
): string[] {
  const filterComplex = buildFilterComplex(effective, withAudio)
  const args: string[] = ['-i', inputName, '-filter_complex', filterComplex, '-map', '[outv]']

  if (withAudio) {
    args.push('-map', '[outa]')
  }

  args.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-movflags', '+faststart'
  )

  if (withAudio) {
    args.push('-c:a', 'aac', '-b:a', '128k')
  }

  args.push(outputName)
  return args
}
