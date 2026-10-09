import { supabase } from '../lib/supabase'
export type Movement={id:string;transaction_date:string;kind:'income'|'expense';category:string;concept:string;amount:number;account:string;project_id:string|null;receipt_path:string|null;notes:string|null;created_by:string;created_by_name:string;created_at:string;voided_at:string|null;voided_by_name:string|null;void_reason:string|null}
export type MovementInput=Pick<Movement,'transaction_date'|'kind'|'category'|'concept'|'amount'|'account'|'project_id'|'notes'>
export const incomeCategories=['Donación','Ofrendas','Recaudación','Saldo inicial','Movimiento','Otros']
export const expenseCategories=['Materiales','Alimentos','Transporte','Eventos','Movimiento','Otros']
export const accounts=['Efectivo','Banco','Billetera virtual']
function client(){if(!supabase)throw new Error('Supabase no está configurado.');return supabase}
export async function listMovements():Promise<Movement[]>{
 const rows:Movement[]=[]
 // Supabase limita cada respuesta: se recorre todo el libro para calcular el saldo real.
 for(let start=0;;start+=500){const {data,error}=await client().from('finance_transactions').select('*').order('transaction_date',{ascending:false}).order('created_at',{ascending:false}).order('id').range(start,start+499);if(error)throw error;rows.push(...(data??[]));if((data?.length??0)<500)break}
 return rows
}
export async function registerMovement(input:MovementInput,file:File|null,id=crypto.randomUUID()){
 const c=client(),{data:{user},error:authError}=await c.auth.getUser()
 if(authError||!user)throw new Error('Ingresá nuevamente para registrar el movimiento.')
 let receipt_path:string|null=null
 if(file&&file.size){
  const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'}
  if(!extensions[file.type]||file.size>10485760)throw new Error('Adjuntá una imagen JPG, PNG, WebP o un PDF de hasta 10 MB.')
  receipt_path=`${user.id}/${id}.${extensions[file.type]}`
  const {error}=await c.storage.from('finance-receipts').upload(receipt_path,file,{upsert:false,contentType:file.type});if(error)throw new Error('No se pudo subir el comprobante: '+error.message)
 }
 const {error}=await c.from('finance_transactions').insert({...input,id,receipt_path,created_by:user.id,created_by_name:''})
 if(error){
  // Un fallo de red puede ocultar un guardado exitoso. No borrar su comprobante.
  const {data:existing,error:checkError}=await c.from('finance_transactions').select('id').eq('id',id).maybeSingle()
  if(existing)return
  if(receipt_path&&!checkError)await c.storage.from('finance-receipts').remove([receipt_path])
  throw new Error('No se pudo confirmar el guardado. Actualizá la lista antes de intentar nuevamente. '+error.message)
 }
}
export async function voidMovement(id:string,reason:string){const {error}=await client().rpc('void_finance_transaction',{transaction_id:id,reason});if(error)throw error}
export async function receiptUrl(path:string){const {data,error}=await client().storage.from('finance-receipts').createSignedUrl(path,300);if(error)throw error;return data.signedUrl}
