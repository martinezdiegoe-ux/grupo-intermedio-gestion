begin;
create table if not exists public.finance_transactions (
 id uuid primary key default gen_random_uuid(),
 transaction_date date not null check(transaction_date <= (now() at time zone 'America/Argentina/Buenos_Aires')::date),
 kind text not null check(kind in ('income','expense')),
 category text not null check(category in ('Donación','Ofrendas','Recaudación','Saldo inicial','Movimiento','Materiales','Alimentos','Transporte','Eventos','Otros')),
 concept text not null check(length(btrim(concept)) between 3 and 500),
 amount numeric(14,2) not null check(amount > 0 and amount <= 999999999999.99),
 account text not null check(account in ('Efectivo','Banco','Billetera virtual')),
 project_id uuid references public.projects(id) on delete set null,
 receipt_path text, notes text check(length(notes)<=2000),
 created_by uuid not null references public.app_users(id), created_by_name text not null,
 created_at timestamptz not null default now(),
 voided_at timestamptz, voided_by uuid references public.app_users(id), voided_by_name text, void_reason text,
 check((voided_at is null and voided_by is null and void_reason is null and voided_by_name is null)
 or (voided_at is not null and voided_by is not null and length(btrim(void_reason))>=3 and voided_by_name is not null))
);
create index if not exists finance_date_idx on public.finance_transactions(transaction_date desc,created_at desc);
alter table public.finance_transactions enable row level security;
revoke all on public.finance_transactions from authenticated,anon;
grant select,insert on public.finance_transactions to authenticated;
drop policy if exists "staff read finances" on public.finance_transactions;
create policy "staff read finances" on public.finance_transactions for select to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]));
drop policy if exists "admins register finances" on public.finance_transactions;
create policy "admins register finances" on public.finance_transactions for insert to authenticated
 with check(public.has_role(array['superadmin','admin']::public.app_role[]) and created_by=auth.uid() and voided_at is null);

create or replace function public.finance_stamp() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if TG_OP='INSERT' then
  if not public.has_role(array['superadmin','admin']::public.app_role[]) then raise exception 'Sin permiso para registrar movimientos'; end if;
  new.created_by:=auth.uid();
  select full_name into new.created_by_name from public.app_users where id=auth.uid();
  new.created_at:=now();new.voided_at:=null;new.voided_by:=null;new.voided_by_name:=null;new.void_reason:=null;
  if new.receipt_path is not null then
   if split_part(new.receipt_path,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='finance-receipts' and name=new.receipt_path) then
    raise exception 'Comprobante inválido';
   end if;
  end if;
 elsif TG_OP='UPDATE' then
  -- Sólo se permite anular; una corrección se registra como un nuevo movimiento.
  if (to_jsonb(new)-array['voided_at','voided_by','voided_by_name','void_reason','project_id'])<>(to_jsonb(old)-array['voided_at','voided_by','voided_by_name','void_reason','project_id']) then raise exception 'Los movimientos son inmutables'; end if;
  -- Una eliminación de proyecto sólo puede limpiar su vínculo.
  if new.project_id is distinct from old.project_id and not (new.project_id is null and new.voided_at is not distinct from old.voided_at) then raise exception 'Vínculo de proyecto inmutable'; end if;
 end if;
 return new;
end $$;
drop trigger if exists finance_stamp_trigger on public.finance_transactions;
create trigger finance_stamp_trigger before insert or update on public.finance_transactions for each row execute function public.finance_stamp();

create or replace function public.void_finance_transaction(transaction_id uuid,reason text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.has_role(array['superadmin','admin']::public.app_role[]) then raise exception 'Sin permiso para anular'; end if;
 if length(btrim(reason))<3 or length(reason)>500 or reason is null then raise exception 'Indicá el motivo de la anulación (3 a 500 caracteres)'; end if;
 update public.finance_transactions set voided_at=now(),voided_by=auth.uid(),voided_by_name=(select full_name from public.app_users where id=auth.uid()),void_reason=btrim(reason) where id=transaction_id and voided_at is null;
 if not found then raise exception 'Movimiento inexistente o ya anulado'; end if;
end $$;
revoke all on function public.void_finance_transaction(uuid,text) from public,anon;
grant execute on function public.void_finance_transaction(uuid,text) to authenticated;
revoke all on function public.finance_stamp() from public,anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('finance-receipts','finance-receipts',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
drop policy if exists "staff read finance receipts" on storage.objects;
create policy "staff read finance receipts" on storage.objects for select to authenticated
 using(bucket_id='finance-receipts' and public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]));
drop policy if exists "admins upload finance receipts" on storage.objects;
create policy "admins upload finance receipts" on storage.objects for insert to authenticated
 with check(bucket_id='finance-receipts' and split_part(name,'/',1)=auth.uid()::text and public.has_role(array['superadmin','admin']::public.app_role[]));
drop policy if exists "admins clean unused finance receipts" on storage.objects;
create policy "admins clean unused finance receipts" on storage.objects for delete to authenticated
 using(bucket_id='finance-receipts' and split_part(name,'/',1)=auth.uid()::text and public.has_role(array['superadmin','admin']::public.app_role[]) and not exists(select 1 from public.finance_transactions where receipt_path=name));
commit;
