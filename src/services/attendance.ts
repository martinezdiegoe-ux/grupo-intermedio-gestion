import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import type { AttendanceStatus } from '../types/domain'

export interface AttendanceEvent { id:string; kind:'sunday'|'rehearsal'; title:string; starts_at:string }
export async function listAttendanceEvents():Promise<AttendanceEvent[]>{
 if(USE_MOCKS||!supabase)return [{id:'demo-event',kind:'sunday',title:'Grupo Intermedio',starts_at:new Date().toISOString()}]
 const {data,error}=await supabase.from('events').select('id,kind,title,starts_at').in('kind',['sunday','rehearsal']).eq('attendance_enabled',true).order('starts_at',{ascending:false}).limit(100)
 if(error)throw error
 return data as AttendanceEvent[]
}
export async function getAttendance(eventId:string):Promise<Record<string,AttendanceStatus>>{
 if(USE_MOCKS||!supabase)return {}
 const {data,error}=await supabase.from('attendance').select('young_person_id,status').eq('event_id',eventId)
 if(error)throw error
 return Object.fromEntries((data??[]).map(row=>[row.young_person_id,row.status]))
}
export async function saveAttendance(eventId:string,status:Record<string,AttendanceStatus>):Promise<void>{
 if(USE_MOCKS||!supabase)return
 for(const [youngId,value] of Object.entries(status)){
  const {error}=await supabase.rpc('upsert_attendance',{p_event_id:eventId,p_young_person_id:youngId,p_status:value})
  if(error)throw error
 }
}
