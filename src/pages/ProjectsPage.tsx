import { useEffect,useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProjects } from '../services/projects'
import type { Project } from '../types/domain'
export default function ProjectsPage(){const [items,setItems]=useState<Project[]>([]);const nav=useNavigate();useEffect(()=>{listProjects().then(setItems)},[]);return <><div className="page-title"><div><h1>Proyectos</h1><span>Actividades especiales</span></div><button className="small-primary">+ Nuevo</button></div><div className="list-stack">{items.map(p=><button key={p.id} className="project-card clickable" onClick={()=>nav(`/proyectos/${p.id}`)}><div className="row-between"><strong>{p.name}</strong><span>{p.progress}%</span></div><small>Responsable: {p.owner}</small><div className="progress"><span style={{width:`${p.progress}%`}}/></div></button>)}</div></>}
