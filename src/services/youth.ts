import { supabase } from '../lib/supabase'
import { USE_MOCKS } from '../lib/config'
import { demoYouth } from '../data/mock'
import type { YoungPerson } from '../types/domain'
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
