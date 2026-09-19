begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

create table public.bookings (
 id uuid primary key default gen_random_uuid(),
 reference text not null unique default ('RNT-' || upper(replace(gen_random_uuid()::text,'-',''))),
 equipment_id uuid not null references public.equipment(id),
 customer_id uuid not null references public.profiles(id),
 start_date date not null, end_date date not null,
 hire_period daterange generated always as (daterange(start_date,end_date,'[)')) stored,
 status text not null default 'REQUESTED' check(status in ('REQUESTED','APPROVED','PAYMENT_PENDING','CONFIRMED','CHECKED_OUT','RETURNED','COMPLETED','DECLINED','CANCELLED','DISPUTED')),
 fulfilment_method text not null check(fulfilment_method in ('collection','delivery')),
 delivery_postcode text, delivery_address jsonb,
 currency text not null check(currency='GBP'),
 rental_subtotal integer not null check(rental_subtotal>=0),
 delivery_fee integer not null check(delivery_fee>=0), service_fee integer not null check(service_fee>=0),
 discount_amount integer not null default 0 check(discount_amount=0),
 security_deposit integer not null check(security_deposit>=0),
 total_payable integer not null check(total_payable>=0),
 ownership_type_snapshot text not null check(ownership_type_snapshot in ('COMPANY','THIRD_PARTY')),
 owner_id_snapshot uuid references public.owners(id),
 commission_bps_snapshot integer check(commission_bps_snapshot between 0 and 10000),
 commission_amount_snapshot integer not null check(commission_amount_snapshot>=0),
 owner_net_snapshot integer not null check(owner_net_snapshot>=0),
 pricing_snapshot jsonb not null check(jsonb_typeof(pricing_snapshot)='object'),
 capacity_reserved boolean not null default true,
 hold_expires_at timestamptz,
 dispute_previous_status text,
 cancelled_at timestamptz, cancelled_by uuid references public.profiles(id), cancellation_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(isfinite(start_date) and isfinite(end_date) and end_date>start_date and end_date-start_date<=366),
 check(total_payable::bigint=rental_subtotal::bigint+delivery_fee+service_fee+security_deposit-discount_amount),
 check((fulfilment_method='collection' and delivery_postcode is null and delivery_address is null) or
       (fulfilment_method='delivery' and delivery_postcode is not null and jsonb_typeof(delivery_address)='object')),
 check((ownership_type_snapshot='COMPANY' and owner_id_snapshot is null and commission_bps_snapshot is null and commission_amount_snapshot=0 and owner_net_snapshot=0) or
       (ownership_type_snapshot='THIRD_PARTY' and owner_id_snapshot is not null and commission_bps_snapshot is not null and commission_amount_snapshot::bigint+owner_net_snapshot=rental_subtotal)),
 constraint bookings_no_overlap exclude using gist (equipment_id with =, hire_period with &&) where (capacity_reserved)
);
create index bookings_customer_date on public.bookings(customer_id,created_at desc);
create index bookings_status on public.bookings(status);
create index bookings_expiry on public.bookings(hold_expires_at) where capacity_reserved and hold_expires_at is not null;
create index bookings_equipment_dates on public.bookings(equipment_id,start_date,end_date);

create table public.booking_status_history (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id),
 previous_status text, new_status text not null, actor_id uuid references public.profiles(id),
 reason text check(length(reason)<=1000), created_at timestamptz not null default now(),
 check(previous_status is null or previous_status in ('REQUESTED','APPROVED','PAYMENT_PENDING','CONFIRMED','CHECKED_OUT','RETURNED','COMPLETED','DECLINED','CANCELLED','DISPUTED')),
 check(new_status in ('REQUESTED','APPROVED','PAYMENT_PENDING','CONFIRMED','CHECKED_OUT','RETURNED','COMPLETED','DECLINED','CANCELLED','DISPUTED'))
);
create index booking_history_booking on public.booking_status_history(booking_id,created_at);
create table public.availability_blocks (
 id uuid primary key default gen_random_uuid(), equipment_id uuid not null references public.equipment(id),
 start_date date not null, end_date date not null,
 period daterange generated always as (daterange(start_date,end_date,'[)')) stored,
 type text not null check(type in ('maintenance','servicing','repair','internal_use','unavailable','manual_block')),
 reason text not null check(length(trim(reason)) between 1 and 1000),
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(isfinite(start_date) and isfinite(end_date) and end_date>start_date)
);
create index availability_blocks_range on public.availability_blocks using gist(equipment_id,period);

alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.availability_blocks enable row level security;
revoke all on public.bookings,public.booking_status_history,public.availability_blocks from public,anon,authenticated;
grant all on public.bookings,public.booking_status_history,public.availability_blocks to service_role;
-- RLS does not hide columns. Explicit column grants protect internal snapshots, even via PostgREST.
grant select(id,reference,equipment_id,customer_id,start_date,end_date,status,fulfilment_method,
 delivery_postcode,delivery_address,currency,rental_subtotal,delivery_fee,service_fee,discount_amount,
 security_deposit,total_payable,hold_expires_at,created_at,updated_at) on public.bookings to authenticated;
create policy bookings_read on public.bookings for select to authenticated using
 (customer_id=(select auth.uid()) or private.has_role(array['staff','admin','super_admin']));
grant select(id,booking_id,previous_status,new_status,created_at) on public.booking_status_history to authenticated;
create policy history_read on public.booking_status_history for select to authenticated using
 (exists(select 1 from public.bookings b where b.id=booking_id));
grant select on public.availability_blocks to authenticated;
create policy blocks_operational_read on public.availability_blocks for select to authenticated using(private.has_role(array['staff','admin','super_admin']));

create function private.booking_transition_allowed(old_status text,new_status text) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(case old_status
 when 'REQUESTED' then new_status in ('APPROVED','DECLINED','CANCELLED')
 when 'APPROVED' then new_status in ('PAYMENT_PENDING','CANCELLED')
 when 'PAYMENT_PENDING' then new_status in ('CONFIRMED','CANCELLED')
 when 'CONFIRMED' then new_status in ('CHECKED_OUT','CANCELLED','DISPUTED')
 when 'CHECKED_OUT' then new_status in ('RETURNED','DISPUTED')
 when 'RETURNED' then new_status in ('COMPLETED','DISPUTED')
 when 'COMPLETED' then new_status='DISPUTED'
 when 'DISPUTED' then new_status in ('CONFIRMED','CHECKED_OUT','RETURNED','COMPLETED')
 else false end,false);
$$;

create function private.guard_booking() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then
  if (to_jsonb(new)-array['hire_period','status','capacity_reserved','hold_expires_at','dispute_previous_status','cancelled_at','cancelled_by','cancellation_reason','updated_at'])
     is distinct from (to_jsonb(old)-array['hire_period','status','capacity_reserved','hold_expires_at','dispute_previous_status','cancelled_at','cancelled_by','cancellation_reason','updated_at']) then
   raise exception using errcode='23514',message='Booking snapshots are immutable';
  end if;
  if new.status<>old.status and not private.booking_transition_allowed(old.status,new.status) then
   raise exception using errcode='23514',message='Invalid booking transition';
  end if;
 end if;
 -- Every reservation write shares the equipment lock with blocks and operational changes.
 perform id from public.equipment where id=new.equipment_id for update;
 if new.capacity_reserved and (tg_op='INSERT' or not old.capacity_reserved) then
  if exists(select 1 from public.equipment where id=new.equipment_id and operational_status in ('MAINTENANCE','UNAVAILABLE','ARCHIVED')) or
     exists(select 1 from public.availability_blocks where equipment_id=new.equipment_id and period && daterange(new.start_date,new.end_date,'[)')) then
   raise exception using errcode='23P01',message='Equipment unavailable';
  end if;
 end if;
 new.updated_at:=now(); return new;
end $$;
create trigger booking_guard before insert or update on public.bookings for each row execute function private.guard_booking();

create function private.booking_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' or new.status is distinct from old.status then
  insert into public.booking_status_history(booking_id,previous_status,new_status,actor_id,reason)
  values(new.id,case when tg_op='INSERT' then null else old.status end,new.status,auth.uid(),new.cancellation_reason);
  perform private.append_audit(auth.uid(),case when tg_op='INSERT' then 'booking.created' else 'booking.status_changed' end,
    'booking',new.id,case when tg_op='INSERT' then null else jsonb_build_object('status',old.status) end,jsonb_build_object('status',new.status),'{}');
 end if; return new;
end $$;
create trigger booking_history after insert or update on public.bookings for each row execute function private.booking_history();

create function private.guard_block() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.equipment_id<>old.equipment_id then raise check_violation using message='Cannot move a block'; end if;
 perform id from public.equipment where id=case when tg_op='DELETE' then old.equipment_id else new.equipment_id end for update;
 if tg_op='DELETE' then return old; end if;
 new.updated_at:=now(); return new;
end $$;
create trigger block_guard before insert or update or delete on public.availability_blocks for each row execute function private.guard_block();

