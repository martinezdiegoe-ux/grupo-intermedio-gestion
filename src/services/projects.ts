import { USE_MOCKS } from '../lib/config'
import { supabase } from '../lib/supabase'
import { demoProjects } from '../data/mock'
import type { Project,ProjectTask } from '../types/domain'

export type StaffMember={id:string;full_name:string}
export async function listStaff():Promise<StaffMember[]>{
 if(USE_MOCKS||!supabase)return []
 const {data,error}=await supabase.from('app_users').select('id,full_name').eq('active',true).order('full_name')
 if(error)throw error
 return data??[]
}
export async function listProjects():Promise<Project[]>{
 if(USE_MOCKS||!supabase)return demoProjects
 const {data,error}=await supabase.from('projects').select('id,name,description,start_date,end_date,status,owner_user_id,created_at').order('created_at',{ascending:false})
 if(error)throw error
 const projects=data??[]
 if(!projects.length)return []
 const ids=projects.map(p=>p.id)
 const {data:tasks,error:taskError}=await supabase.from('project_tasks').select('id,project_id,title,description,due_date,status,weight').in('project_id',ids)
 if(taskError)throw taskError
 const userIds=[...new Set(projects.map(p=>p.owner_user_id).filter((id):id is string=>Boolean(id)))]
 const taskIds=(tasks??[]).map(t=>t.id)
 const [{data:users,error:userError},{data:links,error:linkError}]=await Promise.all([
  userIds.length?supabase.from('app_users').select('id,full_name').in('id',userIds):Promise.resolve({data:[],error:null}),
  taskIds.length?supabase.from('task_assignees').select('task_id,user_id').in('task_id',taskIds):Promise.resolve({data:[],error:null})
 ])
 if(userError)throw userError
 if(linkError)throw linkError
 const assigneeIds=[...new Set((links??[]).map(a=>a.user_id))]
 const {data:assignees,error:assigneeError}=assigneeIds.length?await supabase.from('app_users').select('id,full_name').in('id',assigneeIds):{data:[],error:null}
 if(assigneeError)throw assigneeError
 const names=new Map([...(users??[]),...(assignees??[])].map(u=>[u.id,u.full_name]))
 return projects.map(p=>{
  const projectTasks:ProjectTask[]=(tasks??[]).filter(t=>t.project_id===p.id).map(t=>{
   const link=(links??[]).find(a=>a.task_id===t.id)
   return {id:t.id,title:t.title,description:t.description??undefined,due_date:t.due_date??undefined,status:t.status,weight:Number(t.weight),assignee_id:link?.user_id,assignee:link?names.get(link.user_id)??'Sin asignar':'Sin asignar'}
  })
  const weight=projectTasks.reduce((sum,t)=>sum+t.weight,0)
  const completed=projectTasks.filter(t=>t.status==='done').reduce((sum,t)=>sum+t.weight,0)
  return {id:p.id,name:p.name,description:p.description??undefined,start_date:p.start_date??undefined,end_date:p.end_date??undefined,owner_user_id:p.owner_user_id??undefined,owner:names.get(p.owner_user_id)??'Sin asignar',status:p.status,progress:weight?Math.round(100*completed/weight):0,tasks:projectTasks}
 }) as Project[]
}
export async function createProject(input:{name:string;description:string;start_date:string;end_date:string}):Promise<Project>{
 if(USE_MOCKS||!supabase){const item:Project={id:`local-${Date.now()}`,name:input.name,description:input.description,start_date:input.start_date,end_date:input.end_date,owner:'Líder',progress:0,status:'planned',tasks:[]};demoProjects.unshift(item);return item}
 const {data:session,error:authError}=await supabase.auth.getUser()
 if(authError||!session.user)throw new Error('La sesión expiró. Ingresá nuevamente.')
 const {data,error}=await supabase.from('projects').insert({name:input.name,description:input.description||null,start_date:input.start_date||null,end_date:input.end_date||null,owner_user_id:session.user.id,status:'planned'}).select('id,name,status').single()
 if(error)throw new Error(`No se pudo crear el proyecto: ${error.message}`)
 return {id:data.id,name:data.name,description:input.description,start_date:input.start_date,end_date:input.end_date,owner:session.user.email??'Responsable',owner_user_id:session.user.id,progress:0,status:data.status,tasks:[]}
}
export async function updateProject(projectId:string,input:{name:string;description:string;start_date:string;end_date:string;owner_user_id:string;status:Project['status']}):Promise<void>{
 if(USE_MOCKS||!supabase){const project=demoProjects.find(p=>p.id===projectId);if(!project)throw new Error('Proyecto no encontrado.');Object.assign(project,input,{owner:input.owner_user_id||project.owner});return}
 const {data,error}=await supabase.from('projects').update({name:input.name,description:input.description||null,start_date:input.start_date||null,end_date:input.end_date||null,owner_user_id:input.owner_user_id||null,status:input.status}).eq('id',projectId).select('id').maybeSingle()
 if(error)throw error
 if(!data)throw new Error('No se guardaron los cambios. Revisá tus permisos.')
}
export async function addProjectTask(projectId:string,input:{title:string;description:string;due_date:string;assignee_id:string;weight:number}):Promise<void>{
 if(USE_MOCKS||!supabase){const project=demoProjects.find(p=>p.id===projectId);if(!project)throw new Error('Proyecto no encontrado.');project.tasks.push({id:`local-${Date.now()}`,title:input.title,description:input.description,due_date:input.due_date,assignee:input.assignee_id||'Sin asignar',status:'pending',weight:input.weight});return}
 const {data,error}=await supabase.from('project_tasks').insert({project_id:projectId,title:input.title,description:input.description||null,due_date:input.due_date||null,weight:input.weight,status:'pending'}).select('id').single()
 if(error)throw error
 if(input.assignee_id){const {error:linkError}=await supabase.from('task_assignees').insert({task_id:data.id,user_id:input.assignee_id});if(linkError)throw new Error(`La tarea se creó, pero no se asignó: ${linkError.message}`)}
}
export async function updateProjectTask(taskId:string,changes:Partial<Pick<ProjectTask,'status'|'due_date'|'weight'>>):Promise<void>{
 if(USE_MOCKS||!supabase){const task=demoProjects.flatMap(p=>p.tasks).find(t=>t.id===taskId);if(task)Object.assign(task,changes);return}
 const {error}=await supabase.from('project_tasks').update(changes).eq('id',taskId)
 if(error)throw error
}
export async function updateProjectTaskDetails(taskId:string,input:{title:string;description:string;due_date:string;weight:number;assignee_id:string}):Promise<void>{
 if(USE_MOCKS||!supabase){const task=demoProjects.flatMap(project=>project.tasks).find(item=>item.id===taskId);if(!task)throw new Error('Tarea no encontrada.');Object.assign(task,{...input,assignee:input.assignee_id||'Sin asignar'});return}
 const {data,error}=await supabase.from('project_tasks').update({title:input.title,description:input.description||null,due_date:input.due_date||null,weight:input.weight}).eq('id',taskId).select('id').maybeSingle()
 if(error)throw error
 if(!data)throw new Error('No se guardó la tarea. Revisá tus permisos.')
 const {data:links,error:linkError}=await supabase.from('task_assignees').select('user_id').eq('task_id',taskId)
 if(linkError)throw new Error('La tarea se guardó, pero no se pudo consultar su responsable: '+linkError.message)
 if(links?.length===1&&links[0].user_id===input.assignee_id)return
 if(input.assignee_id&&!links?.some(link=>link.user_id===input.assignee_id)){const {error:assignError}=await supabase.from('task_assignees').insert({task_id:taskId,user_id:input.assignee_id});if(assignError)throw new Error('La tarea se guardó, pero no se pudo asignar: '+assignError.message)}
 if(links?.length){const query=supabase.from('task_assignees').delete().eq('task_id',taskId);const {error:deleteError}=input.assignee_id?await query.neq('user_id',input.assignee_id):await query;if(deleteError)throw new Error('La tarea se guardó, pero no se pudo quitar al responsable anterior: '+deleteError.message)}
}
export async function updateProjectStatus(projectId:string,status:Project['status']):Promise<void>{
 if(USE_MOCKS||!supabase){const p=demoProjects.find(p=>p.id===projectId);if(p)p.status=status;return}
 const {error}=await supabase.from('projects').update({status}).eq('id',projectId)
 if(error)throw error
}
export async function deleteProject(projectId:string):Promise<void>{
 if(USE_MOCKS||!supabase){const index=demoProjects.findIndex(p=>p.id===projectId);if(index<0)throw new Error('Proyecto no encontrado.');demoProjects.splice(index,1);return}
 const {data,error}=await supabase.from('projects').delete().eq('id',projectId).select('id').maybeSingle()
 if(error)throw error
 if(!data)throw new Error('No se eliminó el proyecto. Revisá los permisos de tu cuenta.')
}
