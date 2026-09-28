import { useEffect,useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DatePicker from '../components/DatePicker'
import TimePicker from '../components/TimePicker'
import { createEvent,listUpcomingEvents } from '../services/events'
import { useAuth } from '../state/AuthContext'
import type { EventItem } from '../types/domain'
export default function CalendarPage(){
 const [events,setEvents]=useState<EventItem[]>([]),[adding,setAdding]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 const [params]=useSearchParams(),{user}=useAuth();const canWrite=!!user&&(user.role==='admin'||user.role==='superadmin'||user.permissions.includes('events.write'))
 useEffect(()=>{listUpcomingEvents().then(setEvents).catch(e=>setError(`No se pudo cargar el cronograma: ${e.message}`)).finally(()=>setLoading(false))},[])
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError('');const form=new FormData(e.currentTarget),date=String(form.get('date')??''),time=String(form.get('time')??'');if(!date||!time){setError('Seleccioná fecha y hora.');return}const start=new Date(`${date}T${time}:00`);if(Number.isNaN(start.getTime())){setError('La fecha u hora no es válida.');return}
 setSaving(true);try{const item=await createEvent({title:String(form.get('title')).trim(),kind:String(form.get('kind')) as EventItem['kind'],starts_at:start.toISOString(),location:String(form.get('location')??'').trim(),description:String(form.get('description')??'').trim()});setEvents(items=>[...items,item].sort((a,b)=>a.starts_at.localeCompare(b.starts_at)));setAdding(false)}catch(err){setError(`No se pudo crear el evento: ${err instanceof Error?err.message:String(err)}`)}finally{setSaving(false)}}
 return <><div className="page-title"><div><h1>Cronograma</h1><span>Clases y actividades programadas</span></div>{canWrite&&<button className="small-primary" onClick={()=>setAdding(true)}>+ Nuevo</button>}</div>
 {error&&<div className="error-box" role="alert">{error}</div>}
 {adding&&<form className="form-card form-grid" onSubmit={submit}><label className="span2">Nombre del evento<input name="title" required autoFocus/></label><label>Tipo<select name="kind" defaultValue="special"><option value="sunday">Reunión GI</option><option value="rehearsal">Ensayo</option><option value="class">Clase</option><option value="meeting">Reunión</option><option value="special">Actividad especial</option><option value="camp">Campamento</option><option value="other">Otro</option></select></label><DatePicker name="date" label="Fecha"/><TimePicker name="time" label="Hora"/><label>Lugar<input name="location"/></label><label className="span2">Descripción<textarea name="description"/></label><div className="span2 quick-grid"><button type="button" className="secondary-btn" onClick={()=>setAdding(false)}>Cancelar</button><button className="primary-btn" disabled={saving}>{saving?'Guardando…':'Crear evento'}</button></div></form>}
 <div className="timeline">{events.map(e=><div id={`evento-${e.id}`} className={`timeline-item ${params.get('evento')===e.id?'selected-event':''}`} key={e.id}><div className="event-date">{new Date(e.starts_at).toLocaleDateString('es-AR',{day:'numeric',timeZone:'America/Argentina/Buenos_Aires'})}</div><div><strong>{e.title}</strong><p>{new Date(e.starts_at).toLocaleString('es-AR',{dateStyle:'full',timeStyle:'short',timeZone:'America/Argentina/Buenos_Aires'})}</p>{e.location&&<small>{e.location}</small>}</div></div>)}</div>
 {!loading&&!events.length&&<div className="empty-card">No hay eventos próximos. {canWrite?'Tocá «+ Nuevo» para agregar uno.':''}</div>}</>
}
