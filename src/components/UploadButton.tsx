import { useState, useRef, useEffect } from 'react'
import { fetchFile } from '@ffmpeg/util'
import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { extractMetadataFromVideo } from '../utils/videoMetadata.ts'
import { addImportedVideoFile } from '../services/videoLibrary.ts'
import { getFfmpeg } from '../utils/ffmpegClient.ts'
import { useI18n } from '../i18n/I18nProvider.tsx'
import * as Icons from './ui/Icons.tsx'

interface UploadButtonProps {
  onVideoSelect: (video: File | Blob, url: string, metadata?: EmbeddedAnalysisMetadata, libraryId?: string) => void
}

type CameraPhase = 'idle' | 'preview' | 'recording' | 'converting'

function UploadButton({ onVideoSelect }: UploadButtonProps): JSX.Element {
  const { t } = useI18n()
  const [cameraPhase, setCameraPhase] = useState<CameraPhase>('idle')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isLandscape, setIsLandscape] = useState(false)
  const [recordingDelay, setRecordingDelay] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Attach the live camera stream to the preview element when it mounts
  useEffect(() => {
    if ((cameraPhase === 'preview' || cameraPhase === 'recording') && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraPhase])

  const getSupportedMimeType = (): string | undefined => {
    const candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ]
    return candidates.find((type) => MediaRecorder.isTypeSupported(type))
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const openStream = async (facing: 'user' | 'environment', landscape: boolean): Promise<boolean> => {
    try {
      stopStream()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: landscape ? 1920 : 1080 },
          height: { ideal: landscape ? 1080 : 1920 },
        },
        audio: true,
      })
      streamRef.current = stream
      return true
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert(t('upload.cameraAccessError'))
      return false
    }
  }

  const handleOpenCamera = async () => {
    const ok = await openStream(facingMode, isLandscape)
    if (ok) setCameraPhase('preview')
  }

  const handleFlipCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    const ok = await openStream(newFacing, isLandscape)
    if (ok && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }

  const handleToggleOrientation = async () => {
    const newLandscape = !isLandscape
    setIsLandscape(newLandscape)
    const ok = await openStream(facingMode, newLandscape)
    if (ok && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }

  const convertToMp4 = async (inputBlob: Blob): Promise<Blob> => {
    // Already MP4 — no conversion needed
    if (inputBlob.type === 'video/mp4' || inputBlob.type.startsWith('video/mp4;')) {
      return inputBlob
    }

    const ffmpeg = await getFfmpeg()
    const ts = Date.now()
    const inputExt = inputBlob.type.includes('webm') ? '.webm' : '.bin'
    const inputName = `rec-in-${ts}${inputExt}`
    const outputName = `rec-out-${ts}.mp4`

    await ffmpeg.writeFile(inputName, await fetchFile(inputBlob))

    // Copy the video stream (VP8/VP9) unchanged, only re-encode audio → AAC.
    // This is near-instant compared to a full libx264 video encode.
    const exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      outputName,
    ])

    await Promise.all([
      ffmpeg.deleteFile(inputName).catch(() => {}),
    ])

    if (exitCode !== 0) {
      await ffmpeg.deleteFile(outputName).catch(() => {})
      throw new Error(`FFmpeg exited with code ${exitCode}`)
    }

    const data = await ffmpeg.readFile(outputName) as Uint8Array
    await ffmpeg.deleteFile(outputName).catch(() => {})
    return new Blob([data.slice()], { type: 'video/mp4' })
  }

  const beginRecording = () => {
    if (!streamRef.current) return

    const supportedMimeType = getSupportedMimeType()
    const mediaRecorder = supportedMimeType
      ? new MediaRecorder(streamRef.current, { mimeType: supportedMimeType })
      : new MediaRecorder(streamRef.current)

    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = () => {
      void (async () => {
        setCameraPhase('converting')
        stopStream()

        const blobType = mediaRecorder.mimeType || 'video/webm'
        const rawBlob = new Blob(chunksRef.current, { type: blobType })

        try {
          const mp4Blob = await convertToMp4(rawBlob)
          const fileName = `recording-${Date.now()}.mp4`
          const file = new File([mp4Blob], fileName, { type: 'video/mp4' })
          const libraryId = await addImportedVideoFile(file)
          const url = URL.createObjectURL(file)
          onVideoSelect(file, url, undefined, libraryId)
        } catch (error) {
          console.error('MP4 conversion failed, using original format:', error)
          const ext = blobType.includes('mp4') ? '.mp4' : '.webm'
          const fileName = `recording-${Date.now()}${ext}`
          const file = new File([rawBlob], fileName, { type: blobType })
          const libraryId = await addImportedVideoFile(file)
          const url = URL.createObjectURL(file)
          onVideoSelect(file, url, undefined, libraryId)
        } finally {
          setCameraPhase('idle')
        }
      })()
    }

    mediaRecorder.start()
    setCameraPhase('recording')
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && cameraPhase === 'recording') {
      mediaRecorderRef.current.stop()
      // Phase transitions to 'converting' inside the onstop handler
    }
  }

  const clearCountdown = () => {
    if (countdownTimerRef.current !== null) {
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdown(null)
  }

  const handleStartWithDelay = () => {
    if (recordingDelay === 0) {
      beginRecording()
      return
    }
    setCountdown(recordingDelay)
    let remaining = recordingDelay
    const tick = () => {
      remaining -= 1
      if (remaining <= 0) {
        setCountdown(null)
        beginRecording()
      } else {
        setCountdown(remaining)
        countdownTimerRef.current = setTimeout(tick, 1000)
      }
    }
    countdownTimerRef.current = setTimeout(tick, 1000)
  }

  const cancelCamera = () => {
    clearCountdown()
    stopStream()
    setCameraPhase('idle')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    // If multiple files selected, import all to library
    if (files.length > 1) {
      void (async () => {
        for (const file of files) {
          if (!file.type.startsWith('video/')) continue

          try {
            let extractedMetadata: EmbeddedAnalysisMetadata | undefined

            try {
              const extracted = await extractMetadataFromVideo(file, file.name)
              extractedMetadata = extracted?.metadata
            } catch {
              extractedMetadata = undefined
            }

            await addImportedVideoFile(file, extractedMetadata)
          } catch (error) {
            console.error('Error importing file:', file.name, error)
          }
        }

        alert(t('upload.multiImportedAlert', { count: files.filter((f) => f.type.startsWith('video/')).length }))
      })()
      e.target.value = ''
      return
    }

    // Single file: import and open for analysis
    const file = files[0]
    if (!file.type.startsWith('video/')) return

    void (async () => {
      let extractedMetadata: EmbeddedAnalysisMetadata | undefined

      try {
        const extracted = await extractMetadataFromVideo(file, file.name)
        extractedMetadata = extracted?.metadata
      } catch {
        extractedMetadata = undefined
      }

      const libraryId = await addImportedVideoFile(file, extractedMetadata)
      const url = URL.createObjectURL(file)
      onVideoSelect(file, url, extractedMetadata, libraryId)
    })()
  }

  return (
    <>
      {/* Camera overlay: preview + recording + converting */}
      {(cameraPhase === 'preview' || cameraPhase === 'recording' || cameraPhase === 'converting') && (
        <div className="recording-overlay">
          {cameraPhase === 'converting' ? (
            <div className="recording-converting-msg">
              <div className="recording-converting-spinner" />
                <p>{t('upload.converting')}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="recording-preview"
              />
              {countdown !== null && (
                <div className="recording-countdown-overlay">
                  <span className="recording-countdown-number">{countdown}</span>
                </div>
              )}

              <div className="recording-hud">
                {cameraPhase === 'recording' && (
                  <span className="recording-indicator">● {t('upload.recIndicator')}</span>
                )}

                {/* Camera controls — available in preview phase only */}
                {cameraPhase === 'preview' && countdown === null && (
                  <>
                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      className="camera-ctrl-btn"
                      aria-label={facingMode === 'user' ? t('upload.flipRear') : t('upload.flipFront')}
                      title={facingMode === 'user' ? t('upload.flipRear') : t('upload.flipFront')}
                    >
                      {facingMode === 'user' ? <Icons.CameraRearIcon width={18} height={18} /> : <Icons.CameraFrontIcon width={18} height={18} />}
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleOrientation}
                      className="camera-ctrl-btn"
                      aria-label={isLandscape ? t('upload.orientationPortrait') : t('upload.orientationLandscape')}
                      title={isLandscape ? t('upload.orientationPortrait') : t('upload.orientationLandscape')}
                    >
                      {isLandscape ? <Icons.PortraitIcon width={18} height={18} /> : <Icons.LandscapeIcon width={18} height={18} />}
                    </button>
                  </>
                )}

                {cameraPhase === 'preview' ? (
                  countdown !== null ? (
                    <button
                      type="button"
                      onClick={cancelCamera}
                      className="recording-cancel-btn"
                      aria-label={t('upload.cancel')}
                    >
                      <Icons.CloseIcon width={18} height={18} />
                    </button>
                  ) : (
                    <div className="recording-controls">
                      <div className="recording-settings-group">
                        <select
                          id="delay-select"
                          value={recordingDelay}
                          onChange={(e) => setRecordingDelay(Number(e.target.value))}
                          className="recording-delay-select"
                          title={t('upload.delay.title')}
                          aria-label={t('upload.delay.title')}
                        >
                          <option value={0}>{t('upload.delay.none')}</option>
                          <option value={3}>{t('upload.delay.seconds', { seconds: 3 })}</option>
                          <option value={5}>{t('upload.delay.seconds', { seconds: 5 })}</option>
                          <option value={10}>{t('upload.delay.seconds', { seconds: 10 })}</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartWithDelay}
                        className="recording-start-btn"
                        aria-label={t('upload.startRecording')}
                        title={t('upload.startRecording')}
                      >
                        <Icons.RecordIcon width={20} height={20} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelCamera}
                        className="recording-cancel-btn"
                        aria-label={t('upload.cancel')}
                        title={t('upload.cancel')}
                      >
                        <Icons.CloseIcon width={18} height={18} />
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="recording-stop-btn"
                    aria-label={t('upload.stopRecording')}
                    title={t('upload.stopRecording')}
                  >
                    <Icons.StopIcon width={20} height={20} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="upload-button">
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="video-upload"
        />

        <button
          type="button"
          onClick={handleOpenCamera}
          className="record-button"
        >
          <Icons.RecordIcon width={16} height={16} />
          {t('upload.recordVideo')}
        </button>
      </div>
    </>
  )
}

export default UploadButton