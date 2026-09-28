import { useEffect,useMemo,useState } from 'react'
import { ChevronDown,Search } from 'lucide-react'
import { getAttendance,listAttendanceEvents,localDate,saveAttendance } from '../services/attendance'
import type { AttendanceEvent } from '../services/attendance'
import { listYouth } from '../services/youth'
import type { AttendanceStatus,YoungPerson } from '../types/domain'

export default function AttendancePage(){
 const [youth,setYouth]=useState<YoungPerson[]>([]),[events,setEvents]=useState<AttendanceEvent[]>([])
 const [date,setDate]=useState(localDate(new Date().toISOString())),[meeting,setMeeting]=useState<'sunday'|'rehearsal'>('sunday')
 const [status,setStatus]=useState<Record<string,AttendanceStatus>>({}),[query,setQuery]=useState(''),[group,setGroup]=useState('Todos')
 const [filter,setFilter]=useState<'all'|'present'|'absent'>('all'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false)
 useEffect(()=>{listYouth().then(setYouth).catch(e=>setError(`No se pudo cargar la lista de jóvenes: ${e.message}`));listAttendanceEvents().then(setEvents).catch(e=>setError(`No se pudieron cargar las fechas: ${e.message}`))},[])
 const event=events.find(e=>e.kind===meeting&&localDate(e.starts_at)===date)
 useEffect(()=>{let active=true;setStatus({});setNotice('');if(event)getAttendance(event.id).then(rows=>{if(active)setStatus(rows)}).catch(e=>{if(active)setError(`No se pudo consultar la asistencia: ${e.message}`)});return()=>{active=false}},[event?.id,date,meeting])
 const groups=['Todos',...new Set(youth.map(y=>y.group_name).filter((name):name is string=>Boolean(name)))]
 const attendees=youth.filter(y=>group==='Todos'||y.group_name===group)
 const visible=useMemo(()=>attendees.filter(y=>`${y.first_name} ${y.last_name}`.toLowerCase().includes(query.toLowerCase())).filter(y=>filter==='all'||(filter==='present'?status[y.id]==='present':status[y.id]!=='present')),[attendees,query,filter,status])
 const present=attendees.filter(y=>status[y.id]==='present').length
 async function save(){setSaving(true);setError('');setNotice('');try{
  if(!navigator.onLine)throw new Error('Necesitás conexión para guardar la asistencia.')
  const entries=Object.fromEntries(attendees.map(y=>[y.id,status[y.id]??'absent'])) as Record<string,AttendanceStatus>
  if(!attendees.length)throw new Error('No hay jóvenes en el grupo seleccionado.')
  const savedEvent=await saveAttendance(date,meeting,event,entries)
  if(!event)setEvents(list=>[savedEvent,...list]);setStatus(previous=>({...previous,...entries}));setNotice(`Asistencia guardada: ${formatDate(date)} · ${group}.`)
 }catch(e){setError(e instanceof Error?e.message:'No se pudo guardar la asistencia.')}finally{setSaving(false)}}
 const meetingLabel=meeting==='sunday'?'Domingo · Grupo Intermedio':'Sábado · Ensayo del Coro Intermedio'
 const formatDate=(day:string)=>day.slice(8,10)+'/'+day.slice(5,7)
 return <><div className="page-title"><div><h1>Tomar asistencia</h1><span>{meetingLabel} · {formatDate(date)}</span></div><div className="pill">{present} / {attendees.length}</div></div>
 <div className="segmented"><button className={meeting==='sunday'?'active':''} onClick={()=>setMeeting('sunday')}>Domingo</button><button className={meeting==='rehearsal'?'active':''} onClick={()=>setMeeting('rehearsal')}>Sábado · Ensayo</button></div>
 <label className="field-label group-filter">Fecha de asistencia<input className="date-control" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
 <label className="field-label group-filter">Grupo<span className="select-wrap"><select value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(name=><option key={name}>{name}</option>)}</select><ChevronDown size={20} aria-hidden="true"/></span></label>
 {error&&<div className="error-box" role="alert">{error}</div>}
 <div className="search-box"><Search size={19}/><input placeholder="Buscar joven…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 <div className="segmented"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Todos ({attendees.length})</button><button className={filter==='present'?'active':''} onClick={()=>setFilter('present')}>Presentes</button><button className={filter==='absent'?'active':''} onClick={()=>setFilter('absent')}>Ausentes</button></div>
 <div className="list-stack">{visible.map(y=><div className="person-row" key={y.id}><div className="avatar">{y.first_name[0]}{y.last_name[0]}</div><div className="grow"><strong>{y.first_name} {y.last_name}</strong><small>{y.group_name??'Sin grupo asignado'}</small></div><button aria-label={`Cambiar asistencia de ${y.first_name} ${y.last_name}`} className={`toggle ${status[y.id]==='present'?'on':''}`} onClick={()=>setStatus(s=>({...s,[y.id]:s[y.id]==='present'?'absent':'present'}))}><span/></button></div>)}</div>
 <button className="primary-btn sticky-action" disabled={saving||!date||!attendees.length} onClick={save}>{saving?'Guardando…':'Guardar asistencia'}</button>{notice&&<div className="success-box" role="status">{notice}</div>}</>
}
