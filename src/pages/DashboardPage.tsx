import { useEffect,useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { listAlerts } from '../services/alerts'
import { listAttendanceSummary } from '../services/attendance'
import type { AttendanceEvent } from '../services/attendance'
import { listUpcomingEvents } from '../services/events'
import { listYouth } from '../services/youth'
import type { AlertItem,EventItem,YoungPerson,TrafficLight } from '../types/domain'
type Bar={event:AttendanceEvent;rate:number;count:number}
const dateText=(value:string)=>new Date(value).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',timeZone:'America/Argentina/Buenos_Aires'})
export default function DashboardPage(){
 const [youth,setYouth]=useState<YoungPerson[]>([]),[alerts,setAlerts]=useState<AlertItem[]>([]),[events,setEvents]=useState<EventItem[]>([]),[bars,setBars]=useState<Bar[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);const nav=useNavigate()
 useEffect(()=>{Promise.allSettled([listYouth(),listAlerts(),listUpcomingEvents(),listAttendanceSummary()]).then(([y,a,e,b])=>{
  if(y.status==='fulfilled')setYouth(y.value)
  if(a.status==='fulfilled')setAlerts(a.value)
  if(e.status==='fulfilled')setEvents(e.value)
  if(b.status==='fulfilled')setBars(b.value)
  const failures=[y,a,e,b].filter(result=>result.status==='rejected')
  if(failures.length)setError(`No se pudieron cargar ${[y,a,e,b].map((result,index)=>result.status==='rejected'?['jóvenes','alertas','eventos','asistencias'][index]:'').filter(Boolean).join(', ')}. Revisá los permisos de esas secciones.`)
 }).finally(()=>setLoading(false))},[])
 const rate=youth.length?Math.round(youth.reduce((a,b)=>a+b.attendance_rate,0)/youth.length):0
 const lights:{value:TrafficLight;label:string}[]=[{value:'green',label:'Regular'},{value:'yellow',label:'Seguimiento'},{value:'red',label:'Contactar'}]
 return <><div className="page-title"><div><span>Hola 👋</span><h1>Inicio</h1></div></div>
 {error&&<div className="error-box" role="alert">{error}</div>}
 <div className="stat-grid"><StatCard label="Jóvenes activos" value={youth.length}/><StatCard label="Asistencia promedio" value={`${rate}%`} tone="purple"/><StatCard label="Alertas abiertas" value={alerts.length} tone="red"/></div>
 <section><h2>Asistencia reciente</h2>{bars.length?<div className="chart-card">{bars.map(({event,rate,count})=><div className="bar-col" key={event.id} title={`${event.title} · ${dateText(event.starts_at)} · ${rate}% (${count} registros)`}><strong className="bar-value">{rate}%</strong><div className="bar" style={{height:`${Math.max(rate,3)}%`}}/><small>{dateText(event.starts_at)}<br/>{event.kind==='rehearsal'?'Ensayo':'Reunión'}</small></div>)}</div>:<div className="empty-card">{loading?'Cargando asistencias…':'Todavía no hay asistencias guardadas para mostrar.'}</div>}</section>
 <section><h2>Sistema semáforo</h2><div className="traffic-grid">{lights.map(({value,label})=><button type="button" className={`traffic-card ${value==='red'?'alert':''}`} key={value} onClick={()=>nav(`/jovenes?semaforo=${value}`)} aria-label={`Ver jóvenes en ${label.toLowerCase()}`}><span className={`traffic-dot ${value}`}/><strong>{youth.filter(y=>y.traffic_light===value).length}</strong><small>{label}</small></button>)}</div></section>
 <section><h2>Próximos eventos</h2>{events.length?<div className="list-stack">{events.slice(0,3).map(event=><button type="button" key={event.id} className="event-card event-link" onClick={()=>nav(`/cronograma?evento=${encodeURIComponent(event.id)}`)}><div className="event-date">{new Date(event.starts_at).toLocaleDateString('es-AR',{day:'numeric',timeZone:'America/Argentina/Buenos_Aires'})}</div><div><strong>{event.title}</strong><p>{new Date(event.starts_at).toLocaleString('es-AR',{dateStyle:'full',timeStyle:'short',timeZone:'America/Argentina/Buenos_Aires'})}</p></div></button>)}</div>:<div className="empty-card">{loading?'Cargando cronograma…':'No hay próximos eventos. Cargá uno desde Cronograma.'}</div>}</section>
 <section><h2>Acceso rápido</h2><div className="quick-grid"><button className="primary-btn" onClick={()=>nav('/asistencia')}>✓ Tomar asistencia</button><button className="secondary-btn" onClick={()=>nav('/jovenes')}>👥 Ver jóvenes</button></div></section></>
}
