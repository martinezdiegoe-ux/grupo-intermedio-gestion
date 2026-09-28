import { useState } from 'react'
import { Clock3 } from 'lucide-react'

type Props={name:string;label:string;initialValue?:string}
const pad=(value:number)=>String(value).padStart(2,'0')
export default function TimePicker({name,label,initialValue='10:00'}:Props){
 const [value,setValue]=useState(initialValue),[open,setOpen]=useState(false)
 const [hour,minute]=value.split(':').map(Number)
 const hours=Array.from({length:24},(_,i)=>i),minutes=Array.from({length:12},(_,i)=>i*5)
 return <div className="time-field"><span>{label}</span><input type="hidden" name={name} value={value}/><button type="button" className="time-trigger" aria-label={`${label}: ${value}`} aria-expanded={open} onClick={()=>setOpen(!open)}><span>{value} hs</span><Clock3 size={20}/></button>{open&&<div className="time-popover" role="group" aria-label="Seleccionar hora"><strong>Hora</strong><div className="time-options hours">{hours.map(h=><button type="button" key={h} className={h===hour?'selected':''} aria-pressed={h===hour} onClick={()=>setValue(`${pad(h)}:${pad(minute)}`)}>{pad(h)}</button>)}</div><strong>Minutos</strong><div className="time-options minutes">{minutes.map(m=><button type="button" key={m} className={m===minute?'selected':''} aria-pressed={m===minute} onClick={()=>{setValue(`${pad(hour)}:${pad(m)}`);setOpen(false)}}>{pad(m)}</button>)}</div><button type="button" className="time-done" onClick={()=>setOpen(false)}>Listo</button></div>}</div>
}
