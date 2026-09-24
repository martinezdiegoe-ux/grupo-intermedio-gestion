create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now();return new;end $$;
do $$ begin create trigger young_people_updated before update on public.young_people for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger attendance_updated before update on public.attendance for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger events_updated before update on public.events for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger tasks_updated before update on public.project_tasks for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create or replace view public.young_people_view with(security_invoker=true) as
select y.id,y.first_name,y.last_name,y.birth_date,y.phone,y.address,y.sector,y.active,
coalesce(round(100.0*count(a.*) filter(where a.status='present')/nullif(count(a.*) filter(where a.status in('present','absent','justified')),0),0),0)::int attendance_rate,
count(a.*) filter(where e.kind='sunday' and a.status='present')::int sundays,
count(a.*) filter(where e.kind='rehearsal' and a.status='present')::int rehearsals,
case when coalesce(round(100.0*count(a.*) filter(where a.status='present')/nullif(count(a.*) filter(where a.status in('present','absent','justified')),0),0),100)<65 then 'red'::public.traffic_light
when coalesce(round(100.0*count(a.*) filter(where a.status='present')/nullif(count(a.*) filter(where a.status in('present','absent','justified')),0),0),100)<80 then 'yellow'::public.traffic_light
else 'green'::public.traffic_light end traffic_light
from public.young_people y left join public.attendance a on a.young_person_id=y.id left join public.events e on e.id=a.event_id
where y.deleted_at is null group by y.id;

create or replace view public.alerts_view with(security_invoker=true) as
select a.*,concat(y.first_name,' ',y.last_name) young_person_name from public.alerts a join public.young_people y on y.id=a.young_person_id;

create or replace view public.project_progress_view with(security_invoker=true) as
select p.id,p.name,p.description,p.start_date,p.end_date,p.status,p.created_at,coalesce(u.full_name,'Sin asignar') owner,
coalesce(round(100*sum(case when t.status='done' then t.weight else 0 end)/nullif(sum(t.weight),0)),0)::int progress
from public.projects p left join public.app_users u on u.id=p.owner_user_id left join public.project_tasks t on t.project_id=p.id
group by p.id,u.full_name;

create or replace function public.upsert_attendance(p_event_id uuid,p_young_person_id uuid,p_status public.attendance_status,p_notes text default null)
returns public.attendance language plpgsql security definer set search_path=public as $$
declare r public.attendance;
begin
 if not public.has_permission('attendance.write') then raise exception 'not authorized'; end if;
 insert into public.attendance(event_id,young_person_id,status,notes,recorded_by)
 values(p_event_id,p_young_person_id,p_status,p_notes,auth.uid())
 on conflict(event_id,young_person_id) do update set status=excluded.status,notes=excluded.notes,recorded_by=auth.uid(),updated_at=now()
 returning * into r; return r;
end $$;
