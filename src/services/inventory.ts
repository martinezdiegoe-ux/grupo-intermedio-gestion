import { supabase } from '../lib/supabase'

export type InventoryCategory = 'durable' | 'consumable'

export interface InventoryItemInput {
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  responsible_id: string | null
}

interface InventorySnapshot extends InventoryItemInput {
  responsible_name: string | null
}

export interface InventoryItem extends InventorySnapshot {
  id: string
  version: number
}

export interface InventoryMovement {
  id: number
  actor_name: string
  occurred_at: string
  previous_values: InventorySnapshot | null
  current_values: InventorySnapshot
}

export interface InventoryResponsible {
  id: string
  full_name: string
}

const itemColumns = 'id,name,category,quantity,unit,responsible_id,responsible_name,version'
export const inventoryHistoryPageSize = 30

function client() {
  if (!supabase) throw new Error('El inventario requiere conexión con la base de datos.')
  return supabase
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  const items: InventoryItem[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client().from('inventory_items')
      .select(itemColumns).order('name').order('id').range(offset, offset + pageSize - 1)
    if (error) throw new Error(error.message)
    items.push(...data)
    if (data.length < pageSize) return items
  }
}

export async function listInventoryResponsibles(): Promise<InventoryResponsible[]> {
  const { data, error } = await client().rpc('inventory_responsibles')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveInventoryItem(values: InventoryItemInput, existing?: InventoryItem): Promise<InventoryItem> {
  const items = client().from('inventory_items')
  const operation = existing
    ? items.update(values).eq('id', existing.id).eq('version', existing.version)
    : items.insert(values)
  const { data, error } = await operation.select(itemColumns).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('El artículo cambió mientras lo editabas. Cerrá la edición y actualizá el inventario.')
  return data
}

export async function listInventoryMovements(itemId: string, before?: number): Promise<InventoryMovement[]> {
  let query = client().from('inventory_movements')
    .select('id,actor_name,occurred_at,previous_values,current_values')
    .eq('item_id', itemId).order('id', { ascending: false }).limit(inventoryHistoryPageSize)
  if (before !== undefined) query = query.lt('id', before)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}
