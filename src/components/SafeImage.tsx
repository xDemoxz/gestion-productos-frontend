import { useState } from "react"

interface SafeImageProps {
  src?: string
  alt: string
  className?: string
}

// Una URL rota deja un icono de imagen partida por defecto.
// onError cambia a un placeholder propio.
export function SafeImage({ src, alt, className = "" }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gray-100 text-xs text-gray-400 ${className}`}
      >
        Sin imagen
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
