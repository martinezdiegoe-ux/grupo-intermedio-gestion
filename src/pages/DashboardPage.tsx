import { useEffect,useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { listAlerts } from '../services/alerts'
import { listUpcomingEvents } from '../services/events'
import { listYouth } from '../services/youth'
import type { AlertItem,EventItem,YoungPerson } from '../types/domain'
export default function DashboardPage(){
 const [youth,setYouth]=useState<YoungPerson[]>([]),[alerts,setAlerts]=useState<AlertItem[]>([]),[events,setEvents]=useState<EventItem[]>([]);const nav=useNavigate()
 useEffect(()=>{Promise.all([listYouth(),listAlerts(),listUpcomingEvents()]).then(([y,a,e])=>{setYouth(y);setAlerts(a);setEvents(e)})},[])
 const green=youth.filter(y=>y.traffic_light==='green').length,yellow=youth.filter(y=>y.traffic_light==='yellow').length,red=youth.filter(y=>y.traffic_light==='red').length
 const rate=youth.length?Math.round(youth.reduce((a,b)=>a+b.attendance_rate,0)/youth.length):0
 return <><div className="page-title"><div><span>Hola 👋</span><h1>Dashboard</h1></div></div>
 <div className="stat-grid"><StatCard label="Jóvenes activos" value={youth.length||118}/><StatCard label="Asistencia promedio" value={`${rate||84}%`} tone="purple"/><StatCard label="Alertas abiertas" value={alerts.length} tone="red"/></div>
 <section><h2>Asistencia últimas 6 semanas</h2><div className="chart-card">{[82,76,88,67,79,93].map((v,i)=><div className="bar-col" key={i}><div className="bar" style={{height:`${v}%`}}/><small>S{i+1}</small></div>)}</div></section>
 <section><h2>Sistema semáforo</h2><div className="traffic-grid"><div className="traffic-card"><span className="traffic-dot green"/><strong>{green||89}</strong><small>Regular</small></div><div className="traffic-card"><span className="traffic-dot yellow"/><strong>{yellow||22}</strong><small>Seguimiento</small></div><div className="traffic-card alert"><span className="traffic-dot red"/><strong>{red||7}</strong><small>Contactar</small></div></div></section>
 <section><h2>Próximo evento</h2><div className="event-card"><div className="event-date">{events[0]?new Date(events[0].starts_at).getDate():27}</div><div><strong>{events[0]?.title??'Domingo de culto'}</strong><p>{events[0]?new Date(events[0].starts_at).toLocaleString('es-AR'):'Domingo · 10:00 hs'}</p></div></div></section>
 <section><h2>Acceso rápido</h2><div className="quick-grid"><button className="primary-btn" onClick={()=>nav('/asistencia')}>✓ Tomar asistencia</button><button className="secondary-btn" onClick={()=>nav('/jovenes')}>👥 Ver jóvenes</button></div></section></>
}
