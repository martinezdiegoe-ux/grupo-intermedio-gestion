import { useEffect,useRef,useState } from 'react'
import '../budget.css'
import type { FormEvent } from 'react'
import { Download,Paperclip,Plus,Wallet,X } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import AppSelect from '../components/AppSelect'
import DatePicker from '../components/DatePicker'
import { accounts,expenseCategories,incomeCategories,listMovements,receiptUrl,registerMovement,voidMovement } from '../services/finance'
import type { Movement,MovementInput } from '../services/finance'
import { csvCell,parseAmount,summarize } from '../services/financeMath'
import { listProjects } from '../services/projects'
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
const money=(n:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:2}).format(n)
const dateLabel=(value:string)=>value.split('-').reverse().join('/')
const options=(values:string[])=>values.map(value=>({value,label:value}))
const message=(e:unknown)=>e instanceof Error?e.message:String(e)
export default function BudgetPage(){
 const {user}=useAuth(),canWrite=user?.role==='superadmin'||user?.role==='admin'
 const [rows,setRows]=useState<Movement[]>([]),[projects,setProjects]=useState<{id:string;name:string}[]>([])
 const [loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false)
 const [adding,setAdding]=useState(false),[kind,setKind]=useState<'income'|'expense'>('income'),[category,setCategory]=useState('Donación'),[account,setAccount]=useState('Efectivo'),[project,setProject]=useState('')
 const [month,setMonth]=useState(today().slice(0,7)),[filterKind,setFilterKind]=useState(''),[filterAccount,setFilterAccount]=useState(''),[query,setQuery]=useState(''),[showVoided,setShowVoided]=useState(false)
 const [cancelRow,setCancelRow]=useState<Movement|null>(null),[receipt,setReceipt]=useState<{url:string;path:string}|null>(null)
 const saving=useRef(false),fileRef=useRef<HTMLInputElement>(null),[fileName,setFileName]=useState('')
 async function refresh(){setLoading(true);setError('');try{setRows(await listMovements());setLoaded(true);return true}catch(e){setError('No se pudo actualizar el presupuesto. '+message(e));return false}finally{setLoading(false)}}
 useEffect(()=>{void refresh();listProjects().then(setProjects).catch(()=>{})},[])
 const months=[...new Set([today().slice(0,7),...rows.map(row=>row.transaction_date.slice(0,7))])].sort().reverse()
 const filtered=rows.filter(row=>(!month||row.transaction_date.startsWith(month))&&(!filterKind||row.kind===filterKind)&&(!filterAccount||row.account===filterAccount)&&(showVoided||!row.voided_at)&&(!query||[row.concept,row.category,row.notes,row.created_by_name,projects.find(p=>p.id===row.project_id)?.name].join(' ').toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))))
 const global=summarize(rows),period=summarize(filtered)
 function openForm(){setKind('income');setCategory('Donación');setAccount('Efectivo');setProject('');setFileName('');setAdding(true);setNotice('')}
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(saving.current)return
  const form=e.currentTarget,data=new FormData(form);setError('');setNotice('')
  const transaction_date=String(data.get('transaction_date'))
  try{
   if(!transaction_date||transaction_date>today())throw new Error('Seleccioná una fecha válida, hasta hoy.')
   const concept=String(data.get('concept')??'').trim();if(concept.length<3)throw new Error('El concepto debe tener al menos 3 caracteres.')
   const input:MovementInput={transaction_date,kind,category,concept,amount:parseAmount(String(data.get('amount'))),account,project_id:project||null,notes:String(data.get('notes')??'').trim()||null}
   const attachment=fileRef.current?.files?.[0]??null
   saving.current=true;setBusy(true)
   await registerMovement(input,attachment);setAdding(false)
   const ok=await refresh();setNotice(ok?'Movimiento registrado. El saldo fue actualizado.':'Movimiento registrado. Actualizá la lista para ver el saldo actualizado.')
  }catch(e){setError(message(e))}finally{saving.current=false;setBusy(false)}
 }
 async function cancel(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!cancelRow||saving.current)return;const reason=String(new FormData(e.currentTarget).get('reason')??'').trim();setError('');setNotice('');saving.current=true;setBusy(true);try{await voidMovement(cancelRow.id,reason);setCancelRow(null);const ok=await refresh();setNotice(ok?'Movimiento anulado. Se conserva en el historial y ya no afecta el saldo.':'Movimiento anulado. Actualizá la lista para ver el saldo actualizado.')}catch(e){setError(message(e))}finally{saving.current=false;setBusy(false)}}
 async function viewReceipt(row:Movement){if(!row.receipt_path)return;setError('');try{setReceipt({url:await receiptUrl(row.receipt_path),path:row.receipt_path})}catch(e){setError('No se pudo abrir el comprobante. '+message(e))}}
 function exportCsv(){
  const headings=['ID','Fecha','Tipo','Categoría','Concepto','Importe ARS','Cuenta','Proyecto','Responsable','Registrado','Comprobante','Observaciones','Estado','Anulado por','Motivo de anulación','Fecha de anulación']
  const lines=[headings,...filtered.map(row=>[row.id,dateLabel(row.transaction_date),row.kind==='income'?'Ingreso':'Egreso',row.category,row.concept,Number(row.amount).toFixed(2).replace('.',','),row.account,projects.find(p=>p.id===row.project_id)?.name??row.project_id??'',row.created_by_name,row.created_at,row.receipt_path?'Sí':'No',row.notes,row.voided_at?'Anulado':'Vigente',row.voided_by_name,row.void_reason,row.voided_at])]
  const blob=new Blob(['\uFEFF'+lines.map(line=>line.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`presupuesto-GI-${month||'completo'}-${today()}.csv`;a.click();URL.revokeObjectURL(url)
 }
 return <div className="budget-page">
  <div className="page-title"><div><h1>Presupuesto</h1><span>Fondos del Grupo Intermedio · pesos argentinos</span></div>{canWrite&&<button className="small-primary" disabled={loading||!loaded||!!error||busy} onClick={openForm}><Plus size={17}/> Movimiento</button>}</div>
  {error&&<div className="error-box" role="alert">{error}{!loaded&&<p>Si es la primera apertura, falta habilitar las tablas del módulo en Supabase.</p>}</div>}
  {notice&&<div className="success-box" role="status">{notice}</div>}
  <div className="budget-toolbar"><p className="muted">{canWrite?'Podés registrar y anular movimientos.':'Consulta de movimientos y comprobantes.'}</p><button className="text-btn" disabled={loading||busy} onClick={()=>void refresh()}>{loading?'Actualizando…':'Actualizar'}</button></div>
  {loaded&&<>
   <div className="budget-totals"><div className={'budget-total balance '+(global.balance<0?'negative':'')}><span><Wallet size={18}/> {global.balance<0?'Saldo en déficit':'Saldo disponible'}</span><strong>{money(global.balance)}</strong><small>Saldo general de todos los movimientos vigentes</small></div><div className="budget-total"><span>Ingresos acumulados</span><strong className="good">{money(global.income)}</strong></div><div className="budget-total"><span>Egresos acumulados</span><strong className="expense-amount">{money(global.expense)}</strong></div></div>
   <div className="budget-accounts">{accounts.map(name=><div key={name}><span>{name}</span><strong>{money(summarize(rows.filter(row=>row.account===name)).balance)}</strong></div>)}</div>
   <p className="field-hint">Cargá el dinero existente como «Saldo inicial». Para mover fondos entre cuentas, registrá un egreso en la cuenta de origen y un ingreso por el mismo importe en la de destino, ambos con categoría «Movimiento».</p>
   {adding&&<form className="form-card form-grid budget-form" onSubmit={submit} aria-label="Nuevo movimiento">
    <h2 className="span2">Nuevo movimiento</h2>
    <div><span className="field-label">Tipo</span><AppSelect label="Tipo" value={kind} options={[{value:'income',label:'Ingreso'},{value:'expense',label:'Egreso'}]} onChange={value=>{const next=value as 'income'|'expense';setKind(next);setCategory(next==='income'?'Donación':'Materiales')}}/></div>
    <DatePicker name="transaction_date" label="Fecha" initialValue={today()}/>
    <div><span className="field-label">Categoría</span><AppSelect label="Categoría" value={category} options={options(kind==='income'?incomeCategories:expenseCategories)} onChange={setCategory}/></div>
    <div><span className="field-label">Cuenta</span><AppSelect label="Cuenta" value={account} options={options(accounts)} onChange={setAccount}/></div>
    <label>Importe en pesos<input name="amount" inputMode="decimal" placeholder="Ej.: 15000,50" required maxLength={15}/><small className="field-hint">Sin separador de miles; hasta dos decimales.</small></label>
    <div><span className="field-label">Proyecto (opcional)</span><AppSelect label="Proyecto" value={project} options={[{value:'',label:'Sin proyecto'},...projects.map(p=>({value:p.id,label:p.name}))]} onChange={setProject}/></div>
    <label className="span2">{kind==='income'?'Motivo del ingreso':'Concepto del gasto'}<input name="concept" required minLength={3} maxLength={500} placeholder={kind==='income'?'Ej.: Ofrenda reunión del domingo':'Ej.: Compra de materiales para actividad'}/></label>
    <label className="span2">Observaciones (opcional)<textarea name="notes" maxLength={2000}/></label>
    <div className="span2 photo-field"><span>Comprobante (opcional)</span><input id="finance-receipt" className="photo-file-input" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setFileName(e.target.files?.[0]?.name??'')}/><label htmlFor="finance-receipt" className="photo-picker"><Paperclip size={18}/> Adjuntar foto o PDF</label><small>{fileName||'JPG, PNG, WebP o PDF · hasta 10 MB · acceso privado'}</small></div>
    <p className="span2 field-hint">Revisá los datos antes de guardar. Las correcciones se realizan anulando el registro y cargando uno nuevo.</p>
    <div className="span2 quick-grid"><button type="button" className="secondary-btn" disabled={busy} onClick={()=>setAdding(false)}>Cancelar</button><button className="primary-btn" disabled={busy}>{busy?'Guardando…':'Guardar movimiento'}</button></div>
   </form>}
   <section><div className="budget-toolbar"><h2>Movimientos</h2><button className="text-btn" disabled={!filtered.length||loading||!!error} onClick={exportCsv}><Download size={16}/> Exportar CSV</button></div>
    <div className="budget-filters"><AppSelect label="Período" value={month} options={[{value:'',label:'Todos los meses'},...months.map(m=>({value:m,label:new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(new Date(m+'-01T12:00:00'))}))]} onChange={setMonth}/><AppSelect label="Filtrar tipo" value={filterKind} options={[{value:'',label:'Ingresos y egresos'},{value:'income',label:'Ingresos'},{value:'expense',label:'Egresos'}]} onChange={setFilterKind}/><AppSelect label="Filtrar cuenta" value={filterAccount} options={[{value:'',label:'Todas las cuentas'},...options(accounts)]} onChange={setFilterAccount}/></div>
    <label className="search-box"><input aria-label="Buscar movimientos" placeholder="Buscar concepto, categoría, proyecto o responsable…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <label className="budget-check"><input type="checkbox" checked={showVoided} onChange={e=>setShowVoided(e.target.checked)}/> Mostrar también anulados</label>
    <div className="budget-period"><strong>Resumen de la selección</strong><span>Ingresos: {money(period.income)}</span><span>Egresos: {money(period.expense)}</span><span>Resultado: {money(period.balance)}</span><small>{filtered.length} registro(s). Los anulados no afectan los importes. El saldo general incluye todos los meses.</small></div>
    {!filtered.length?<div className="empty-card">No hay movimientos con estos filtros.</div>:<div className="list-stack">{filtered.map(row=><article className={'budget-movement '+(row.voided_at?'voided':'')} key={row.id}>
     <div className="row-between"><div><span className={'budget-kind '+row.kind}>{row.kind==='income'?'Ingreso':'Egreso'}{row.voided_at?' · Anulado':''}</span><h3>{row.concept}</h3></div><strong className={row.kind==='income'?'good':'expense-amount'}>{row.kind==='income'?'+':'−'}{money(Number(row.amount))}</strong></div>
     <p>{dateLabel(row.transaction_date)} · {row.category} · {row.account}</p>
     {row.project_id&&<p>Proyecto: {projects.find(p=>p.id===row.project_id)?.name??'Proyecto vinculado'}</p>}
     {row.notes&&<p className="budget-notes">{row.notes}</p>}
     <small>Registrado por {row.created_by_name} · {new Date(row.created_at).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})}</small>
     {row.voided_at&&<p className="budget-void-reason">Anulado por {row.voided_by_name} · {new Date(row.voided_at).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})}<br/>Motivo: {row.void_reason}</p>}
     <div className="budget-actions">{row.receipt_path?<button className="text-btn" onClick={()=>void viewReceipt(row)}><Paperclip size={16}/> Ver comprobante</button>:<small>Sin comprobante adjunto</small>}{canWrite&&!row.voided_at&&<button className="delete-link" disabled={busy||loading||!!error} onClick={()=>setCancelRow(row)}>Anular</button>}</div>
    </article>)}</div>}
   </section>
  </>}
  {cancelRow&&<div className="dialog-backdrop"><form className="form-card notice-dialog form-grid" role="dialog" aria-modal="true" aria-labelledby="void-title" onSubmit={cancel}><h2 className="span2" id="void-title">Anular movimiento</h2><p className="span2">{cancelRow.concept} · {money(Number(cancelRow.amount))}. Dejará de afectar el saldo y se conservará en el historial.</p><label className="span2">Motivo de anulación<textarea name="reason" autoFocus required minLength={3} maxLength={500}/></label><div className="span2 quick-grid"><button type="button" className="secondary-btn" disabled={busy} onClick={()=>setCancelRow(null)}>Volver</button><button className="danger-btn" disabled={busy}>{busy?'Anulando…':'Confirmar anulación'}</button></div></form></div>}
  {receipt&&<div className="dialog-backdrop"><div className="form-card notice-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-title"><div className="row-between"><h2 id="receipt-title">Comprobante</h2><button className="icon-btn" aria-label="Cerrar comprobante" onClick={()=>setReceipt(null)}><X size={20}/></button></div>{!receipt.path.endsWith('.pdf')&&<img className="budget-receipt" src={receipt.url} alt="Comprobante del movimiento"/>}<a className="budget-receipt-link" href={receipt.url} target="_blank" rel="noopener noreferrer">Abrir comprobante en otra pestaña</a><p className="muted">El acceso temporal vence a los 5 minutos. Podés abrirlo nuevamente desde el movimiento.</p></div></div>}
 </div>
}
