import { supabase } from '../lib/supabase'
import { USE_MOCKS } from '../lib/config'
import { demoYouth } from '../data/mock'
import type { MedicalProfile,YoungPerson } from '../types/domain'
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
 const {data:photo,error:photoError}=await supabase.from('young_people').select('photo_path').eq('id',id).single()
 if(photoError)throw photoError
 const {data:links,error:guardianError}=await supabase.from('young_person_guardians').select('guardian_id,guardians(full_name,phone)').eq('young_person_id',id).order('is_emergency_contact',{ascending:false}).limit(1)
 if(guardianError)throw guardianError
 const guardian=links?.[0]?.guardians as unknown as {full_name:string;phone:string|null}|undefined
 return {...data,photo_path:photo?.photo_path,guardian_name:guardian?.full_name,guardian_phone:guardian?.phone} as YoungPerson
}
export async function getYouthPhoto(path?:string):Promise<string|null>{
 if(!path||!supabase)return null
 const {data,error}=await supabase.storage.from('young-photos').createSignedUrl(path,3600)
 if(error)throw error
 return data.signedUrl
}
export async function uploadYouthPhoto(id:string,file:File):Promise<string>{
 if(!supabase)throw new Error('Almacenamiento no disponible')
 if(!file.type.startsWith('image/')||file.size>5*1024*1024)throw new Error('Elegí una imagen de hasta 5 MB.')
 const path=`${id}/profile-${Date.now()}.${file.type.split('/')[1]?.replace('jpeg','jpg')||'jpg'}`
 const {error}=await supabase.storage.from('young-photos').upload(path,file,{contentType:file.type})
 if(error)throw error
 return path
}
export async function getMedicalProfile(id:string):Promise<MedicalProfile|null>{
 if(USE_MOCKS||!supabase)return null
 const {data,error}=await supabase.from('medical_profiles').select('young_person_id,blood_type,allergies,medications,medication_reason,health_provider,insurance_member_number,relevant_conditions,surgeries,activity_restrictions,dietary_restrictions,emergency_notes').eq('young_person_id',id).maybeSingle()
 if(error)throw error
 return data as MedicalProfile|null
}
export async function updateYouth(id:string, changes:Partial<YoungPerson>):Promise<YoungPerson>{
 if(USE_MOCKS||!supabase){
  const index=demoYouth.findIndex(y=>y.id===id)
  if(index<0)throw new Error('Joven no encontrado.')
  demoYouth[index]={...demoYouth[index],...changes}
  return demoYouth[index]
 }
 const payload={first_name:changes.first_name,last_name:changes.last_name,birth_date:changes.birth_date,phone:changes.phone,address:changes.address,photo_path:changes.photo_path}
 const {data,error}=await supabase.from('young_people').update(payload).eq('id',id).select().single()
 if(error)throw error
 return data as YoungPerson
}
export async function updateGuardianPhone(id:string,name:string,phone:string):Promise<void>{
 if(USE_MOCKS||!supabase){const y=demoYouth.find(y=>y.id===id);if(y){y.guardian_name=name;y.guardian_phone=phone}return}
 const {data:links,error}=await supabase.from('young_person_guardians').select('guardian_id').eq('young_person_id',id).order('is_emergency_contact',{ascending:false}).limit(1)
 if(error)throw error
 const guardianId=links?.[0]?.guardian_id
 if(guardianId){const {error:updateError}=await supabase.from('guardians').update({full_name:name,phone}).eq('id',guardianId);if(updateError)throw updateError}
 else if(name||phone){const {data:guardian,error:createError}=await supabase.from('guardians').insert({full_name:name||'Tutor',phone}).select('id').single();if(createError)throw createError;const {error:linkError}=await supabase.from('young_person_guardians').insert({young_person_id:id,guardian_id:guardian.id,is_emergency_contact:true});if(linkError)throw linkError}
}
