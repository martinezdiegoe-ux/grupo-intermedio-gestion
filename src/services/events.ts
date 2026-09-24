import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import { demoEvents } from '../data/mock'
import type { EventItem } from '../types/domain'
export async function listUpcomingEvents():Promise<EventItem[]>{
 if(USE_MOCKS||!supabase)return demoEvents
 const {data,error}=await supabase.from('events').select('*').gte('starts_at',new Date().toISOString()).order('starts_at').limit(50)
 if(error)throw error
 return (data??[]) as EventItem[]
}
