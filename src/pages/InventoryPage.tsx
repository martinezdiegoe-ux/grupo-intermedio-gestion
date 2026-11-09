import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { History, Plus, RefreshCw, Search } from 'lucide-react'
import AppSelect from '../components/AppSelect'
import { useAuth } from '../state/AuthContext'
import {
  inventoryHistoryPageSize,
  listInventoryItems,
  listInventoryMovements,
  listInventoryResponsibles,
  saveInventoryItem,
} from '../services/inventory'
import type {
  InventoryCategory, InventoryItem, InventoryItemInput, InventoryMovement, InventoryResponsible,
} from '../services/inventory'
import '../inventory.css'

const categoryLabels = { durable: 'Bien de uso', consumable: 'Consumible' }
const categoryOptions = [
  { value: 'durable', label: 'Bien de uso' },
  { value: 'consumable', label: 'Consumible' },
]
const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'durable', label: 'Bienes de uso' },
  { value: 'consumable', label: 'Consumibles' },
] as const
const numberFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 })
const movementDate = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  hourCycle: 'h23',
  timeZone: 'America/Argentina/Buenos_Aires',
})

function quantityLabel(item: Pick<InventoryItemInput, 'quantity' | 'unit'>) {
  return numberFormat.format(item.quantity) + ' · ' + item.unit
}

