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
export async function updateEvent(id:string,input:{title:string;kind:EventItem['kind'];starts_at:string;location?:string;description?:string}):Promise<EventItem>{
 if(USE_MOCKS||!supabase){const index=demoEvents.findIndex(e=>e.id===id);if(index<0)throw new Error('Evento no encontrado.');demoEvents[index]={...demoEvents[index],...input};return demoEvents[index]}
 const {data,error}=await supabase.from('events').update(input).eq('id',id).select('*').single()
 if(error)throw new Error(error.message)
 return data as EventItem
}
export async function deleteEvent(id:string):Promise<void>{
 if(USE_MOCKS||!supabase){const index=demoEvents.findIndex(e=>e.id===id);if(index>=0)demoEvents.splice(index,1);return}
 const {count,error:checkError}=await supabase.from('attendance').select('id',{count:'exact',head:true}).eq('event_id',id)
 if(checkError)throw new Error(`No se pudo verificar la asistencia: ${checkError.message}`)
 if(count)throw new Error('Este evento ya tiene asistencias. Conservalo para no perder esos registros.')
 const {data,error}=await supabase.from('events').delete().eq('id',id).select('id').maybeSingle()
 if(error)throw new Error(error.message)
 if(!data)throw new Error('No se pudo eliminar el evento. Revisá tus permisos.')
}
