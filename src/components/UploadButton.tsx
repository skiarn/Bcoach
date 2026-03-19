import { useState, useRef, useEffect } from 'react'

interface UploadButtonProps {
  onVideoSelect: (video: File | Blob, url: string) => void
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
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      onVideoSelect(file, url)
    }
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
        const blobType = mediaRecorder.mimeType || 'video/webm'
        const blob = new Blob(chunksRef.current, { type: blobType })
        const url = URL.createObjectURL(blob)
        onVideoSelect(blob, url)

        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
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
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="video-upload"
        />
        <label htmlFor="video-upload" className="upload-button-label">
          Ladda upp video
        </label>

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