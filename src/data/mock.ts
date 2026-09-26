import type { AlertItem,EventItem,Project,YoungPerson } from '../types/domain'
export const demoYouth:YoungPerson[]=[
{id:'1',first_name:'Agustina',last_name:'González',birth_date:'2011-05-04',group_name:'Elegidos',guardian_name:'Responsable demo',guardian_phone:'+5493420000001',active:true,attendance_rate:92,sundays:39,rehearsals:17,traffic_light:'green',groups:['Elegidos']},
{id:'2',first_name:'Bruno',last_name:'Martínez',birth_date:'2010-08-15',group_name:'León de Judá',guardian_name:'Responsable demo',guardian_phone:'+5493420000002',active:true,attendance_rate:61,sundays:31,rehearsals:10,traffic_light:'red',groups:['León de Judá']},
{id:'3',first_name:'Camila',last_name:'Romero',birth_date:'2012-01-21',group_name:'Guerreros de Gedeón',active:true,attendance_rate:88,sundays:41,rehearsals:26,traffic_light:'green',groups:['Guerreros de Gedeón']},
{id:'4',first_name:'Diego',last_name:'López',birth_date:'2009-11-10',group_name:'Valientes de David',active:true,attendance_rate:73,sundays:35,rehearsals:19,traffic_light:'yellow',groups:['Valientes de David']},
{id:'5',first_name:'Emilia',last_name:'Sánchez',birth_date:'2008-03-14',group_name:'Elegidos',active:true,attendance_rate:87,sundays:42,rehearsals:28,traffic_light:'green',groups:['Elegidos']},
{id:'6',first_name:'Franco',last_name:'Pérez',birth_date:'2010-06-02',group_name:'León de Judá',active:true,attendance_rate:79,sundays:37,rehearsals:11,traffic_light:'green',groups:['León de Judá']}
]
export const demoEvents:EventItem[]=[
{id:'e1',title:'Domingo de culto',kind:'sunday',starts_at:'2026-09-27T10:00:00-03:00',location:'Templo central'},
{id:'e2',title:'Ensayo del Coro Intermedio',kind:'rehearsal',starts_at:'2026-09-26T17:00:00-03:00',location:'Salón principal'},
{id:'e3',title:'Clase: Identidad',kind:'class',starts_at:'2026-10-04T10:00:00-03:00',instructor:'Diego'}
]
export const instructors=['Gabriel Salazar','Diego Carrizo','Natanael Blancato','Bruno Di Conza','Diego Martínez','Ezequiel Parola','Valeria Budzik','Ivana Arce']
export const demoProjects:Project[]=[{
id:'p1',name:'Campamento Grupo Intermedio',owner:'Gabriel Salazar',progress:60,status:'active',
tasks:[
{id:'t1',title:'Definir transporte',assignee:'Diego Martínez',status:'done',weight:1},
{id:'t2',title:'Confirmar predicador',assignee:'Gabriel Salazar',status:'done',weight:1},
{id:'t3',title:'Diseñar actividades',assignee:'Natanael Blancato',status:'in_progress',weight:1},
{id:'t4',title:'Comprar premios',assignee:'Ivana Arce',status:'pending',weight:1},
{id:'t5',title:'Lista final de jóvenes',assignee:'Diego Carrizo',status:'pending',weight:1}
]}]
export const demoAlerts:AlertItem[]=[
{id:'a1',young_person_id:'2',young_person_name:'Bruno Martínez',level:'red',reason:'3 domingos consecutivos sin asistir',created_at:'2026-09-20',resolved:false},
{id:'a2',young_person_id:'4',young_person_name:'Diego López',level:'yellow',reason:'2 ausencias en las últimas 4 reuniones',created_at:'2026-09-20',resolved:false}
]
