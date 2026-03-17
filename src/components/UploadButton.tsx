import { useState, useRef } from 'react'

interface UploadButtonProps {
  onVideoSelect: (video: File | Blob, url: string) => void
}

function UploadButton({ onVideoSelect }: UploadButtonProps): JSX.Element {
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

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
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: true
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
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

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  return (
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

      {isMobile && (
        <>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className="record-button"
          >
            {isRecording ? 'Stoppa inspelning' : 'Spela in video'}
          </button>

          {isRecording && (
            <div style={{ marginTop: '10px' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '300px', height: '200px', border: '1px solid #ccc' }}
              />
              <p>🎥 Inspelning pågår...</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default UploadButton