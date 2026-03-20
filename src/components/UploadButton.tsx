import { useState, useRef, useEffect } from 'react'
import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { extractMetadataFromVideo } from '../utils/videoMetadata.ts'
import { addImportedVideoFile } from '../services/videoLibrary.ts'

interface UploadButtonProps {
  onVideoSelect: (video: File | Blob, url: string, metadata?: EmbeddedAnalysisMetadata, libraryId?: string) => void
}

function UploadButton({ onVideoSelect }: UploadButtonProps): JSX.Element {
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Attach the live camera stream to the preview element once it mounts
  useEffect(() => {
    if (isRecording && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [isRecording])

  const getSupportedMimeType = (): string | undefined => {
    const candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ]

    return candidates.find((type) => MediaRecorder.isTypeSupported(type))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) {
      return
    }

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

        alert(`Importerade ${files.filter((f) => f.type.startsWith('video/')).length} video(s).`)
      })()
      e.target.value = ''
      return
    }

    // Single file: import and open for analysis
    const file = files[0]
    if (!file.type.startsWith('video/')) {
      return
    }

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      streamRef.current = stream

      const supportedMimeType = getSupportedMimeType()
      const mediaRecorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        void (async () => {
          const blobType = mediaRecorder.mimeType || 'video/webm'
          const blob = new Blob(chunksRef.current, { type: blobType })
          const fileName = `recording-${Date.now()}.webm`
          const file = new File([blob], fileName, { type: blobType })
          const libraryId = await addImportedVideoFile(file)
          const url = URL.createObjectURL(file)
          onVideoSelect(file, url, undefined, libraryId)

          // Stop camera stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
        })()
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Kunde inte komma åt kameran. Kontrollera behörigheter.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <>
      {isRecording && (
        <div className="recording-overlay">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="recording-preview"
          />
          <div className="recording-hud">
            <span className="recording-indicator">● REC</span>
            <button
              type="button"
              onClick={stopRecording}
              className="recording-stop-btn"
            >
              ⏹ Stoppa inspelning
            </button>
          </div>
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
          onClick={startRecording}
          className="record-button"
        >
          Spela in video
        </button>
      </div>
    </>
  )
}

export default UploadButton