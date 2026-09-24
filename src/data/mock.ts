import type { AlertItem,EventItem,Project,YoungPerson } from '../types/domain'
export const demoYouth:YoungPerson[]=[
{id:'1',first_name:'Agustina',last_name:'González',birth_date:'2011-05-04',sector:'B',active:true,attendance_rate:92,sundays:39,rehearsals:17,traffic_light:'green',groups:['Sector B']},
{id:'2',first_name:'Bruno',last_name:'Martínez',birth_date:'2010-08-15',sector:'A',active:true,attendance_rate:61,sundays:31,rehearsals:10,traffic_light:'red',groups:['Sector A']},
{id:'3',first_name:'Camila',last_name:'Romero',birth_date:'2012-01-21',sector:'C',active:true,attendance_rate:88,sundays:41,rehearsals:26,traffic_light:'green',groups:['Sector C','Coro']},
{id:'4',first_name:'Diego',last_name:'López',birth_date:'2009-11-10',sector:'B',active:true,attendance_rate:73,sundays:35,rehearsals:19,traffic_light:'yellow',groups:['Sector B']},
{id:'5',first_name:'Emilia',last_name:'Sánchez',birth_date:'2008-03-14',sector:'A',active:true,attendance_rate:87,sundays:42,rehearsals:28,traffic_light:'green',groups:['Sector A','Coro']},
{id:'6',first_name:'Franco',last_name:'Pérez',birth_date:'2010-06-02',sector:'C',active:true,attendance_rate:79,sundays:37,rehearsals:11,traffic_light:'green',groups:['Sector C']}
]
export const demoEvents:EventItem[]=[
{id:'e1',title:'Domingo de culto',kind:'sunday',starts_at:'2026-09-27T10:00:00-03:00',location:'Templo central'},
{id:'e2',title:'Ensayo de coro',kind:'rehearsal',starts_at:'2026-09-26T17:00:00-03:00',location:'Salón principal'},
{id:'e3',title:'Clase: Identidad',kind:'class',starts_at:'2026-10-04T10:00:00-03:00',instructor:'Diego'}
]
export const demoProjects:Project[]=[{
id:'p1',name:'Campamento Grupo Intermedio',owner:'Gabriel',progress:60,status:'active',
tasks:[
{id:'t1',title:'Definir transporte',assignee:'Diego',status:'done',weight:1},
{id:'t2',title:'Confirmar predicador',assignee:'Gabriel',status:'done',weight:1},
{id:'t3',title:'Diseñar actividades',assignee:'Gustavo',status:'in_progress',weight:1},
{id:'t4',title:'Comprar premios',assignee:'Ivana',status:'pending',weight:1},
{id:'t5',title:'Lista final de jóvenes',assignee:'Diego',status:'pending',weight:1}
]}]
export const demoAlerts:AlertItem[]=[
{id:'a1',young_person_id:'2',young_person_name:'Bruno Martínez',level:'red',reason:'3 domingos consecutivos sin asistir',created_at:'2026-09-20',resolved:false},
{id:'a2',young_person_id:'4',young_person_name:'Diego López',level:'yellow',reason:'2 ausencias en las últimas 4 reuniones',created_at:'2026-09-20',resolved:false}
]
