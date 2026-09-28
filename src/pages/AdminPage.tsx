import { useEffect,useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from '../components/DatePicker'
import { instructors } from '../data/mock'
import { createYouth,listGroups } from '../services/youth'

export default function AdminPage(){
 const nav=useNavigate(),[groups,setGroups]=useState<{id:string;name:string}[]>([]),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 useEffect(()=>{listGroups().then(setGroups).catch(e=>setError(`No se pudieron cargar los grupos: ${e.message}`))},[])
 async function addYouth(e:FormEvent<HTMLFormElement>){e.preventDefault();setError('');const form=new FormData(e.currentTarget),birth_date=String(form.get('birth_date')??'');if(!birth_date){setError('Seleccioná la fecha de nacimiento.');return}setSaving(true)
 try{const id=await createYouth({first_name:String(form.get('first_name')??'').trim(),last_name:String(form.get('last_name')??'').trim(),birth_date,phone:String(form.get('phone')??'').trim(),group_id:String(form.get('group_id')??'')});nav(`/jovenes/${id}`)}catch(err){setError(`No se pudo guardar el joven: ${err instanceof Error?err.message:String(err)}`)}finally{setSaving(false)}}
 return <><div className="page-title"><div><h1>Panel de admin</h1><span>Gestión general</span></div></div><section className="form-card"><h2>Alta de joven</h2>{error&&<div className="error-box" role="alert">{error}</div>}<form onSubmit={addYouth} className="form-grid"><label>Nombre<input name="first_name" placeholder="Nombre" required/></label><label>Apellido<input name="last_name" placeholder="Apellido" required/></label><DatePicker name="birth_date" label="Fecha de nacimiento"/><label>Grupo<select name="group_id"><option value="">Sin asignar</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label className="span2">Teléfono<input name="phone" type="tel" placeholder="+54 9 ..."/></label><button className="primary-btn span2" disabled={saving}>{saving?'Guardando…':'Guardar joven'}</button></form></section><section className="form-card"><h2>Instructores autorizados</h2><div className="list-stack">{instructors.map((name,index)=><div className="person-row" key={name}><div className="avatar">{name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div className="grow"><strong>{name}</strong><small>{index===0?'Administrador':'Instructor'} · Responsable de tareas</small></div></div>)}</div></section></>
}
