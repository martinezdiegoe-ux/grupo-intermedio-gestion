import type { ReactNode } from 'react'
import { Bell,CalendarDays,ClipboardCheck,FolderKanban,Home,Settings,Users } from 'lucide-react'
import { NavLink,useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import InstallAppButton from './InstallAppButton'
const nav=[['/',Home,'Inicio'],['/asistencia',ClipboardCheck,'Asistencia'],['/jovenes',Users,'Jóvenes'],['/cronograma',CalendarDays,'Cronograma'],['/proyectos',FolderKanban,'Proyectos']] as const
export default function AppShell({children}:{children:ReactNode}){
 const {user,signOut}=useAuth();const online=useOnlineStatus();const go=useNavigate()
 return <div className="app-frame">
 {!online&&<div className="offline-banner">Sin conexión · la asistencia puede guardarse localmente</div>}
 <header className="topbar"><div><div className="eyebrow">Asamblea Cristiana</div><strong>Grupo Intermedio</strong></div>
 <div className="top-actions"><InstallAppButton compact/><button className="icon-btn" onClick={()=>go('/alertas')}><Bell size={20}/></button>{(user?.role==='superadmin'||user?.role==='admin')&&<button className="icon-btn" onClick={()=>go('/admin')}><Settings size={20}/></button>}<button className="text-btn" onClick={()=>signOut()}>Salir</button></div></header>
 <main className="page">{children}</main>
 <nav className="bottom-nav">{nav.map(([to,Icon,label])=><NavLink key={to} to={to} end={to==='/' as any} className={({isActive})=>isActive?'active':''}><Icon size={21}/><span>{label}</span></NavLink>)}</nav>
 </div>
}
