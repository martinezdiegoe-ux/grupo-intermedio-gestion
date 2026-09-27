import { useEffect,useState } from 'react'
import { supabase } from './lib/supabase'
import { Navigate,Route,Routes } from 'react-router-dom'
import { useAuth } from './state/AuthContext'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AttendancePage from './pages/AttendancePage'
import YouthListPage from './pages/YouthListPage'
import YouthProfilePage from './pages/YouthProfilePage'
import CalendarPage from './pages/CalendarPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import AlertsPage from './pages/AlertsPage'
import AdminPage from './pages/AdminPage'
function Protected(){const {user,loading}=useAuth();if(loading)return <div className="center-screen">Cargando…</div>;if(!user)return <Navigate to="/login" replace/>;return <AppShell><Routes><Route path="/" element={<DashboardPage/>}/><Route path="/asistencia" element={<AttendancePage/>}/><Route path="/jovenes" element={<YouthListPage/>}/><Route path="/jovenes/:id" element={<YouthProfilePage/>}/><Route path="/cronograma" element={<CalendarPage/>}/><Route path="/proyectos" element={<ProjectsPage/>}/><Route path="/proyectos/:id" element={<ProjectDetailPage/>}/><Route path="/alertas" element={<AlertsPage/>}/><Route path="/admin" element={<AdminPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></AppShell>}
function PasswordRecovery(){const [password,setPassword]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);return <div className="login-page"><form className="login-card" onSubmit={async e=>{e.preventDefault();setBusy(true);const {error}=await supabase!.auth.updateUser({password});setBusy(false);if(error)setMessage(error.message);else{setMessage('Contraseña guardada. Ya podés ingresar.');await supabase!.auth.signOut();window.location.replace(import.meta.env.BASE_URL+'login')}}><h2>Nueva contraseña</h2><label>Elegí una contraseña nueva</label><input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary-btn" disabled={busy}>Guardar contraseña</button>{message&&<p role="status">{message}</p>}</form></div>}
export default function App(){const [recover,setRecover]=useState(false);useEffect(()=>{if(!supabase)return;const {data}=supabase.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')setRecover(true)});return()=>data.subscription.unsubscribe()},[]);if(recover)return <PasswordRecovery/>;return <Routes><Route path="/login" element={<LoginPage/>}/><Route path="/*" element={<Protected/>}/></Routes>}
