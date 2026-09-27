import { createContext,useContext,useEffect,useMemo,useRef,useState } from 'react'
import type { ReactNode } from 'react'
import type { AppUser } from '../types/domain'
import { supabase } from '../lib/supabase'
import { USE_MOCKS } from '../lib/config'

type Ctx={user:AppUser|null;loading:boolean;signIn:(e:string,p:string)=>Promise<void>;signOut:()=>Promise<void>}
const AuthContext=createContext<Ctx|undefined>(undefined)
const mockUser:AppUser={id:'demo-admin',email:'lider@asambleacristiana.org',full_name:'Líder Demo',role:'superadmin',permissions:['medical.read','medical.write','youth.write','attendance.write','events.write','projects.write']}

export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<AppUser|null>(USE_MOCKS?mockUser:null)
  const [loading,setLoading]=useState(!USE_MOCKS)
  const requestId=useRef(0)
  useEffect(()=>{
    if(USE_MOCKS||!supabase){setLoading(false);return}
    const client=supabase
    let active=true
    const load=async(au:{id:string}|undefined)=>{
      const current=++requestId.current
      if(!au){setUser(null);setLoading(false);return}
      const {data:profile,error}=await client.from('app_users').select('id,email,full_name,role,permissions').eq('id',au.id).single()
      if(!active||current!==requestId.current)return
      if(error)console.error('No se pudo cargar el perfil de acceso:',error.message)
      setUser(profile as AppUser|null);setLoading(false)
    }
    const {data:l}=client.auth.onAuthStateChange((_event,session)=>{
      setTimeout(()=>{if(active)void load(session?.user)},0)
    })
    return()=>{active=false;requestId.current++;l.subscription.unsubscribe()}
  },[])
  const value=useMemo<Ctx>(()=>({user,loading,
    async signIn(email,password){
      if(USE_MOCKS){setUser({...mockUser,email});return}
      if(!supabase)throw new Error('Supabase no está configurado.')
      const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error
      if(!data.user)throw new Error('No se pudo confirmar la sesión. Intentá nuevamente.')
      const {data:profile,error:profileError}=await supabase.from('app_users').select('id,email,full_name,role,permissions').eq('id',data.user.id).single()
      if(profileError||!profile)throw new Error('La cuenta ingresó, pero no se pudo cargar su perfil. Revisá los permisos de la cuenta.')
      setUser(profile as AppUser)
    },
    async signOut(){if(!USE_MOCKS&&supabase)await supabase.auth.signOut();setUser(null)}
  }),[user,loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth(){const c=useContext(AuthContext);if(!c)throw new Error('AuthProvider faltante');return c}
