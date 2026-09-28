import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import { demoProjects } from '../data/mock'
import type { Project } from '../types/domain'
export async function listProjects():Promise<Project[]>{
 if(USE_MOCKS||!supabase)return demoProjects
 const {data,error}=await supabase.from('project_progress_view').select('*').order('created_at',{ascending:false})
 if(error)throw error
 return (data??[]).map(row=>({...row,tasks:[]})) as Project[]
}
export async function createProject(input:{name:string;description:string;start_date:string;end_date:string}):Promise<Project>{
 if(USE_MOCKS||!supabase){const item:Project={id:`local-${Date.now()}`,name:input.name,owner:'Líder',progress:0,status:'planned',tasks:[]};demoProjects.unshift(item);return item}
 const {data:session,error:authError}=await supabase.auth.getUser()
 if(authError||!session.user)throw new Error('La sesión expiró. Ingresá nuevamente.')
 const {data,error}=await supabase.from('projects').insert({name:input.name,description:input.description||null,start_date:input.start_date||null,end_date:input.end_date||null,owner_user_id:session.user.id,status:'planned'}).select('id,name,status').single()
 if(error)throw new Error(`No se pudo crear el proyecto: ${error.message}`)
 return {id:data.id,name:data.name,owner:session.user.email??'Responsable',progress:0,status:data.status,tasks:[]}
}
