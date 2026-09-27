import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export default function InstallAppButton({ compact = false }: { compact?: boolean }) {
 const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);const [installed,setInstalled]=useState(false);const [apple,setApple]=useState(false);const [help,setHelp]=useState(false)
 useEffect(()=>{const nav=navigator as Navigator&{standalone?:boolean};setInstalled(window.matchMedia('(display-mode: standalone)').matches||nav.standalone===true);const onPrompt=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPromptEvent)};const onInstalled=()=>setInstalled(true);window.addEventListener('beforeinstallprompt',onPrompt);window.addEventListener('appinstalled',onInstalled);return()=>{window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstalled)}},[])
 if(installed)return null
 const isApple=/iphone|ipad|ipod/i.test(navigator.userAgent)
 async function install(){if(prompt){await prompt.prompt();const c=await prompt.userChoice;if(c.outcome==='accepted')setInstalled(true);setPrompt(null)}else if(isApple)setApple(true);else setHelp(true)}
 return <div className={compact?'install-control compact':'install-control'}><button type="button" className="install-btn" onClick={install}><Download size={compact?18:20}/><span>{compact?'Instalar':'Instalar aplicación'}</span></button>{help&&<small>En el menú ⋮ del navegador elegí “Instalar app” o “Agregar a pantalla de inicio”.</small>}{apple&&<small>En Safari: Compartir → “Agregar a pantalla de inicio”.</small>}</div>
}
