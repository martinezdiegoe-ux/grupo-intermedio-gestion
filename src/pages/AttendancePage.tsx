import { useEffect,useMemo,useState } from 'react'
import { ChevronDown,Search } from 'lucide-react'
import { getAttendance,listAttendanceEvents,saveAttendance } from '../services/attendance'
import type { AttendanceEvent } from '../services/attendance'
import { listYouth } from '../services/youth'
import { queueAttendance } from '../services/offlineQueue'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { USE_MOCKS } from '../lib/config'
import type { AttendanceStatus,YoungPerson } from '../types/domain'
export default function AttendancePage(){
 const [youth,setYouth]=useState<YoungPerson[]>([]),[loadError,setLoadError]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState<'all'|'present'|'absent'>('all'),[group,setGroup]=useState('Todos'),[meeting,setMeeting]=useState<'sunday'|'rehearsal'>('sunday'),[status,setStatus]=useState<Record<string,AttendanceStatus>>({}),[saved,setSaved]=useState(''),[events,setEvents]=useState<AttendanceEvent[]>([]),[eventId,setEventId]=useState(''),[loadingAttendance,setLoadingAttendance]=useState(false); const online=useOnlineStatus()
 useEffect(()=>{listYouth().then(list=>{setYouth(list);if(USE_MOCKS)setStatus(Object.fromEntries(list.map((y,i)=>[y.id,i%4===1?'absent':'present'])) as Record<string,AttendanceStatus>)}).catch(()=>setLoadError('No se pudo cargar la lista de jóvenes.'))},[])
 useEffect(()=>{listAttendanceEvents().then(items=>{setEvents(items);setEventId(items[0]?.id??'')}).catch(()=>setLoadError('No se pudieron cargar las fechas de asistencia.'))},[])
 useEffect(()=>{if(!eventId)return;setLoadingAttendance(true);getAttendance(eventId).then(setStatus).catch(()=>setLoadError('No se pudo cargar la asistencia de esa fecha.')).finally(()=>setLoadingAttendance(false))},[eventId])
 const groups=['Todos','Elegidos','León de Judá','Guerreros de Gedeón','Valientes de David']
 const visible=useMemo(()=>youth.filter(y=>{const n=`${y.first_name} ${y.last_name}`.toLowerCase();if(!n.includes(query.toLowerCase()))return false;if(group!=='Todos'&&y.group_name!==group)return false;if(filter==='present'&&status[y.id]!=='present')return false;if(filter==='absent'&&status[y.id]!=='absent')return false;return true}),[youth,query,group,filter,status])
 const present=Object.values(status).filter(s=>s==='present').length
 async function save(){if(!eventId){setSaved('Seleccioná una fecha de asistencia.');return}try{if(!online){for(const [young_person_id,s] of Object.entries(status))await queueAttendance({id:`${eventId}:${young_person_id}`,event_id:eventId,young_person_id,status:s,updated_at:new Date().toISOString()});setSaved('Guardado en el dispositivo. Se sincronizará al recuperar Internet.');return}await saveAttendance(eventId,status);setSaved('Asistencia guardada.')}catch{setSaved('No se pudo guardar la asistencia.')}}
 const selectedEvent=events.find(event=>event.id===eventId);const formatDate=(date:string)=>new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(date));
 const meetingLabel=meeting==='sunday'?'Domingo · Grupo Intermedio':'Sábado · Ensayo del Coro Intermedio'
 return <><div className="page-title"><div><h1>Tomar asistencia</h1><span>{meetingLabel}{selectedEvent?` · ${formatDate(selectedEvent.starts_at)}`:''}</span></div><div className="pill">{present} / {youth.length}</div></div>
 <div className="segmented"><button className={meeting==='sunday'?'active':''} onClick={()=>{setMeeting('sunday');setEventId(events.find(e=>e.kind==='sunday')?.id??'')}}>Domingo</button><button className={meeting==='rehearsal'?'active':''} onClick={()=>{setMeeting('rehearsal');setEventId(events.find(e=>e.kind==='rehearsal')?.id??'')}}>Sábado · Ensayo</button></div>
 <label className="field-label group-filter">Fecha de asistencia<span className="select-wrap"><select value={eventId} onChange={e=>{setEventId(e.target.value);setSaved('')}}><option value="">{events.length?'Seleccionar fecha':'Sin encuentros registrados'}</option>{events.filter(e=>e.kind===meeting).map(e=><option key={e.id} value={e.id}>{formatDate(e.starts_at)} · {e.title}</option>)}</select><ChevronDown size={20} aria-hidden="true"/></span></label>
 <label className="field-label group-filter">Grupo<span className="select-wrap"><select value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(name=><option key={name}>{name}</option>)}</select><ChevronDown size={20} aria-hidden="true"/></span></label>
 {loadError&&<div className="error-box" role="alert">{loadError}</div>}
 <div className="search-box"><Search size={19}/><input placeholder="Buscar joven…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 <div className="segmented"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Todos ({youth.length})</button><button className={filter==='present'?'active':''} onClick={()=>setFilter('present')}>Presentes</button><button className={filter==='absent'?'active':''} onClick={()=>setFilter('absent')}>Ausentes</button></div>
 <div className="list-stack">{visible.map(y=><div className="person-row" key={y.id}><div className="avatar">{y.first_name[0]}{y.last_name[0]}</div><div className="grow"><strong>{y.first_name} {y.last_name}</strong><small>{y.group_name??'Sin grupo asignado'}</small></div><button aria-label={`Cambiar asistencia de ${y.first_name} ${y.last_name}`} className={`toggle ${status[y.id]==='present'?'on':''}`} onClick={()=>setStatus(s=>({...s,[y.id]:s[y.id]==='present'?'absent':'present'}))}><span/></button></div>)}</div>
 <button className="primary-btn sticky-action" disabled={!eventId||loadingAttendance} onClick={save}>Guardar asistencia</button>{saved&&<div className="success-box">{saved}</div>}</>
}
