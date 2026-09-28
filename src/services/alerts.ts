import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import { demoAlerts } from '../data/mock'
import type { AlertItem } from '../types/domain'
export async function listAlerts():Promise<AlertItem[]>{
 if(USE_MOCKS||!supabase)return demoAlerts
 const {data,error}=await supabase.from('alerts').select('id,young_person_id,level,reason,created_at,resolved,young_people(first_name,last_name)').eq('resolved',false).order('created_at',{ascending:false})
 if(error)throw error
 return (data??[]).map(row=>{const person=row.young_people as unknown as {first_name:string;last_name:string}|null;return {id:row.id,young_person_id:row.young_person_id,level:row.level,reason:row.reason,created_at:row.created_at,resolved:row.resolved,young_person_name:person?`${person.first_name} ${person.last_name}`:'Joven'}}) as AlertItem[]
}
