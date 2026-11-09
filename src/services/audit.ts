import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'

export type AuditVisit = {
  id: string
  actor_name: string
  started_at: string
  last_seen_at: string
  active_seconds: number
}

export type AuditChange = {
  id: number
  actor_name: string | null
  action: string
  table_name: string
  record_id: string | null
  record_label: string | null
  changed_fields: string[]
  created_at: string
}

export const AUDIT_PAGE_SIZE = 25

export async function listAuditVisits(page: number): Promise<AuditVisit[]> {
  if (USE_MOCKS || !supabase) return []
  const from = page * AUDIT_PAGE_SIZE
  const { data, error } = await supabase.from('app_visits')
    .select('id,actor_name,started_at,last_seen_at,active_seconds')
    .order('started_at', { ascending: false }).order('id', { ascending: false })
    .range(from, from + AUDIT_PAGE_SIZE)
  if (error) throw error
  return data
}

export async function listAuditChanges(page: number): Promise<AuditChange[]> {
  if (USE_MOCKS || !supabase) return []
  const from = page * AUDIT_PAGE_SIZE
  const { data, error } = await supabase.from('audit_log')
    .select('id,actor_name,action,table_name,record_id,record_label,changed_fields,created_at')
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(from, from + AUDIT_PAGE_SIZE)
  if (error) throw error
  return data
}
