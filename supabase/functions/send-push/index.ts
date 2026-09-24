// FCM HTTP v1 pendiente de credenciales Firebase.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
serve(async(req)=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405})
 const payload=await req.json()
 return Response.json({ok:false,status:'not_configured',message:'Configurar Firebase/FCM antes de habilitar push.',received:payload},{status:501})
})
