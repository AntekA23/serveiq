import { useState, useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import api from '../../../api/axios'
import useToast from '../../../hooks/useToast'
import './AvatarUpload.css'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED = ['image/jpeg', 'image/png']

export default function AvatarUpload({
  playerId,
  currentUrl,
  firstName = '',
  lastName = '',
  onUpload,
}) {
  const fileRef = useRef(null)
  const toast = useToast()
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const initials = `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`
  const displayUrl = preview || currentUrl

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED.includes(file.type)) {
      toast.error('Dozwolone formaty: JPEG, PNG')
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error('Maksymalny rozmiar pliku: 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)

    uploadFile(file)
  }

  const uploadFile = async (file) => {
    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const { data } = await api.put(`/players/${playerId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded * 100) / e.total))
          }
        },
      })
      toast.success('Avatar zaktualizowany')
      onUpload?.(data.avatarUrl || preview)
    } catch {
      toast.error('Nie udalo sie przeslac avatara')
      setPreview(null)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleClearPreview = (e) => {
    e.stopPropagation()
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div
      className={`avatar-upload ${uploading ? 'uploading' : ''}`}
      onClick={() => !uploading && fileRef.current?.click()}
      title="Zmien avatar"
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="avatar-upload-input"
      />

      {displayUrl ? (
        <img src={displayUrl} alt={`${firstName} ${lastName}`} className="avatar-upload-img" />
      ) : (
        <div className="avatar-upload-initials">{initials}</div>
      )}

      {uploading && (
        <div className="avatar-upload-progress">
          <svg viewBox="0 0 36 36" className="avatar-upload-ring">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeDasharray={`${progress} ${100 - progress}`}
              strokeDashoffset="25"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {!uploading && (
        <div className="avatar-upload-overlay">
          <Camera size={18} />
        </div>
      )}

      {preview && !uploading && (
        <button className="avatar-upload-clear" onClick={handleClearPreview}>
          <X size={12} />
        </button>
      )}
    </div>
  )
}
