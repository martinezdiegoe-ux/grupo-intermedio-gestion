import { supabase } from '../lib/supabase'
import { USE_MOCKS } from '../lib/config'
import { demoYouth } from '../data/mock'
import type { MedicalProfile,YoungPerson } from '../types/domain'
export async function listYouth():Promise<YoungPerson[]>{
 if(USE_MOCKS||!supabase)return demoYouth
 const {data,error}=await supabase.from('young_people_view').select('*').eq('active',true).order('last_name')
 if(error)throw error
 return (data??[]) as YoungPerson[]
}
export async function getYouth(id:string):Promise<YoungPerson|null>{
 if(USE_MOCKS||!supabase)return demoYouth.find(y=>y.id===id)??null
 const {data,error}=await supabase.from('young_people_view').select('*').eq('id',id).single()
 if(error)throw error
 return data as YoungPerson
}
export async function getMedicalProfile(id:string):Promise<MedicalProfile|null>{
 if(USE_MOCKS||!supabase)return null
 const {data,error}=await supabase.from('medical_profiles').select('young_person_id,blood_type,allergies,medications,medication_reason,health_provider,insurance_member_number,relevant_conditions,surgeries,activity_restrictions,dietary_restrictions,emergency_notes').eq('young_person_id',id).maybeSingle()
 if(error)throw error
 return data as MedicalProfile|null
}
export async function updateYouth(id:string, changes:Partial<YoungPerson>):Promise<YoungPerson>{
 if(USE_MOCKS||!supabase){
  const index=demoYouth.findIndex(y=>y.id===id)
  if(index<0)throw new Error('Joven no encontrado.')
  demoYouth[index]={...demoYouth[index],...changes}
  return demoYouth[index]
 }
 const payload={first_name:changes.first_name,last_name:changes.last_name,birth_date:changes.birth_date,phone:changes.phone,address:changes.address}
 const {data,error}=await supabase.from('young_people').update(payload).eq('id',id).select().single()
 if(error)throw error
 return data as YoungPerson
}
