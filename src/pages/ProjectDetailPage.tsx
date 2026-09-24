import { useEffect,useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate,useParams } from 'react-router-dom'
import { listProjects } from '../services/projects'
import type { Project } from '../types/domain'
export default function ProjectDetailPage(){const {id=''}=useParams(),nav=useNavigate();const [p,setP]=useState<Project|null>(null);useEffect(()=>{listProjects().then(all=>setP(all.find(x=>x.id===id)??null))},[id]);if(!p)return <div>Cargando…</div>;return <><div className="profile-head"><button className="icon-btn" onClick={()=>nav(-1)}><ArrowLeft/></button><span>Detalle del proyecto</span><span/></div><h1>{p.name}</h1><p>Responsable general: {p.owner}</p><div className="big-progress"><span style={{width:`${p.progress}%`}}/><b>{p.progress}%</b></div><section><h2>Tareas</h2><div className="list-stack">{p.tasks.map(t=><div className="task-row" key={t.id}><div><strong>{t.title}</strong><small>{t.assignee}</small></div><span className={`task-status ${t.status}`}>{t.status.replace('_',' ')}</span></div>)}</div></section></>}
