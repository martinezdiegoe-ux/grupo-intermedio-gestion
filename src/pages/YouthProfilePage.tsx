import { useEffect,useState } from 'react'
import { ArrowLeft,Pencil,Phone } from 'lucide-react'
import { useNavigate,useParams } from 'react-router-dom'
import TrafficLightDot from '../components/TrafficLight'
import { getYouth } from '../services/youth'
import type { YoungPerson } from '../types/domain'
function age(s:string){const d=new Date(s),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a}
export default function YouthProfilePage(){
 const {id=''}=useParams(),nav=useNavigate();const [y,setY]=useState<YoungPerson|null>(null);useEffect(()=>{getYouth(id).then(setY)},[id]);if(!y)return <div>Cargando perfil…</div>
 return <><div className="profile-head"><button className="icon-btn" onClick={()=>nav(-1)}><ArrowLeft/></button><span>Perfil del joven</span><button className="icon-btn"><Pencil size={18}/></button></div><div className="profile-avatar">{y.first_name[0]}{y.last_name[0]}</div><h1 className="profile-name">{y.first_name} {y.last_name}</h1><p className="profile-sub">{age(y.birth_date)} años · {y.sector?`Sector ${y.sector}`:''} · {y.groups?.join(' · ')}</p>
 <div className="profile-stats"><div><span>Asistencia</span><strong className="good">{y.attendance_rate}%</strong></div><div><span>Domingos</span><strong>{y.sundays}</strong></div><div><span>Ensayos</span><strong>{y.rehearsals}</strong></div><div><span>Semáforo</span><TrafficLightDot value={y.traffic_light}/></div></div>
 <section><h2>Datos personales</h2><div className="detail-card"><div><span>Fecha de nacimiento</span><strong>{new Date(y.birth_date).toLocaleDateString('es-AR')}</strong></div><div><span>Teléfono</span><strong>{y.phone??'Sin registrar'}</strong></div><div><span>Sector</span><strong>{y.sector??'Sin registrar'}</strong></div><div><span>Dirección</span><strong>{y.address??'Sin registrar'}</strong></div></div></section>
 <section><h2>Ficha médica</h2><div className="detail-card medical"><div><span>Alergias</span><strong>Acceso restringido / demo</strong></div><div><span>Grupo sanguíneo</span><strong>—</strong></div><div><span>Obra social</span><strong>—</strong></div></div></section>
 <section><h2>Últimas 8 semanas</h2><div className="weeks-card">{['P','P','P','A','P','P','P','P'].map((v,i)=><div key={i}><span className={`week-dot ${v==='P'?'present':'absent'}`}/><small>{v}</small></div>)}</div></section>
 <div className="quick-grid"><button className="secondary-btn"><Phone size={18}/> Contactar tutor</button><button className="secondary-btn"><Pencil size={18}/> Editar perfil</button></div></>
}
