import { useEffect,useState } from 'react'
import TrafficLightDot from '../components/TrafficLight'
import { listAlerts } from '../services/alerts'
import type { AlertItem } from '../types/domain'
export default function AlertsPage(){const [items,setItems]=useState<AlertItem[]>([]);useEffect(()=>{listAlerts().then(setItems)},[]);return <><div className="page-title"><div><h1>Alertas</h1><span>Seguimiento de inasistencias</span></div></div><div className="list-stack">{items.map(a=><div className="alert-card" key={a.id}><TrafficLightDot value={a.level}/><div className="grow"><strong>{a.young_person_name}</strong><p>{a.reason}</p><small>{new Date(a.created_at).toLocaleDateString('es-AR')}</small></div><button className="small-primary">Seguimiento</button></div>)}</div></>}
