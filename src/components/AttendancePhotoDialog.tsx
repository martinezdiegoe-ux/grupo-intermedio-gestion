import { useEffect, useRef, useState } from 'react'

export default function AttendancePhotoDialog({ name, photoUrl, onBack, onProfile }: {
  name: string
  photoUrl: string
  onBack: () => void
  onProfile?: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function close(next: () => void) {
    ref.current?.close()
    next()
  }

  return (
    <dialog ref={ref} className="attendance-photo-dialog" aria-labelledby="attendance-photo-name"
      onCancel={event => { event.preventDefault(); close(onBack) }}
      onClick={event => { if (event.target === event.currentTarget) close(onBack) }}>
      <div className="attendance-photo-content">
        <h2 id="attendance-photo-name">{name}</h2>
        {failed ? <p role="status">No se pudo cargar la foto.</p> :
          <img src={photoUrl} alt={`Foto de ${name}`} onError={() => setFailed(true)} />}
        <div className="attendance-photo-actions">
          <button type="button" className="secondary-btn" onClick={() => close(onBack)}>Volver a asistencia</button>
          {onProfile && <button type="button" className="small-primary" onClick={() => close(onProfile)}>Ir al perfil</button>}
        </div>
      </div>
    </dialog>
  )
}
