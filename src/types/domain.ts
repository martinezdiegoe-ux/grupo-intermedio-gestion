export type Role='superadmin'|'admin'|'leader'|'instructor'
export type TrafficLight='green'|'yellow'|'red'
export type AttendanceStatus='present'|'absent'|'justified'|'not_applicable'

export interface AppUser {
  id:string; email:string; full_name:string; role:Role; permissions:string[]
}
export interface YoungPerson {
  id:string; first_name:string; last_name:string; birth_date:string;
  phone?:string; address?:string; photo_path?:string; group_name?:string; guardian_name?:string; guardian_phone?:string; active:boolean;
  attendance_rate:number; sundays:number; rehearsals:number;
  traffic_light:TrafficLight; groups?:string[]
}
export interface MedicalProfile {
  young_person_id:string; blood_type:string|null; allergies:string|null;
  medications:string|null; medication_reason:string|null; health_provider:string|null;
  insurance_member_number:string|null; relevant_conditions:string|null;
  surgeries:string|null; activity_restrictions:string|null; dietary_restrictions:string|null;
  emergency_notes:string|null
}
export interface EventItem {
  id:string; title:string;
  kind:'sunday'|'rehearsal'|'class'|'special'|'meeting'|'camp'|'other';
  starts_at:string; location?:string; instructor?:string
}
export interface ProjectTask {
  id:string; title:string; assignee:string; due_date?:string;
  status:'pending'|'in_progress'|'blocked'|'done'; weight:number
}
export interface Project {
  id:string; name:string; owner:string; progress:number;
  status:'planned'|'active'|'completed'|'cancelled'; tasks:ProjectTask[]
}
export interface AlertItem {
  id:string; young_person_id:string; young_person_name:string;
  level:TrafficLight; reason:string; created_at:string; resolved:boolean
}
