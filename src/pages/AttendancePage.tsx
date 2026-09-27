import { useEffect,useMemo,useState } from 'react'
import { ChevronDown,Search } from 'lucide-react'
import { listYouth } from '../services/youth'
import { queueAttendance } from '../services/offlineQueue'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { USE_MOCKS } from '../lib/config'
import type { AttendanceStatus,YoungPerson } from '../types/domain'
export default function AttendancePage(){
 const [youth,setYouth]=useState<YoungPerson[]>([]),[loadError,setLoadError]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState<'all'|'present'|'absent'>('all'),[group,setGroup]=useState('Todos'),[meeting,setMeeting]=useState<'sunday'|'rehearsal'>('sunday'),[status,setStatus]=useState<Record<string,AttendanceStatus>>({}),[saved,setSaved]=useState('');const online=useOnlineStatus()
 useEffect(()=>{listYouth().then(list=>{setYouth(list);if(USE_MOCKS)setStatus(Object.fromEntries(list.map((y,i)=>[y.id,i%4===1?'absent':'present'])) as Record<string,AttendanceStatus>)}).catch(()=>setLoadError('No se pudo cargar la lista de jóvenes.'))},[])
 const groups=['Todos','Elegidos','León de Judá','Guerreros de Gedeón','Valientes de David']
 const visible=useMemo(()=>youth.filter(y=>{const n=`${y.first_name} ${y.last_name}`.toLowerCase();if(!n.includes(query.toLowerCase()))return false;if(group!=='Todos'&&y.group_name!==group)return false;if(filter==='present'&&status[y.id]!=='present')return false;if(filter==='absent'&&status[y.id]!=='absent')return false;return true}),[youth,query,group,filter,status])
 const present=Object.values(status).filter(s=>s==='present').length
 async function save(){if(!online){for(const [young_person_id,s] of Object.entries(status))await queueAttendance({id:`demo-event:${young_person_id}`,event_id:'demo-event',young_person_id,status:s,updated_at:new Date().toISOString()});setSaved('Guardado en el dispositivo. Se sincronizará al recuperar Internet.');return}setSaved('Asistencia guardada (modo demo).')}
 const meetingLabel=meeting==='sunday'?'Domingo · Grupo Intermedio':'Sábado · Ensayo del Coro Intermedio'
 return <><div className="page-title"><div><h1>Tomar asistencia</h1><span>{meetingLabel}</span></div><div className="pill">{present} / {youth.length}</div></div>
 <div className="segmented"><button className={meeting==='sunday'?'active':''} onClick={()=>setMeeting('sunday')}>Domingo</button><button className={meeting==='rehearsal'?'active':''} onClick={()=>setMeeting('rehearsal')}>Sábado · Ensayo</button></div>
 <label className="field-label group-filter">Grupo<span className="select-wrap"><select value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(name=><option key={name}>{name}</option>)}</select><ChevronDown size={20} aria-hidden="true"/></span></label>
 {loadError&&<div className="error-box" role="alert">{loadError}</div>}
 <div className="search-box"><Search size={19}/><input placeholder="Buscar joven…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 <div className="segmented"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Todos ({youth.length})</button><button className={filter==='present'?'active':''} onClick={()=>setFilter('present')}>Presentes</button><button className={filter==='absent'?'active':''} onClick={()=>setFilter('absent')}>Ausentes</button></div>
 <div className="list-stack">{visible.map(y=><div className="person-row" key={y.id}><div className="avatar">{y.first_name[0]}{y.last_name[0]}</div><div className="grow"><strong>{y.first_name} {y.last_name}</strong><small>{y.group_name??'Sin grupo asignado'}</small></div><button aria-label={`Cambiar asistencia de ${y.first_name} ${y.last_name}`} className={`toggle ${status[y.id]==='present'?'on':''}`} onClick={()=>setStatus(s=>({...s,[y.id]:s[y.id]==='present'?'absent':'present'}))}><span/></button></div>)}</div>
 <button className="primary-btn sticky-action" onClick={save}>Guardar asistencia</button>{saved&&<div className="success-box">{saved}</div>}</>
}
