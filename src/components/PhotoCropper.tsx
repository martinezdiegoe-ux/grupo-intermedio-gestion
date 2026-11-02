import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { clampPosition, cropPhoto, getPhotoCrop } from '../lib/photoCrop'
import type { PhotoPosition, PhotoSize } from '../lib/photoCrop'
import './photo-cropper.css'

type Props = { source: File | string; onConfirm: (photo: File) => void; onCancel: () => void }

export default function PhotoCropper({ source, onConfirm, onCancel }: Props) {
  const [url, setUrl] = useState('')
  const [size, setSize] = useState<PhotoSize | null>(null)
  const [position, setPosition] = useState<PhotoPosition>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const imageRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ id: number; x: number; y: number; position: PhotoPosition } | null>(null)

  useEffect(() => {
    const nextUrl = typeof source === 'string' ? source : URL.createObjectURL(source)
    setUrl(nextUrl)
    setSize(null)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setError('')
    return () => { if (typeof source !== 'string') URL.revokeObjectURL(nextUrl) }
  }, [source])

  const crop = size ? getPhotoCrop(size, zoom, position) : null
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start || start.id !== event.pointerId || !size || !crop) return
    const scale = event.currentTarget.getBoundingClientRect().width / crop.side
    const travelX = (size.width - crop.side) * scale
    const travelY = (size.height - crop.side) * scale
    setPosition({
      x: travelX > 0 ? clampPosition(start.position.x - (event.clientX - start.x) * 200 / travelX) : 0,
      y: travelY > 0 ? clampPosition(start.position.y - (event.clientY - start.y) * 200 / travelY) : 0,
    })
  }
  async function confirm() {
    if (!imageRef.current || !size || busy) return
    setBusy(true)
    setError('')
    try { onConfirm(await cropPhoto(imageRef.current, zoom, position)) }
    catch { setError('No se pudo recortar esta foto. Probá eligiéndola de nuevo desde tu dispositivo.') }
    finally { setBusy(false) }
  }

  return <div className="photo-cropper" role="group" aria-label="Ajustar foto de perfil">
    <strong>Centrá la cara</strong>
    <p>Mové la foto con el dedo y ajustá el acercamiento. El círculo muestra cómo se verá en el perfil.</p>
    <div className="photo-crop-viewport" aria-label="Vista previa del encuadre" aria-busy={!size || busy}
      onPointerDown={event => {
        if (!size || busy || (event.pointerType === 'mouse' && event.button !== 0)) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, position }
      }} onPointerMove={move}
      onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
      onLostPointerCapture={() => { drag.current = null }}>
      {url && <img ref={imageRef} src={url} crossOrigin={typeof source === 'string' ? 'anonymous' : undefined}
        alt="Vista previa de la foto" draggable={false}
        style={size && crop ? { width: `${size.width / crop.side * 100}%`, height: `${size.height / crop.side * 100}%`, left: `${-crop.x / crop.side * 100}%`, top: `${-crop.y / crop.side * 100}%`, visibility: 'visible' } : { visibility: 'hidden' }}
        onLoad={event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
        onError={() => { setSize(null); setError('No se pudo abrir esta imagen. Elegí una foto JPG, PNG o WebP desde tu dispositivo.') }}/>}
      {!size && !error && <span>Cargando foto…</span>}
    </div>
    <label>Acercamiento <span className="photo-crop-zoom" aria-hidden="true">{zoom.toFixed(1)}×</span>
      <input type="range" min="1" max="3" step="0.05" value={zoom} disabled={!size || busy}
        onChange={event => setZoom(Number(event.target.value))}/></label>
    <label>Posición horizontal
      <input type="range" min="-100" max="100" value={position.x} disabled={!size || busy || !crop || size.width <= crop.side}
        onChange={event => setPosition(current => ({ ...current, x: Number(event.target.value) }))}/></label>
    <label>Posición vertical
      <input type="range" min="-100" max="100" value={position.y} disabled={!size || busy || !crop || size.height <= crop.side}
        onChange={event => setPosition(current => ({ ...current, y: Number(event.target.value) }))}/></label>
    {error && <div className="error-box" role="alert">{error}</div>}
    <div className="photo-crop-actions">
      <button type="button" className="text-btn" disabled={busy} onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }) }}>Restablecer</button>
      <button type="button" className="secondary-btn" disabled={busy} onClick={onCancel}>Cancelar recorte</button>
      <button type="button" className="small-primary" disabled={!size || busy} onClick={confirm}>{busy ? 'Preparando…' : 'Usar este encuadre'}</button>
    </div>
    <small>Después tocá «Guardar cambios» para guardar la foto en el perfil.</small>
  </div>
}