function InventoryForm({ item, onCancel, onSaved }: {
  item?: InventoryItem
  onCancel: () => void
  onSaved: (item: InventoryItem) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<InventoryCategory>(item?.category ?? 'durable')
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1))
  const [unit, setUnit] = useState(item?.unit ?? 'unidad')
  const [responsibleId, setResponsibleId] = useState(item?.responsible_id ?? '')
  const [responsibles, setResponsibles] = useState<InventoryResponsible[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    formRef.current?.scrollIntoView({ block: 'start' })
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    listInventoryResponsibles()
      .then(rows => { if (active) setResponsibles(rows) })
      .catch(() => { if (active) setLoadError('No se pudo cargar la lista de responsables.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  const responsibleOptions = [
    { value: '', label: 'Sin asignar' },
    ...responsibles.map(person => ({ value: person.id, label: person.full_name })),
  ]
  if (item?.responsible_id && !responsibles.some(person => person.id === item.responsible_id)) {
    responsibleOptions.push({ value: item.responsible_id, label: item.responsible_name ?? 'Responsable actual' })
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || loading || loadError) return
    setError('')
    const amount = Number(quantity)
    if (!name.trim() || !unit.trim() || !quantity.trim() || !Number.isFinite(amount) || amount < 0 || amount > 999999999.999) {
      setError('Completá el nombre, la unidad y una cantidad válida.')
      return
    }

    setSaving(true)
    try {
      const saved = await saveInventoryItem({
        name: name.trim(),
        category,
        quantity: amount,
        unit: unit.trim(),
        responsible_id: responsibleId || null,
      }, item)
      onSaved(saved)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'No se pudo guardar el artículo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={formRef} className="form-card inventory-form" onSubmit={save}>
      <h2>{item ? 'Editar artículo' : 'Nuevo artículo'}</h2>
      <div className="form-grid">
        <label className="span2">
          Nombre del artículo
          <input required maxLength={120} value={name} disabled={saving} onChange={event => setName(event.target.value)} />
        </label>
        <div className="inventory-field">
          <span>Tipo</span>
          <AppSelect label="Tipo de artículo" value={category} options={categoryOptions}
            disabled={saving} onChange={value => setCategory(value as InventoryCategory)} />
        </div>
        <div className="inventory-field">
          <span>Responsable</span>
          <AppSelect label="Responsable" value={responsibleId} options={responsibleOptions}
            disabled={saving || loading || !!loadError} onChange={setResponsibleId} />
        </div>
        <label>
          Cantidad
          <input type="number" required min={0} max={999999999.999} step={0.001}
            value={quantity} disabled={saving} onChange={event => setQuantity(event.target.value)} />
        </label>
        <label>
          Unidad de medida
          <input required maxLength={30} placeholder="unidad, litro, kilo…" value={unit}
            disabled={saving} onChange={event => setUnit(event.target.value)} />
        </label>
      </div>
      {loading && <p role="status">Cargando responsables…</p>}
      {loadError && <div className="error-box" role="alert">
        {loadError}
        <button type="button" className="text-btn" onClick={() => setRetry(value => value + 1)}>Reintentar</button>
      </div>}
      {error && <p className="error-box" role="alert">{error}</p>}
      <div className="inventory-actions">
        <button type="submit" className="primary-btn" disabled={saving || loading || !!loadError}>
          {saving ? 'Guardando…' : 'Guardar artículo'}
        </button>
        <button type="button" className="secondary-btn" disabled={saving} onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

function MovementDetails({ movement }: { movement: InventoryMovement }) {
  const previous = movement.previous_values
  const current = movement.current_values
  const beforeResponsible = previous?.responsible_name ?? 'Sin asignar'
  const afterResponsible = current.responsible_name ?? 'Sin asignar'
  return (
    <li className="inventory-movement">
      <div className="inventory-movement-heading">
        <strong>{previous ? 'Cambio' : 'Alta del artículo'}</strong>
        <time dateTime={movement.occurred_at}>{movementDate.format(new Date(movement.occurred_at))}</time>
      </div>
      <p className="inventory-movement-actor">{movement.actor_name}</p>
      <dl className="inventory-movement-values">
        {(!previous || previous.responsible_id !== current.responsible_id) &&
          <div><dt>Responsable</dt><dd>{previous ? beforeResponsible + ' → ' : ''}{afterResponsible}</dd></div>}
        {(!previous || previous.quantity !== current.quantity || previous.unit !== current.unit) &&
          <div><dt>Cantidad</dt><dd>{previous ? quantityLabel(previous) + ' → ' : ''}{quantityLabel(current)}</dd></div>}
        {previous && previous.name !== current.name &&
          <div><dt>Nombre</dt><dd>{previous.name} → {current.name}</dd></div>}
        {previous && previous.category !== current.category &&
          <div><dt>Tipo</dt><dd>{categoryLabels[previous.category]} → {categoryLabels[current.category]}</dd></div>}
      </dl>
    </li>
  )
}

function InventoryHistory({ itemId }: { itemId: string }) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [before, setBefore] = useState<number | undefined>()
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    listInventoryMovements(itemId, before)
      .then(rows => {
        if (!active) return
        setMovements(current => before === undefined ? rows : [...current, ...rows])
        setHasMore(rows.length === inventoryHistoryPageSize)
      })
      .catch(() => { if (active) setError('No se pudo cargar el historial.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [itemId, before, retry])

  return (
    <section className="inventory-history" aria-label="Historial de movimientos">
      <h3>Historial</h3>
      {movements.length > 0 && <ol>{movements.map(movement =>
        <MovementDetails key={movement.id} movement={movement} />)}</ol>}
      {loading && <p role="status">Cargando movimientos…</p>}
      {error && <div className="error-box" role="alert">
        {error}
        <button type="button" className="text-btn" onClick={() => setRetry(value => value + 1)}>Reintentar</button>
      </div>}
      {!loading && !error && movements.length === 0 && <p>Todavía no hay movimientos.</p>}
      {!loading && !error && hasMore && <button type="button" className="text-btn"
        onClick={() => setBefore(movements[movements.length - 1].id)}>Ver movimientos anteriores</button>}
    </section>
  )
}

export default function InventoryPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'superadmin'
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filter, setFilter] = useState<'all' | InventoryCategory>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<InventoryItem | 'new' | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    listInventoryItems()
      .then(rows => { if (active) setItems(rows) })
      .catch(() => { if (active) setError('No se pudo cargar el inventario.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  const query = search.trim().toLocaleLowerCase('es-AR')
  const visible = items.filter(item => (filter === 'all' || item.category === filter) &&
    (item.name.toLocaleLowerCase('es-AR').includes(query) ||
      (item.responsible_name ?? '').toLocaleLowerCase('es-AR').includes(query)))

  function onSaved(saved: InventoryItem) {
    setItems(current => [...current.filter(item => item.id !== saved.id), saved]
      .sort((a, b) => a.name.localeCompare(b.name, 'es-AR')))
    setEditing(null)
    setHistoryId(saved.id)
    setFilter('all')
    setSearch('')
    setNotice('Artículo guardado.')
  }

  return (
    <div className="inventory-page">
      <div className="page-title inventory-title">
        <div><h1>Inventario</h1><span>Bienes de uso y consumibles</span></div>
        <div className="inventory-actions">
          <button type="button" className="icon-btn" aria-label="Actualizar inventario" title="Actualizar inventario"
            disabled={loading || editing !== null} onClick={() => setRevision(value => value + 1)}>
            <RefreshCw size={18} />
          </button>
          {canManage && <button type="button" className="small-primary" disabled={loading || editing !== null}
            onClick={() => { setNotice(''); setEditing('new') }}>
            <Plus size={17} /> Nuevo artículo
          </button>}
        </div>
      </div>
      {canManage && editing && <InventoryForm key={editing === 'new' ? 'new' : editing.id}
        item={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSaved={onSaved} />}
      {notice && <p className="success-box" role="status">{notice}</p>}
      <div className="segmented" aria-label="Tipo de artículo">
        {filters.map(option => <button type="button" key={option.value}
          className={filter === option.value ? 'active' : ''} aria-pressed={filter === option.value}
          onClick={() => setFilter(option.value)}>{option.label}</button>)}
      </div>
      <label className="search-box">
        <Search size={19} />
        <input aria-label="Buscar artículo o responsable" placeholder="Buscar artículo o responsable…"
          value={search} onChange={event => setSearch(event.target.value)} />
      </label>
      {loading && <p role="status">Cargando inventario…</p>}
      {error && <p className="error-box" role="alert">{error}</p>}
      {!loading && !error && visible.length === 0 &&
        <div className="empty-card">{items.length ? 'No hay artículos para esta búsqueda.' : 'Todavía no hay artículos cargados.'}</div>}
      <div className="list-stack">
        {visible.map(item => (
          <article className="inventory-item" key={item.id}>
            <div className="inventory-item-heading">
              <div><h2>{item.name}</h2><span className="inventory-category">{categoryLabels[item.category]}</span></div>
              <div className="inventory-actions">
                {canManage && <button type="button" className="text-btn" disabled={editing !== null || loading}
                  onClick={() => { setNotice(''); setEditing(item) }}>Editar</button>}
                <button type="button" className="text-btn" aria-expanded={historyId === item.id}
                  onClick={() => setHistoryId(current => current === item.id ? null : item.id)}>
                  <History size={16} /> Historial
                </button>
              </div>
            </div>
            <dl className="inventory-item-details">
              <div><dt>Cantidad</dt><dd>{quantityLabel(item)}</dd></div>
              <div><dt>Responsable actual</dt><dd>{item.responsible_name ?? 'Sin asignar'}</dd></div>
            </dl>
            {historyId === item.id && <InventoryHistory key={item.version} itemId={item.id} />}
          </article>
        ))}
      </div>
    </div>
  )
}
