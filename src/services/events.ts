import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import { demoEvents } from '../data/mock'
import type { EventItem } from '../types/domain'
export async function listUpcomingEvents():Promise<EventItem[]>{
 if(USE_MOCKS||!supabase)return demoEvents.filter(e=>new Date(e.starts_at)>=new Date()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at))
 const {data,error}=await supabase.from('events').select('*').gte('starts_at',new Date().toISOString()).order('starts_at').limit(50)
 if(error)throw error
 return (data??[]) as EventItem[]
}
export async function createEvent(input:{title:string;kind:EventItem['kind'];starts_at:string;ends_at?:string;location?:string;description?:string}):Promise<EventItem>{
 if(USE_MOCKS||!supabase){const item={id:crypto.randomUUID(),...input};demoEvents.push(item);return item}
 const {data,error}=await supabase.from('events').insert(input).select('*').single()
 if(error)throw error
 return data as EventItem
}
