import { useEffect,useLayoutEffect,useMemo,useRef,useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate,useOutlet } from 'react-router-dom'
import AppSelect from '../components/AppSelect'
import AttendancePhotoDialog from '../components/AttendancePhotoDialog'
import { matchesYouthSex, YouthSexFilter, youthSexFilters } from '../components/YouthSexControls'
import type { YouthSexFilterValue } from '../components/YouthSexControls'
import YouthAvatar from '../components/YouthAvatar'
import { getAttendance,listAttendanceEvents,localDate,saveAttendance } from '../services/attendance'
import type { AttendanceEvent } from '../services/attendance'
import { listAttendanceRoster } from '../services/youth'
import type { AttendancePerson } from '../services/youth'
import { useAuth } from '../state/AuthContext'
import { canOpenPath,isCollaborator } from '../lib/access'
import type { AttendanceStatus } from '../types/domain'

const nameOrder = new Intl.Collator('es-AR', { sensitivity: 'base' })

function attendanceName(person: AttendancePerson) {
 const surname = person.last_name?.trim()
 const givenNames = person.first_name.trim()
 // Imported names without a separate surname cannot be split reliably.
 if (!surname) return givenNames
 const firstName = givenNames.split(/\s+/, 1)[0]
 return firstName ? `${surname}, ${firstName}` : surname
}

