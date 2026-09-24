import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import { demoAlerts } from '../data/mock'
import type { AlertItem } from '../types/domain'
export async function listAlerts():Promise<AlertItem[]>{
 if(USE_MOCKS||!supabase)return demoAlerts
 const {data,error}=await supabase.from('alerts_view').select('*').eq('resolved',false).order('created_at',{ascending:false})
 if(error)throw error
 return (data??[]) as AlertItem[]
}
