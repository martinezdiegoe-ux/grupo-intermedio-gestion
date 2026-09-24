import { createContext,useContext,useEffect,useMemo,useState } from 'react'
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
  useEffect(()=>{
    if(USE_MOCKS||!supabase){setLoading(false);return}
    let active=true
    const load=async()=>{
      const {data}=await supabase.auth.getSession()
      const au=data.session?.user
      if(!active)return
      if(!au){setUser(null);setLoading(false);return}
      const {data:profile}=await supabase.from('app_users').select('id,email,full_name,role,permissions').eq('id',au.id).single()
      setUser(profile as AppUser|null);setLoading(false)
    }
    load()
    const {data:l}=supabase.auth.onAuthStateChange(()=>load())
    return()=>{active=false;l.subscription.unsubscribe()}
  },[])
  const value=useMemo<Ctx>(()=>({user,loading,
    async signIn(email,password){
      if(USE_MOCKS){setUser({...mockUser,email});return}
      if(!supabase)throw new Error('Supabase no está configurado.')
      const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error
    },
    async signOut(){if(!USE_MOCKS&&supabase)await supabase.auth.signOut();setUser(null)}
  }),[user,loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth(){const c=useContext(AuthContext);if(!c)throw new Error('AuthProvider faltante');return c}