export default function AttendancePage(){
 const {user}=useAuth();const limited=isCollaborator(user)
 const navigate=useNavigate()
 const profile=useOutlet()
 const profileOpen=profile!==null
 const attendanceScroll=useRef<number|null>(null)
 const [preview,setPreview]=useState<{person:AttendancePerson;url:string}|null>(null)
 const [youth,setYouth]=useState<AttendancePerson[]>([]),[events,setEvents]=useState<AttendanceEvent[]>([])
 const [date,setDate]=useState(localDate(new Date().toISOString())),[meeting,setMeeting]=useState<'sunday'|'rehearsal'>('sunday')
 const [status,setStatus]=useState<Record<string,AttendanceStatus>>({}),[query,setQuery]=useState(''),[group,setGroup]=useState('Todos')
 const [sexFilter,setSexFilter]=useState<YouthSexFilterValue>('all')
 const [filter,setFilter]=useState<'all'|'present'|'absent'>('all'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false)
 useEffect(()=>{
  if(profileOpen)return
  let active=true
  listAttendanceRoster(limited).then(rows=>{if(active)setYouth(rows)})
   .catch(e=>{if(active)setError(`No se pudo cargar la lista de jóvenes: ${e.message}`)})
  return()=>{active=false}
 },[limited,profileOpen])
 useEffect(()=>{listAttendanceEvents().then(setEvents).catch(e=>setError(`No se pudieron cargar las fechas: ${e.message}`))},[limited])
 useLayoutEffect(()=>{
  if(profileOpen){window.scrollTo(0,0);return}
  if(attendanceScroll.current!==null){
   window.scrollTo(0,attendanceScroll.current)
   attendanceScroll.current=null
  }
 },[profileOpen])
 const event=events.find(e=>e.kind===meeting&&localDate(e.starts_at)===date)
 useEffect(()=>{setStatus({});setNotice('')},[date,meeting])
 useEffect(()=>{
  let active=true
  if(event)getAttendance(event.id).then(rows=>{
   if(active)setStatus(current=>({...rows,...current}))
  }).catch(e=>{if(active)setError(`No se pudo consultar la asistencia: ${e.message}`)})
  return()=>{active=false}
 },[event?.id,date,meeting])
 const groups=['Todos',...new Set(youth.map(y=>y.group_name).filter((name):name is string=>Boolean(name)))]
 const attendees=useMemo(()=>youth.filter(y=>(group==='Todos'||y.group_name===group)&&matchesYouthSex(y.sex,sexFilter)),[youth,group,sexFilter])
 const visible=useMemo(()=>{
  const search=query.trim().toLocaleLowerCase('es-AR')
  return attendees.filter(person=>[`${person.first_name} ${person.last_name}`,`${person.last_name} ${person.first_name}`,attendanceName(person)]
   .some(name=>name.toLocaleLowerCase('es-AR').includes(search)))
   .filter(person=>filter==='all'||(filter==='present'?status[person.id]==='present':status[person.id]!=='present'))
   .sort((a,b)=>nameOrder.compare(a.last_name?.trim()||a.first_name,b.last_name?.trim()||b.first_name)||nameOrder.compare(a.first_name,b.first_name))
 },[attendees,query,filter,status])
 const present=attendees.filter(y=>status[y.id]==='present').length
 async function save(){setSaving(true);setError('');setNotice('');try{
  if(limited&&!event)throw new Error('Elegí una fecha con un encuentro ya cargado. Un instructor puede agregarlo al cronograma.');
  if(!navigator.onLine)throw new Error('Necesitás conexión para guardar la asistencia.')
  const entries=Object.fromEntries(attendees.map(y=>[y.id,status[y.id]??'absent'])) as Record<string,AttendanceStatus>
  if(!attendees.length)throw new Error('No hay jóvenes para esta selección.')
  const savedEvent=await saveAttendance(date,meeting,event,entries)
  if(!event)setEvents(list=>[savedEvent,...list])
  setStatus(previous=>({...previous,...entries}))
  const sexLabel=youthSexFilters.find(option=>option.value===sexFilter)?.label
  setNotice(`Asistencia guardada: ${formatDate(date)} · ${group}${sexFilter==='all'?'':` · ${sexLabel}`}.`)
 }catch(e){setError(e instanceof Error?e.message:'No se pudo guardar la asistencia.')}finally{setSaving(false)}}
 const meetingLabel=meeting==='sunday'?'Domingo · Grupo Intermedio':'Sábado · Ensayo del Coro Intermedio'
 const formatDate=(day:string)=>day.slice(8,10)+'/'+day.slice(5,7)
 const profilePath=preview ? `/asistencia/perfil/${encodeURIComponent(preview.person.id)}` : null
 const openProfile=profilePath&&canOpenPath(user,profilePath) ? ()=>{
  attendanceScroll.current=window.scrollY
  setPreview(null)
  navigate(profilePath,{state:{fromAttendance:true}})
 } : undefined
 return <><div hidden={profileOpen}><div className="page-title"><div><h1>Tomar asistencia</h1><span>{meetingLabel} · {formatDate(date)}</span></div><div className="pill">{present} / {attendees.length}</div></div>
 <div className="segmented"><button className={meeting==='sunday'?'active':''} onClick={()=>setMeeting('sunday')}>Domingo</button><button className={meeting==='rehearsal'?'active':''} onClick={()=>setMeeting('rehearsal')}>Sábado · Ensayo</button></div>
 <label className="field-label group-filter">Fecha de asistencia<input className="date-control" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
 <div className="field-label group-filter">Grupo<AppSelect label="Grupo de asistencia" value={group} onChange={setGroup} options={groups.map(name=>({value:name,label:name}))}/></div>
 <YouthSexFilter value={sexFilter} onChange={setSexFilter}/>
 {error&&<div className="error-box" role="alert">{error}</div>}{limited&&!event&&<div className="empty-card">No hay un encuentro de este tipo cargado para esta fecha. Pedile a un instructor que lo agregue al cronograma.</div>}
 <div className="search-box"><Search size={19}/><input placeholder="Buscar joven…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 <div className="segmented"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Todos ({attendees.length})</button><button className={filter==='present'?'active':''} onClick={()=>setFilter('present')}>Presentes</button><button className={filter==='absent'?'active':''} onClick={()=>setFilter('absent')}>Ausentes</button></div>
 <div className="list-stack">{visible.map(y=><div className="person-row" key={y.id}><YouthAvatar firstName={y.first_name} lastName={y.last_name} photoPath={y.photo_path} onPreview={url=>setPreview({person:y,url})}/><div className="grow"><strong>{attendanceName(y)}</strong><small>{y.group_name??'Sin grupo asignado'}</small></div><button aria-label={`Cambiar asistencia de ${y.first_name} ${y.last_name}`} className={`toggle ${status[y.id]==='present'?'on':''}`} onClick={()=>setStatus(s=>({...s,[y.id]:s[y.id]==='present'?'absent':'present'}))}><span/></button></div>)}</div>
 {youth.length>0&&!visible.length&&<div className="empty-card">No hay jóvenes para esta selección.</div>}
 <button className="primary-btn sticky-action" disabled={saving||!date||!attendees.length||(limited&&!event)} onClick={save}>{saving?'Guardando…':'Guardar asistencia'}</button>{notice&&<div className="success-box" role="status">{notice}</div>}
 </div>
 {profile}
 {!profileOpen&&preview&&<AttendancePhotoDialog name={attendanceName(preview.person)}
  photoUrl={preview.url} onBack={()=>setPreview(null)} onProfile={openProfile}/>}
 </>
}

