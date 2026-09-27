import { FormEvent,useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LockKeyhole,Mail,Plus } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import InstallAppButton from '../components/InstallAppButton'
import { USE_MOCKS } from '../lib/config'
export default function LoginPage(){
 const {user,signIn}=useAuth();const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 if(user)return <Navigate to="/" replace/>
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await signIn(email,password)}catch(err){setError(err instanceof Error?err.message:'No se pudo iniciar sesión')}finally{setBusy(false)}}
 return <div className="login-page"><div><section className="login-hero"><div className="logo-bubble"><Plus size={48} strokeWidth={4}/></div><h1>Asamblea Cristiana</h1><p>Grupo Intermedio</p></section>
 <form className="login-card" onSubmit={submit}><h2>Iniciar sesión</h2><p>Ingresá con tu cuenta de líder</p><label>Correo electrónico</label><div className="input-wrap"><Mail size={19}/><input type="email" placeholder="example@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/></div><label>Contraseña</label><div className="input-wrap"><LockKeyhole size={19}/><input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required/></div>{error&&<div className="error-box">{error}</div>}<button className="primary-btn" disabled={busy}>{busy?'Ingresando…':'Ingresar'}</button><InstallAppButton/>{USE_MOCKS&&<small>Modo demo activo.</small>}</form></div></div>
}
