import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import { demoProjects } from '../data/mock'
import type { Project } from '../types/domain'
export async function listProjects():Promise<Project[]>{
 if(USE_MOCKS||!supabase)return demoProjects
 const {data,error}=await supabase.from('project_progress_view').select('*').order('created_at',{ascending:false})
 if(error)throw error
 return (data??[]) as Project[]
}
