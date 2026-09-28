import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import type { AttendanceStatus } from '../types/domain'

export interface AttendanceEvent { id:string; kind:'sunday'|'rehearsal'; title:string; starts_at:string }
const demoRecords=new Map<string,Record<string,AttendanceStatus>>()
export function localDate(value:string){const parts=new Intl.DateTimeFormat('es-AR',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Argentina/Buenos_Aires'}).formatToParts(new Date(value));const get=(type:string)=>parts.find(p=>p.type===type)?.value??'';return `${get('year')}-${get('month')}-${get('day')}`}
export async function listAttendanceEvents():Promise<AttendanceEvent[]>{
 if(USE_MOCKS||!supabase)return []
 const {data,error}=await supabase.from('events').select('id,kind,title,starts_at').in('kind',['sunday','rehearsal']).eq('attendance_enabled',true).order('starts_at',{ascending:false}).limit(250)
 if(error)throw error
 return data as AttendanceEvent[]
}
export async function getAttendance(eventId:string):Promise<Record<string,AttendanceStatus>>{
 if(USE_MOCKS||!supabase)return demoRecords.get(eventId)??{}
 const {data,error}=await supabase.from('attendance').select('young_person_id,status').eq('event_id',eventId)
 if(error)throw error
 return Object.fromEntries((data??[]).map(row=>[row.young_person_id,row.status]))
}
export async function listAttendanceSummary():Promise<{event:AttendanceEvent;rate:number;count:number}[]>{
 if(USE_MOCKS||!supabase)return []
 const events=(await listAttendanceEvents()).filter(e=>new Date(e.starts_at)<=new Date()).slice(0,6).reverse()
 if(!events.length)return []
 const {data,error}=await supabase.from('attendance').select('event_id,status').in('event_id',events.map(e=>e.id))
 if(error)throw error
 return events.map(event=>{const rows=(data??[]).filter(row=>row.event_id===event.id);const count=rows.filter(row=>row.status==='present'||row.status==='absent'||row.status==='justified').length;return {event,count,rate:count?Math.round(100*rows.filter(row=>row.status==='present').length/count):0}}).filter(item=>item.count>0)
}
export async function saveAttendance(date:string,kind:'sunday'|'rehearsal',existing:AttendanceEvent|undefined,status:Record<string,AttendanceStatus>):Promise<AttendanceEvent>{
 if(USE_MOCKS||!supabase){const event=existing??{id:`${kind}:${date}`,kind,title:kind==='sunday'?'Grupo Intermedio':'Ensayo',starts_at:`${date}T10:00:00-03:00`};demoRecords.set(event.id,{...demoRecords.get(event.id),...status});return event}
 let event=existing
 if(!event){
  const {data,error}=await supabase.from('events').insert({title:kind==='sunday'?'Grupo Intermedio':'Ensayo del Coro Intermedio',kind,starts_at:`${date}T10:00:00-03:00`,attendance_enabled:true}).select('id,kind,title,starts_at').single()
  if(error)throw new Error(`No se pudo crear el encuentro: ${error.message}`)
  event=data as AttendanceEvent
 }
 const {data:userData,error:userError}=await supabase.auth.getUser()
 if(userError||!userData.user)throw new Error('La sesión expiró. Ingresá nuevamente.')
 const rows=Object.entries(status).map(([young_person_id,value])=>({event_id:event.id,young_person_id,status:value,recorded_by:userData.user.id}))
 if(rows.length){const {error}=await supabase.from('attendance').upsert(rows,{onConflict:'event_id,young_person_id'});if(error)throw new Error(`No se pudo guardar la asistencia: ${error.message}`)}
 return event
}
