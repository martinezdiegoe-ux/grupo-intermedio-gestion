import { useEffect,useMemo,useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import TrafficLightDot from '../components/TrafficLight'
import { listYouth } from '../services/youth'
import type { YoungPerson } from '../types/domain'
function age(s:string){const d=new Date(s),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a}
export default function YouthListPage(){
 const [items,setItems]=useState<YoungPerson[]>([]),[loadError,setLoadError]=useState(''),[q,setQ]=useState('');const nav=useNavigate();useEffect(()=>{listYouth().then(setItems).catch(()=>setLoadError('No se pudo cargar la lista de jóvenes.'))},[])
 const visible=useMemo(()=>items.filter(y=>`${y.first_name} ${y.last_name}`.toLowerCase().includes(q.toLowerCase())),[items,q])
 return <><div className="page-title"><div><h1>Jóvenes</h1><span>{items.length} activos</span></div></div>{loadError&&<div className="error-box" role="alert">{loadError}</div>}<div className="search-box"><Search size={19}/><input placeholder="Buscar…" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="list-stack">{visible.map(y=><button className="person-row clickable" key={y.id} onClick={()=>nav(`/jovenes/${y.id}`)}><div className="avatar">{y.first_name[0]}{y.last_name[0]}</div><div className="grow"><strong>{y.first_name} {y.last_name}</strong><small>{age(y.birth_date)} años · {y.group_name??'Sin grupo asignado'}</small></div><TrafficLightDot value={y.traffic_light}/></button>)}</div></>
}
