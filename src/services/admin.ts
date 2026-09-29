import { supabase } from '../lib/supabase'

export type AdminUser={id:string;full_name:string;email:string;role:string;phone:string|null;active:boolean}
export type UserNotice={id:string;title:string;body:string;created_at:string}

function client(){if(!supabase)throw new Error('Supabase no está configurado.');return supabase}

export async function listAdminUsers():Promise<AdminUser[]>{
 const {data,error}=await client().from('app_users').select('id,full_name,email,role,phone,active').order('full_name')
 if(error)throw error
 return data??[]
}
export async function saveAdminUser(id:string,changes:{full_name:string;phone:string}){
 const {data,error}=await client().from('app_users').update({full_name:changes.full_name.trim(),phone:changes.phone.trim()||null}).eq('id',id).select('id').maybeSingle()
 if(error)throw error
 if(!data)throw new Error('No se guardaron los datos. Revisá los permisos.')
}
export async function sendNotice(userIds:string[],title:string,body:string){
 if(!userIds.length)throw new Error('No hay destinatarios activos.')
 const {data:{user},error:authError}=await client().auth.getUser()
 if(authError||!user)throw new Error('La sesión expiró. Ingresá nuevamente.')
 const {error}=await client().from('notifications').insert(userIds.map(id=>({title,body,target_user_id:id,sent_by:user.id})))
 if(error)throw error
}
export async function listMyNotices():Promise<UserNotice[]>{
 const {data:{user},error:authError}=await client().auth.getUser()
 if(authError||!user)throw new Error('La sesión expiró. Ingresá nuevamente.')
 const {data,error}=await client().from('notifications').select('id,title,body,created_at').eq('target_user_id',user.id).order('created_at',{ascending:false}).limit(30)
 if(error)throw error
 return data??[]
}
