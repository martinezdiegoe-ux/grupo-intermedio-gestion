import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import { demoAlerts } from '../data/mock'
import type { AlertItem } from '../types/domain'
import { listAttendanceEvents } from './attendance'
import { listYouth } from './youth'
export async function listAlerts():Promise<AlertItem[]>{
 if(USE_MOCKS||!supabase)return demoAlerts
 const [people,events]=await Promise.all([listYouth(),listAttendanceEvents()])
 const recent=events.filter(event=>new Date(event.starts_at)<=new Date()).slice(0,8)
 if(!recent.length)return []
 const {data,error}=await supabase.from('attendance').select('event_id,young_person_id,status').in('event_id',recent.map(event=>event.id))
 if(error)throw error
 const statuses=new Map((data??[]).map(row=>[row.event_id+':'+row.young_person_id,row.status]))
 return people.flatMap(person=>{
  const recorded=recent.map(event=>statuses.get(event.id+':'+person.id)).filter((value):value is string=>!!value)
  let consecutive=0
  for(const event of recent){const status=statuses.get(event.id+':'+person.id);if(!status)continue;if(status==='absent')consecutive++;else break}
  const rate=recorded.length?recorded.filter(status=>status==='present').length/recorded.length:1
  const level=consecutive>=3||recorded.length>=4&&rate<.65?'red':consecutive>=2?'yellow':null
  if(!level)return []
  const reason=consecutive>=2?consecutive+' inasistencias consecutivas':`Asistencia del ${Math.round(rate*100)}% en los últimos ${recorded.length} encuentros`
  return [{id:'attendance:'+person.id,young_person_id:person.id,young_person_name:person.first_name+' '+person.last_name,level,reason,created_at:recent[0].starts_at,resolved:false} as AlertItem]
 })
}
