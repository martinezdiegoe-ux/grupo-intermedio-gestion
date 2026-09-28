import { useState } from 'react'
import { CalendarDays,ChevronLeft,ChevronRight } from 'lucide-react'

type Props={name:string;label:string;initialValue?:string}
const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const weekdays=['L','M','M','J','V','S','D']
function iso(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function display(value:string){if(!value)return 'Seleccionar fecha';const [year,month,day]=value.split('-');return `${day}/${month}/${year}`}
export default function DatePicker({name,label,initialValue=''}:Props){
 const today=new Date(),initial=initialValue?new Date(`${initialValue}T12:00:00`):today
 const [value,setValue]=useState(initialValue),[open,setOpen]=useState(false),[year,setYear]=useState(initial.getFullYear()),[month,setMonth]=useState(initial.getMonth())
 const first=(new Date(year,month,1).getDay()+6)%7
 const days=new Date(year,month+1,0).getDate()
 const firstYear=name==='birth_date'?today.getFullYear()-100:today.getFullYear()-10
 const years=Array.from({length:today.getFullYear()+31-firstYear},(_,i)=>firstYear+i)
 function move(amount:number){const next=new Date(year,month+amount,1);setYear(next.getFullYear());setMonth(next.getMonth())}
 function choose(day:number){setValue(iso(new Date(year,month,day)));setOpen(false)}
 return <div className="date-field"><span>{label}</span><input type="hidden" name={name} value={value}/><button type="button" className="date-trigger" aria-label={`${label}: ${display(value)}`} aria-expanded={open} onClick={()=>setOpen(!open)}><span className={value?'':'date-placeholder'}>{display(value)}</span><CalendarDays size={20}/></button>{open&&<div className="date-popover" role="group" aria-label={`Calendario de ${label}`}><div className="date-month"><button type="button" aria-label="Mes anterior" onClick={()=>move(-1)}><ChevronLeft size={20}/></button><div><select aria-label="Mes" value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((name,index)=><option key={name} value={index}>{name}</option>)}</select><select aria-label="Año" value={year} onChange={e=>setYear(Number(e.target.value))}>{years.map(n=><option key={n} value={n}>{n}</option>)}</select></div><button type="button" aria-label="Mes siguiente" onClick={()=>move(1)}><ChevronRight size={20}/></button></div><div className="date-grid">{weekdays.map((day,index)=><strong key={index}>{day}</strong>)}{Array.from({length:first},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:days},(_,i)=>i+1).map(day=>{const chosen=value===iso(new Date(year,month,day)),current=iso(today)===iso(new Date(year,month,day));return <button key={day} type="button" className={`${chosen?'selected ':''}${current?'today':''}`} aria-label={`${day} de ${months[month]} de ${year}`} aria-pressed={chosen} onClick={()=>choose(day)}>{day}</button>})}</div><div className="date-actions"><button type="button" onClick={()=>{setYear(today.getFullYear());setMonth(today.getMonth());chooseToday()}}>Hoy</button><button type="button" onClick={()=>{setValue('');setOpen(false)}}>Sin fecha</button></div></div>}</div>
 function chooseToday(){setValue(iso(today));setOpen(false)}
}
