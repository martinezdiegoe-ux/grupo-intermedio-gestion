create extension if not exists pgcrypto;
do $$ begin create type public.app_role as enum ('superadmin','admin','leader','instructor'); exception when duplicate_object then null; end $$;
do $$ begin create type public.traffic_light as enum ('green','yellow','red'); exception when duplicate_object then null; end $$;
do $$ begin create type public.attendance_status as enum ('present','absent','justified','not_applicable'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_status as enum ('pending','in_progress','blocked','done'); exception when duplicate_object then null; end $$;

create table if not exists public.app_users(
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,full_name text not null,role public.app_role not null default 'leader',
 permissions text[] not null default '{}',active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.young_people(
 id uuid primary key default gen_random_uuid(),first_name text not null,last_name text not null,birth_date date not null,
 phone text,address text,sector text,photo_path text,active boolean not null default true,joined_at date,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz
);
create table if not exists public.guardians(
 id uuid primary key default gen_random_uuid(),full_name text not null,relationship text,phone text,email text,address text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.young_person_guardians(
 young_person_id uuid references public.young_people(id) on delete cascade,
 guardian_id uuid references public.guardians(id) on delete cascade,
 is_emergency_contact boolean not null default false,
 primary key(young_person_id,guardian_id)
);
create table if not exists public.medical_profiles(
 young_person_id uuid primary key references public.young_people(id) on delete cascade,
 blood_type text,allergies text,medications text,health_provider text,relevant_conditions text,emergency_notes text,updated_at timestamptz not null default now()
);
create table if not exists public.groups(id uuid primary key default gen_random_uuid(),name text not null unique,kind text,active boolean not null default true);
create table if not exists public.young_people_groups(
 young_person_id uuid references public.young_people(id) on delete cascade,
 group_id uuid references public.groups(id) on delete cascade,
 primary key(young_person_id,group_id)
);
create table if not exists public.events(
 id uuid primary key default gen_random_uuid(),title text not null,
 kind text not null check(kind in ('sunday','rehearsal','class','special','meeting','camp','other')),
 starts_at timestamptz not null,ends_at timestamptz,location text,instructor_user_id uuid references public.app_users(id) on delete set null,
 description text,material_url text,notes text,attendance_enabled boolean not null default true,
 created_by uuid references public.app_users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.attendance(
 id uuid primary key default gen_random_uuid(),event_id uuid not null references public.events(id) on delete cascade,
 young_person_id uuid not null references public.young_people(id) on delete cascade,status public.attendance_status not null,
 notes text,recorded_by uuid references public.app_users(id) on delete set null,recorded_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(event_id,young_person_id)
);
create table if not exists public.alert_rules(
 id uuid primary key default gen_random_uuid(),name text not null,level public.traffic_light not null,
 consecutive_absences integer,attendance_rate_below numeric(5,2),lookback_events integer not null default 8,active boolean not null default true,created_at timestamptz not null default now()
);
create table if not exists public.alerts(
 id uuid primary key default gen_random_uuid(),young_person_id uuid not null references public.young_people(id) on delete cascade,
 level public.traffic_light not null,reason text not null,source_rule_id uuid references public.alert_rules(id) on delete set null,
 resolved boolean not null default false,resolved_at timestamptz,created_at timestamptz not null default now()
);
create table if not exists public.followups(
 id uuid primary key default gen_random_uuid(),alert_id uuid references public.alerts(id) on delete cascade,
 young_person_id uuid not null references public.young_people(id) on delete cascade,contacted_by uuid references public.app_users(id) on delete set null,
 contact_type text,notes text not null,status text not null default 'open',created_at timestamptz not null default now()
);
create table if not exists public.projects(
 id uuid primary key default gen_random_uuid(),name text not null,description text,owner_user_id uuid references public.app_users(id) on delete set null,
 start_date date,end_date date,status text not null default 'planned' check(status in ('planned','active','completed','cancelled')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.project_tasks(
 id uuid primary key default gen_random_uuid(),project_id uuid not null references public.projects(id) on delete cascade,
 title text not null,description text,due_date date,status public.task_status not null default 'pending',weight numeric(8,2) not null default 1 check(weight>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.task_assignees(
 task_id uuid references public.project_tasks(id) on delete cascade,user_id uuid references public.app_users(id) on delete cascade,primary key(task_id,user_id)
);
create table if not exists public.push_devices(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.app_users(id) on delete cascade,token text not null unique,
 platform text,user_agent text,active boolean not null default true,last_seen_at timestamptz not null default now(),created_at timestamptz not null default now()
);
create table if not exists public.notifications(
 id uuid primary key default gen_random_uuid(),title text not null,body text not null,target_role public.app_role,target_user_id uuid references public.app_users(id) on delete cascade,
 sent_by uuid references public.app_users(id) on delete set null,data jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create table if not exists public.audit_log(
 id bigint generated always as identity primary key,user_id uuid references public.app_users(id) on delete set null,action text not null,table_name text not null,
 record_id text,old_data jsonb,new_data jsonb,created_at timestamptz not null default now()
);
create index if not exists idx_attendance_event on public.attendance(event_id);
create index if not exists idx_attendance_young on public.attendance(young_person_id);
create index if not exists idx_events_starts_at on public.events(starts_at);
create index if not exists idx_alerts_young_open on public.alerts(young_person_id,resolved);
create index if not exists idx_tasks_project on public.project_tasks(project_id);
