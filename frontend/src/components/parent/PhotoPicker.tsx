import { useRef } from 'react'
import { Capacitor } from '@capacitor/core'

interface Props {
  photoUrl?: string
  onPhotoChange: (dataUrl: string | null) => void
}

function resizeFromDataUrl(dataUrl: string, maxSize = 500): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
      else { w = Math.round(w * maxSize / h); h = maxSize }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

async function pickNative(): Promise<string | null> {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    })
    if (!image.dataUrl) return null
    return await resizeFromDataUrl(image.dataUrl)
  } catch {
    return null
  }
}

function resizeFromFile(file: File, maxSize = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let w = img.width, h = img.height
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
        else { w = Math.round(w * maxSize / h); h = maxSize }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function PhotoPicker({ photoUrl, onPhotoChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePick = async () => {
    if (Capacitor.isNativePlatform()) {
      const dataUrl = await pickNative()
      if (dataUrl) onPhotoChange(dataUrl)
    } else {
      fileRef.current?.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeFromFile(file)
      onPhotoChange(dataUrl)
    } catch {
      // fallback : read as-is without resize
      const reader = new FileReader()
      reader.onload = (ev) => onPhotoChange(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {photoUrl ? (
        <img src={photoUrl} alt="Photo enfant"
          className="w-24 h-24 rounded-full object-cover border-4 border-kids-orange shadow-md" />
      ) : (
        <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex items-center justify-center text-5xl">
          👶
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={handlePick}
          className="bg-kids-blue text-white font-bold px-4 py-2 rounded-xl text-sm">
          📷 {photoUrl ? 'Changer' : 'Ajouter photo'}
        </button>
        {photoUrl && (
          <button type="button" onClick={() => onPhotoChange(null)}
            className="bg-red-100 text-red-500 font-bold px-3 py-2 rounded-xl text-sm">
            🗑️
          </button>
        )}
      </div>
      {/* Fallback for web browsers */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={handleFileChange} />
    </div>
  )
}
