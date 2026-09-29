import { FormEvent,useEffect,useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject,listProjects } from '../services/projects'
import type { Project } from '../types/domain'
import DatePicker from '../components/DatePicker'
import { localDate } from '../services/attendance'
export default function ProjectsPage(){
 const [items,setItems]=useState<Project[]>([]),[adding,setAdding]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('')
 const nav=useNavigate()
 useEffect(()=>{listProjects().then(setItems).catch(e=>setError(`No se pudieron cargar los proyectos: ${e.message}`))},[])
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError('');const d=new FormData(e.currentTarget)
  try{const item=await createProject({name:String(d.get('name')).trim(),description:String(d.get('description')).trim(),start_date:String(d.get('start_date')),end_date:String(d.get('end_date'))});setItems(list=>[item,...list]);setAdding(false);nav(`/proyectos/${item.id}`)}catch(e){setError(e instanceof Error?e.message:'No se pudo crear el proyecto.')}finally{setSaving(false)}
 }
 return <><div className="page-title"><div><h1>Proyectos</h1><span>Actividades especiales</span></div><button className="small-primary" onClick={()=>setAdding(true)}>+ Nuevo</button></div>
 {error&&<div className="error-box" role="alert">{error}</div>}
 {adding&&<form className="form-card form-grid" onSubmit={submit}><label className="span2">Nombre del proyecto<input name="name" autoFocus required/></label><label className="span2">Descripción<textarea name="description"/></label><DatePicker name="start_date" label="Inicio"/><DatePicker name="end_date" label="Fin"/><div className="span2 quick-grid"><button type="button" className="secondary-btn" onClick={()=>setAdding(false)}>Cancelar</button><button className="primary-btn" disabled={saving}>{saving?'Creando…':'Crear proyecto'}</button></div></form>}
 <div className="list-stack">{items.map(p=><button key={p.id} className="project-card clickable" onClick={()=>nav(`/proyectos/${p.id}`)}><div className="row-between"><strong>{p.name}</strong><span>{p.progress}%</span></div><small>Responsable: {p.owner} · {p.tasks.filter(task=>task.status==='done').length}/{p.tasks.length} tareas</small><small>Fin previsto: {p.end_date?p.end_date.split('-').reverse().join('/'):'Sin fecha'}{p.tasks.some(task=>task.status!=='done'&&task.due_date&&task.due_date<localDate(new Date().toISOString()))?' · Hay tareas vencidas':''}</small><div className="progress"><span style={{width:`${p.progress}%`}}/></div></button>)}</div></>
}