create function private.expire_equipment_holds(p_equipment uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform id from public.equipment where id=p_equipment for update;
 update public.bookings set status='CANCELLED',capacity_reserved=false,hold_expires_at=null,
 cancelled_at=now(),cancelled_by=auth.uid(),cancellation_reason='Reservation hold expired'
 where equipment_id=p_equipment and capacity_reserved and status in ('REQUESTED','APPROVED','PAYMENT_PENDING') and hold_expires_at<=now();
end $$;
create function public.expire_booking_holds() returns void language plpgsql security definer set search_path='' as $$
declare asset uuid;
begin
 for asset in select distinct equipment_id from public.bookings where capacity_reserved and hold_expires_at<=now() order by equipment_id limit 100 loop
  perform private.expire_equipment_holds(asset);
 end loop;
end $$;
revoke all on function public.expire_booking_holds() from public,anon,authenticated;
grant execute on function public.expire_booking_holds() to service_role;

-- Required settings fail closed; no unapproved production pricing defaults.
create function private.rental_setting(p_key text,p_min integer,p_max integer) returns integer
language plpgsql stable security definer set search_path='' as $$
declare v jsonb; n numeric;
begin
 select value into v from public.platform_settings where key=p_key;
 if v is null or jsonb_typeof(v)<>'number' then raise exception using errcode='P0001',message='RENTAL_CONFIGURATION_REQUIRED'; end if;
 n:=(v::text)::numeric;
 if n<>trunc(n) or n<p_min or n>p_max then raise exception using errcode='P0001',message='RENTAL_CONFIGURATION_REQUIRED'; end if;
 return n::integer;
end $$;

create function private.rental_quote(p_equipment uuid,p_start date,p_end date,p_method text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e public.equipment; o public.owners; days integer; subtotal bigint; weekly bigint; fee integer; bps integer; commission bigint; total bigint;
begin
 if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end) or p_end<=p_start or p_start<(now() at time zone 'Europe/London')::date or p_end-p_start>366 then
  raise exception using errcode='22023',message='INVALID_HIRE_DATES'; end if;
 days:=p_end-p_start;
 if days<private.rental_setting('booking_min_days',1,366) or days>private.rental_setting('booking_max_days',1,366) then raise exception using errcode='22023',message='INVALID_HIRE_DATES'; end if;
 select * into e from public.equipment where id=p_equipment for share;
 if not found or not e.listed or e.operational_status in ('MAINTENANCE','UNAVAILABLE','ARCHIVED') then raise exception using errcode='23P01',message='EQUIPMENT_UNAVAILABLE'; end if;
 if p_method is distinct from 'collection' then raise exception using errcode='P0001',message='DELIVERY_QUOTE_REQUIRED'; end if;
 if not e.collection_eligible or not exists(select 1 from public.locations l join public.service_areas a on a.id=l.service_area_id where l.id=e.base_location_id and l.active and l.collection_available and a.active) then raise exception using errcode='22023',message='COLLECTION_UNAVAILABLE'; end if;
 if not exists(select 1 from public.platform_settings where key='default_currency' and value='"GBP"') or
    not exists(select 1 from public.platform_settings where key='rental_tax_policy' and value='"no_tax_configured"') then raise exception using errcode='P0001',message='RENTAL_CONFIGURATION_REQUIRED'; end if;
 subtotal:=days::bigint*e.daily_rate;
 -- Complete seven-day blocks only. A partial week uses the daily rate; never charge more than all-daily.
 if e.weekly_rate is not null then
  weekly:=(days/7)::bigint*e.weekly_rate+(days%7)::bigint*e.daily_rate;
  subtotal:=least(subtotal,weekly);
 end if;
 fee:=private.rental_setting('rental_service_fee',0,100000000);
 if e.ownership_type='THIRD_PARTY' then
  select * into o from public.owners where id=e.owner_id for share;
  if not found or not o.active then raise exception using errcode='23P01',message='EQUIPMENT_UNAVAILABLE'; end if;
  bps:=coalesce(e.commission_override_bps,o.commission_bps,private.rental_setting('default_commission_bps',0,10000));
  commission:=(subtotal*bps+5000)/10000; -- half-up to a penny; rental only
 else commission:=0; end if;
 total:=subtotal+fee+e.security_deposit;
 if total>2147483647 then raise exception using errcode='22003',message='PRICE_OUT_OF_RANGE'; end if;
 return jsonb_build_object('version',1,'timezone','Europe/London','end_exclusive',true,'days',days,'daily_rate',e.daily_rate,'weekly_rate',e.weekly_rate,
  'weekly_rule','complete_weeks_lowest_total','rental_subtotal',subtotal,'delivery_fee',0,'service_fee',fee,'discount_amount',0,'tax_amount',0,'tax_policy','no_tax_configured',
  'security_deposit',e.security_deposit,'total_payable',total,'currency','GBP','ownership_type',e.ownership_type,'owner_id',e.owner_id,
  'commission_bps',bps,'commission_amount',commission,'owner_net',case when e.ownership_type='THIRD_PARTY' then subtotal-commission else 0 end,'commission_base','rental_subtotal');
end $$;

create function public.quote_rental(p_equipment uuid,p_start date,p_end date,p_method text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q jsonb;
begin
 if not private.has_role(array['customer','staff','admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 q:=private.rental_quote(p_equipment,p_start,p_end,p_method);
 return q-array['ownership_type','owner_id','commission_bps','commission_amount','owner_net','commission_base'];
end $$;

create function public.create_rental_booking(p_equipment uuid,p_start date,p_end date,p_method text) returns uuid
language plpgsql security definer set search_path='' as $$
declare q jsonb; result uuid; hold_minutes integer;
begin
 perform id from public.profiles where id=auth.uid() for share;
 if not private.has_role(array['customer','staff','admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 perform private.limit_mutation('booking-create');
 perform id from public.equipment where id=p_equipment for update;
 perform private.expire_equipment_holds(p_equipment);
 q:=private.rental_quote(p_equipment,p_start,p_end,p_method);
 hold_minutes:=private.rental_setting('booking_hold_minutes',1,1440);
 if exists(select 1 from public.bookings where equipment_id=p_equipment and capacity_reserved and hire_period && daterange(p_start,p_end,'[)')) or
    exists(select 1 from public.availability_blocks where equipment_id=p_equipment and period && daterange(p_start,p_end,'[)')) then
  raise exception using errcode='23P01',message='EQUIPMENT_UNAVAILABLE'; end if;
 insert into public.bookings(equipment_id,customer_id,start_date,end_date,fulfilment_method,currency,rental_subtotal,delivery_fee,service_fee,discount_amount,security_deposit,total_payable,
 ownership_type_snapshot,owner_id_snapshot,commission_bps_snapshot,commission_amount_snapshot,owner_net_snapshot,pricing_snapshot,hold_expires_at)
 values(p_equipment,auth.uid(),p_start,p_end,p_method,'GBP',(q->>'rental_subtotal')::integer,0,(q->>'service_fee')::integer,0,(q->>'security_deposit')::integer,(q->>'total_payable')::integer,
 q->>'ownership_type',(q->>'owner_id')::uuid,(q->>'commission_bps')::integer,(q->>'commission_amount')::integer,(q->>'owner_net')::integer,q,now()+make_interval(mins=>hold_minutes)) returning id into result;
 return result;
end $$;

create function public.transition_rental_booking(p_booking uuid,p_status text,p_reason text default null) returns void
language plpgsql security definer set search_path='' as $$
declare b public.bookings; asset uuid;
begin
 perform id from public.profiles where id=auth.uid() for share;
 if not private.has_role(array['staff','admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 perform private.limit_mutation('booking-transition');
 if p_status is null or length(coalesce(p_reason,''))>1000 then raise check_violation using message='Invalid transition'; end if;
 select equipment_id into asset from public.bookings where id=p_booking;
 perform id from public.equipment where id=asset for update;
 perform private.expire_equipment_holds(asset);
 select * into b from public.bookings where id=p_booking for update;
 if not found or not private.booking_transition_allowed(b.status,p_status) then raise check_violation using message='Invalid transition'; end if;
 if p_status in ('CANCELLED','DECLINED','DISPUTED') and length(trim(coalesce(p_reason,'')))=0 then raise check_violation using message='Reason required'; end if;
 if p_status in ('CANCELLED','DISPUTED','COMPLETED') and not private.has_role(array['admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 -- No caller may fabricate successful payment, Identity or inspection completion in Phase 2.
 if p_status in ('CONFIRMED','COMPLETED') then raise exception using errcode='P0001',message='INTEGRATION_REQUIRED'; end if;
 if b.status='DISPUTED' and p_status is distinct from b.dispute_previous_status then raise check_violation using message='Invalid dispute resolution'; end if;
 if p_status in ('APPROVED','PAYMENT_PENDING','CHECKED_OUT') and (
  exists(select 1 from public.equipment where id=asset and operational_status in ('MAINTENANCE','UNAVAILABLE','ARCHIVED')) or
  exists(select 1 from public.availability_blocks where equipment_id=asset and period && b.hire_period)) then raise exception using errcode='23P01',message='EQUIPMENT_UNAVAILABLE'; end if;
 update public.bookings set status=p_status,
 capacity_reserved=case when p_status in ('CANCELLED','DECLINED','RETURNED','COMPLETED') then false else capacity_reserved end,
 hold_expires_at=case when p_status in ('REQUESTED','APPROVED','PAYMENT_PENDING') then hold_expires_at else null end,
 dispute_previous_status=case when p_status='DISPUTED' then status when status='DISPUTED' then null else dispute_previous_status end,
 cancelled_at=case when p_status='CANCELLED' then now() else cancelled_at end,
 cancelled_by=case when p_status='CANCELLED' then auth.uid() else cancelled_by end,
 cancellation_reason=case when p_status='CANCELLED' then p_reason else cancellation_reason end
 where id=p_booking;
 update public.booking_status_history set reason=p_reason where booking_id=p_booking and new_status=p_status and created_at=now();
end $$;

create function public.create_availability_block(p_equipment uuid,p_start date,p_end date,p_type text,p_reason text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform id from public.profiles where id=auth.uid() for share;
 if not private.has_role(array['staff','admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 perform private.limit_mutation('availability-block');
 perform id from public.equipment where id=p_equipment for update;
 insert into public.availability_blocks(equipment_id,start_date,end_date,type,reason,created_by)
 values(p_equipment,p_start,p_end,p_type,p_reason,auth.uid()) returning id into result;
 perform private.append_audit(auth.uid(),'availability.block_created','availability_block',result,null,null,jsonb_build_object('equipment_id',p_equipment));
 return result;
end $$;

-- Safe availability projection: no customer, owner, block notes or reservation IDs.
create function public.rental_availability(p_equipment uuid,p_start date,p_end date) returns jsonb
language plpgsql security definer set search_path='' as $$
declare state text; periods jsonb;
begin
 if not private.has_role(array['customer','staff','admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end) or p_end<=p_start or p_end-p_start>366 then raise invalid_parameter_value using message='Invalid dates'; end if;
 select operational_status into state from public.equipment where id=p_equipment and listed;
 if state is null then return jsonb_build_object('available',false,'reason','not_available','periods','[]'::jsonb); end if;
 select coalesce(jsonb_agg(jsonb_build_object('start_date',s,'end_date',e,'reason',why) order by s,e),'[]'::jsonb) into periods from (
  select start_date s,end_date e,'reserved'::text why from public.bookings where equipment_id=p_equipment and capacity_reserved and (hold_expires_at is null or hold_expires_at>now()) and hire_period && daterange(p_start,p_end,'[)')
  union all select start_date,end_date,'availability_block' from public.availability_blocks where equipment_id=p_equipment and period && daterange(p_start,p_end,'[)')
 ) periods;
 return jsonb_build_object('available',state not in ('MAINTENANCE','UNAVAILABLE','ARCHIVED') and jsonb_array_length(periods)=0,
 'reason',case when state in ('MAINTENANCE','UNAVAILABLE','ARCHIVED') then 'operational_status' when jsonb_array_length(periods)>0 then 'dates_blocked' else null end,'periods',periods);
end $$;

-- Operational conflict report preserves bookings when maintenance overlaps them.
create view public.booking_availability_conflicts with (security_invoker=true) as
 select b.id booking_id,a.id block_id from public.bookings b join public.availability_blocks a
 on b.equipment_id=a.equipment_id and daterange(b.start_date,b.end_date,'[)') && a.period
 where b.status in ('REQUESTED','APPROVED','PAYMENT_PENDING','CONFIRMED','CHECKED_OUT','DISPUTED');
grant select on public.booking_availability_conflicts to authenticated;

revoke all on function private.booking_transition_allowed(text,text),private.guard_booking(),private.booking_history(),private.guard_block(),private.expire_equipment_holds(uuid),private.rental_setting(text,integer,integer),private.rental_quote(uuid,date,date,text) from public,anon,authenticated;
revoke all on function public.quote_rental(uuid,date,date,text),public.create_rental_booking(uuid,date,date,text),public.transition_rental_booking(uuid,text,text),public.create_availability_block(uuid,date,date,text,text),public.rental_availability(uuid,date,date) from public,anon;
grant execute on function public.quote_rental(uuid,date,date,text),public.create_rental_booking(uuid,date,date,text),public.transition_rental_booking(uuid,text,text),public.create_availability_block(uuid,date,date,text,text),public.rental_availability(uuid,date,date) to authenticated;
commit;
