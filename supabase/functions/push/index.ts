import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import webpush from 'npm:web-push@3.6.7'

const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})

Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{headers})
 if(request.method!=='POST')return reply({error:'Método no permitido'},405)
 const url=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
 if(!url||!serviceKey)return reply({error:'Falta configurar Supabase en la función.'},503)
 const jwt=request.headers.get('Authorization')?.replace(/^Bearer\s+/i,'')
 if(!jwt)return reply({error:'Sesión requerida.'},401)
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
 const {data:{user},error:authError}=await admin.auth.getUser(jwt)
 if(authError||!user)return reply({error:'Sesión inválida.'},401)
 let input:{action?:string;batchId?:string}
 try{input=await request.json()}catch{return reply({error:'Solicitud inválida.'},400)}
 const publicKey=Deno.env.get('VAPID_PUBLIC_KEY'),privateKey=Deno.env.get('VAPID_PRIVATE_KEY'),subject=Deno.env.get('VAPID_SUBJECT')
 if(input.action==='config')return publicKey&&privateKey&&subject?reply({publicKey}):reply({error:'El envío push todavía no está configurado.'},503)
 if(input.action!=='send'||!input.batchId||!/^[0-9a-f-]{36}$/i.test(input.batchId))return reply({error:'Solicitud inválida.'},400)
 const {data:profile,error:profileError}=await admin.from('app_users').select('role,active').eq('id',user.id).single()
 if(profileError||!profile?.active||!['admin','superadmin'].includes(profile.role))return reply({error:'No tenés permiso para enviar avisos.'},403)
 if(!publicKey||!privateKey||!subject)return reply({error:'El envío push todavía no está configurado.'},503)
 const {data:notices,error:noticeError}=await admin.from('notifications').select('id,title,body,target_user_id,created_at').eq('sent_by',user.id).contains('data',{batch_id:input.batchId}).gte('created_at',new Date(Date.now()-5*60_000).toISOString())
 if(noticeError)return reply({error:noticeError.message},500)
 if(!notices?.length)return reply({error:'No hay avisos recientes para este envío.'},404)
 const recipients=[...new Set(notices.map(item=>item.target_user_id).filter(Boolean))]
 const {data:devices,error:deviceError}=await admin.from('push_devices').select('id,user_id,token').in('user_id',recipients).eq('active',true)
 if(deviceError)return reply({error:deviceError.message},500)
 webpush.setVapidDetails(subject,publicKey,privateKey)
 let delivered=0,failed=0
 await Promise.all((devices??[]).map(async device=>{
  const notice=notices.find(item=>item.target_user_id===device.user_id)!
  try{
   const subscription=JSON.parse(device.token)
   await webpush.sendNotification(subscription,JSON.stringify({id:notice.id,title:notice.title,body:notice.body}),{TTL:60*60})
   delivered++
  }catch(error){
   failed++
   if([404,410].includes((error as {statusCode?:number}).statusCode??0))await admin.from('push_devices').update({active:false}).eq('id',device.id)
   console.error('No se pudo enviar a un dispositivo:',(error as Error).message)
  }
 }))
 return reply({recipients:recipients.length,devices:(devices??[]).length,delivered,failed})
})
