import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AUDIT_PAGE_SIZE, listAuditChanges, listAuditVisits } from '../services/audit'
import type { AuditChange, AuditVisit } from '../services/audit'

const dateTime = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Argentina/Buenos_Aires',
})

const sections: Record<string, string> = {
  app_users: 'Usuarios', young_people: 'Jóvenes', guardians: 'Tutores',
  young_person_guardians: 'Vínculos con tutores', medical_profiles: 'Fichas médicas',
  groups: 'Grupos', young_people_groups: 'Integrantes de grupos', events: 'Cronograma',
  attendance: 'Asistencia', alert_rules: 'Reglas de alertas', alerts: 'Alertas',
  followups: 'Seguimientos', projects: 'Proyectos', project_tasks: 'Tareas',
  task_assignees: 'Responsables de tareas', notifications: 'Avisos',
  finance_transactions: 'Presupuesto', inventory_items: 'Inventario',
  inventory_movements: 'Movimientos de inventario',
}
const actions: Record<string, string> = { INSERT: 'Alta', UPDATE: 'Modificación', DELETE: 'Eliminación' }
const fieldLabels: Record<string, string> = {
  role: 'rol', active: 'activo', first_name: 'nombre', last_name: 'apellido', full_name: 'nombre completo',
  birth_date: 'fecha de nacimiento', sex: 'sexo', phone: 'teléfono', address: 'domicilio',
  photo_path: 'foto', title: 'título', starts_at: 'inicio', status: 'estado', attendance_enabled: 'toma de asistencia',
}

function duration(seconds: number) {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  return minutes < 60 ? `${minutes} min ${seconds % 60} s` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

export default function AuditPage() {
  const [tab, setTab] = useState<'visits' | 'changes'>('visits')
  const [page, setPage] = useState(0)
  const [reload, setReload] = useState(0)
  const [rows, setRows] = useState<(AuditVisit | AuditChange)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let current = true
    const request = tab === 'visits' ? listAuditVisits(page) : listAuditChanges(page)
    request.then(data => { if (current) setRows(data) })
      .catch(() => { if (current) setError(true) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [tab, page, reload])

  function prepareLoad() {
    setLoading(true)
    setError(false)
  }

  return <>
    <div className="page-title">
      <div><h1>Auditoría</h1><span>Acceso exclusivo del superadmin</span></div>
    </div>
    <div className="audit-controls">
      <Link className="secondary-btn" to="/admin"><ArrowLeft size={16}/> Administración</Link>
      <button className="secondary-btn" type="button" disabled={loading}
        onClick={() => { prepareLoad(); setReload(value => value + 1) }}><RefreshCw size={16}/> Actualizar</button>
    </div>
    <section className="form-card audit-panel">
      <div className="audit-controls" aria-label="Tipo de actividad">
        <button className={tab === 'visits' ? 'primary-btn' : 'secondary-btn'} aria-pressed={tab === 'visits'}
          onClick={() => { if (tab !== 'visits') { prepareLoad(); setTab('visits'); setPage(0) } }}>Ingresos</button>
        <button className={tab === 'changes' ? 'primary-btn' : 'secondary-btn'} aria-pressed={tab === 'changes'}
          onClick={() => { if (tab !== 'changes') { prepareLoad(); setTab('changes'); setPage(0) } }}>Cambios</button>
      </div>
      <p className="muted">{tab === 'visits'
        ? 'Cada apertura o regreso a la app se registra como un ingreso. La permanencia es el tiempo aproximado con la app visible.'
        : 'Se registran las altas, modificaciones y eliminaciones, con el usuario y los campos editados.'}</p>
      {loading ? <p role="status">Cargando actividad…</p> :
        error ? <p className="error-box" role="alert">No se pudo cargar la auditoría. Probá actualizar.</p> :
        rows.length === 0 ? <p className="empty-card">Todavía no hay actividad registrada.</p> :
        <ul className="audit-list">{rows.slice(0, AUDIT_PAGE_SIZE).map(row => <li key={row.id}>
          <strong>{row.actor_name ?? 'Operación del sistema'}</strong>
          {'active_seconds' in row ? <>
            <span>Ingreso · {dateTime.format(new Date(row.started_at))}</span>
            <span>Permanencia aproximada · {duration(row.active_seconds)}</span>
            <small>Última actividad · {dateTime.format(new Date(row.last_seen_at))}</small>
          </> : <>
            <span>{actions[row.action] ?? row.action} · {sections[row.table_name] ?? row.table_name}</span>
            {row.record_label && <span>{row.record_label}</span>}
            {!row.record_label && row.record_id && <small>Registro · {row.record_id}</small>}
            {row.changed_fields.length > 0 && <small>Campos · {row.changed_fields.map(field => fieldLabels[field] ?? field.replaceAll('_', ' ')).join(', ')}</small>}
            <small>{dateTime.format(new Date(row.created_at))}</small>
          </>}
        </li>)}</ul>}
      {!loading && !error && (page > 0 || rows.length > AUDIT_PAGE_SIZE) && <div className="audit-controls">
        <button className="secondary-btn" disabled={page === 0}
          onClick={() => { prepareLoad(); setPage(value => value - 1) }}>Anterior</button>
        <span>Página {page + 1}</span>
        <button className="secondary-btn" disabled={rows.length <= AUDIT_PAGE_SIZE}
          onClick={() => { prepareLoad(); setPage(value => value + 1) }}>Siguiente</button>
      </div>}
    </section>
  </>
}
