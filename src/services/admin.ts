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
export type NoticeDelivery={recipients:number;devices:number;delivered:number;failed:number;pushError?:string}
export async function sendNotice(userIds:string[],title:string,body:string):Promise<NoticeDelivery>{
 if(!userIds.length)throw new Error('No hay destinatarios activos.')
 const {data:{user},error:authError}=await client().auth.getUser()
 if(authError||!user)throw new Error('La sesión expiró. Ingresá nuevamente.')
 const batchId=crypto.randomUUID()
 const {error}=await client().from('notifications').insert(userIds.map(id=>({title,body,target_user_id:id,sent_by:user.id,data:{batch_id:batchId}})))
 if(error)throw error
 const {data,pushError}=await (async()=>{try{const response=await client().functions.invoke('push',{body:{action:'send',batchId}});return {data:response.data,pushError:response.error?.message}}catch(err){return {data:null,pushError:err instanceof Error?err.message:String(err)}}})()
 return {recipients:userIds.length,devices:data?.devices??0,delivered:data?.delivered??0,failed:data?.failed??0,pushError}
}
export async function enablePush():Promise<void>{
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw new Error('Este navegador no admite notificaciones push.')
 const permission=await Notification.requestPermission()
 if(permission!=='granted')throw new Error('Permití las notificaciones para recibir avisos en este dispositivo.')
 const {data,error}=await client().functions.invoke('push',{body:{action:'config'}})
 if(error||!data?.publicKey)throw new Error('El servicio push aún no está configurado en Supabase.')
 const {data:{user},error:authError}=await client().auth.getUser()
 if(authError||!user)throw new Error('La sesión expiró. Ingresá nuevamente.')
 const registration=await navigator.serviceWorker.ready
 let subscription=await registration.pushManager.getSubscription()
 if(!subscription){
  const key=String(data.publicKey).replace(/-/g,'+').replace(/_/g,'/')
  const bytes=Uint8Array.from(atob(key.padEnd(Math.ceil(key.length/4)*4,'=')),char=>char.charCodeAt(0))
  subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes.buffer as ArrayBuffer})
 }
 const {error:deviceError}=await client().from('push_devices').upsert({user_id:user.id,token:JSON.stringify(subscription),platform:'web',user_agent:navigator.userAgent,active:true,last_seen_at:new Date().toISOString()},{onConflict:'token'})
 if(deviceError)throw new Error('No se pudo registrar este teléfono: '+deviceError.message)
}
export async function pushEnabledOnThisDevice():Promise<boolean>{
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)||Notification.permission!=='granted')return false
 return Boolean(await (await navigator.serviceWorker.ready).pushManager.getSubscription())
}
export async function listMyNotices():Promise<UserNotice[]>{
 const {data:{user},error:authError}=await client().auth.getUser()
 if(authError||!user)throw new Error('La sesión expiró. Ingresá nuevamente.')
 const {data,error}=await client().from('notifications').select('id,title,body,created_at').eq('target_user_id',user.id).order('created_at',{ascending:false}).limit(30)
 if(error)throw error
 return data??[]
}
