begin;
-- Idempotency and customer-facing handover details, never a public read table.
create table private.customer_booking_requests (
 customer_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null,
 booking_id uuid not null unique references public.bookings(id) on delete cascade,
 customer_snapshot jsonb not null,
 equipment_snapshot jsonb not null,
 terms_version text not null check(terms_version='request-v1'),
 accepted_at timestamptz not null default now(),
 primary key(customer_id,request_id)
);
alter table private.customer_booking_requests enable row level security;
revoke all on private.customer_booking_requests from public,anon,authenticated;

create function public.booking_collection_info(p_equipment uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',l.name,'postcode',l.postcode,'city',coalesce(l.address->>'city',a.name),'is_demo',l.is_demo)
 from public.equipment e join public.locations l on l.id=e.base_location_id join public.service_areas a on a.id=l.service_area_id
 where e.id=p_equipment and private.catalogue_eligible(e.id) and l.collection_available
 and private.has_role(array['customer','staff','admin','super_admin']);
$$;

create function public.request_customer_booking(p_equipment uuid,p_start date,p_end date,p_request uuid,p_expected_quote jsonb,
 p_first_name text,p_last_name text,p_phone text,p_terms boolean) returns text
language plpgsql security definer set search_path='' as $$
declare result uuid; b public.bookings; safe_quote jsonb; snapshot jsonb;
begin
 -- Consistent profile -> equipment lock ordering; also serialises same-customer retries.
 perform id from public.profiles where id=auth.uid() for update;
 if not private.has_role(array['customer','staff','admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 if p_request is null or p_terms is distinct from true or length(trim(coalesce(p_first_name,''))) not between 1 and 80
 or length(trim(coalesce(p_last_name,''))) not between 1 and 80 or length(coalesce(p_phone,'')) not between 5 and 30
 or p_phone !~ '^[+0-9 ()-]+$' then raise check_violation using message='Invalid customer details'; end if;
 select bk.* into b from private.customer_booking_requests r join public.bookings bk on bk.id=r.booking_id
 where r.customer_id=auth.uid() and r.request_id=p_request;
 if found then
  if b.equipment_id is distinct from p_equipment or b.start_date is distinct from p_start or b.end_date is distinct from p_end then
   raise check_violation using message='Invalid request'; end if;
  return b.reference;
 end if;
 perform id from public.equipment where id=p_equipment for update;
 if not private.catalogue_eligible(p_equipment) then raise exception using errcode='23P01',message='EQUIPMENT_UNAVAILABLE'; end if;
 -- The proven engine does all pricing, ownership, availability, locking and audit work.
 result:=public.create_rental_booking(p_equipment,p_start,p_end,'collection');
 select * into strict b from public.bookings where id=result;
 safe_quote:=b.pricing_snapshot-array['ownership_type','owner_id','commission_bps','commission_amount','owner_net','commission_base'];
 -- Compare the actual snapshot, not a separate precheck vulnerable to settings races.
 if safe_quote is distinct from p_expected_quote then raise exception using errcode='P0001',message='QUOTE_CHANGED'; end if;
 snapshot:=jsonb_build_object('title',(select title from public.equipment where id=p_equipment),
  'image',(select storage_path from public.equipment_images where equipment_id=p_equipment and storage_path ~ '^catalogue/[a-zA-Z0-9/_-]+\.(webp|jpg|png|avif)$' order by is_primary desc,display_order,id limit 1),
  'collection',public.booking_collection_info(p_equipment),
  'verification_required',(select verification_required from public.equipment where id=p_equipment));
 update public.profiles set first_name=trim(p_first_name),last_name=trim(p_last_name),phone=trim(p_phone) where id=auth.uid();
 insert into private.customer_booking_requests values(auth.uid(),p_request,result,
 jsonb_build_object('first_name',trim(p_first_name),'last_name',trim(p_last_name),'phone',trim(p_phone)),snapshot,'request-v1',now());
 return b.reference;
end $$;

-- Extend the existing authoritative transition service with one narrowly scoped customer path.
do $$ declare body text; guard text;
begin
 select prosrc into strict body from pg_proc where oid='public.transition_rental_booking(uuid,text,text)'::regprocedure;
 guard:='if not private.has_role(array[''staff'',''admin'',''super_admin'']) then raise insufficient_privilege using message=''Forbidden''; end if;';
 if strpos(body,guard)=0 then raise exception 'Transition source changed; review migration'; end if;
 body:=replace(body,guard,$customer$
 if not private.has_role(array['staff','admin','super_admin']) then
  if not private.has_role(array['customer']) or p_status is distinct from 'CANCELLED' then raise insufficient_privilege using message='Forbidden'; end if;
  perform private.limit_mutation('booking-cancel');
  select equipment_id into asset from public.bookings where id=p_booking and customer_id=auth.uid();
  if asset is null then raise insufficient_privilege using message='Forbidden'; end if;
  perform id from public.equipment where id=asset for update;
  perform private.expire_equipment_holds(asset);
  select * into b from public.bookings where id=p_booking and customer_id=auth.uid() for update;
  if b.status='CANCELLED' then return; end if;
  if b.status<>'REQUESTED' or not private.booking_transition_allowed(b.status,'CANCELLED') then raise check_violation using message='Contact support to cancel'; end if;
  update public.bookings set status='CANCELLED',capacity_reserved=false,hold_expires_at=null,cancelled_at=now(),cancelled_by=auth.uid(),cancellation_reason='Customer withdrew unpaid request' where id=p_booking;
  return;
 end if;
 $customer$);
 execute format('create or replace function public.transition_rental_booking(p_booking uuid,p_status text,p_reason text default null) returns void language plpgsql security definer set search_path='''' as %L',body);
end $$;

create function public.cancel_customer_booking(p_reference text) returns void
language plpgsql security definer set search_path='' as $$
declare b public.bookings;
begin
 perform id from public.profiles where id=auth.uid() for update;
 if not private.has_role(array['customer','staff','admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 select * into b from public.bookings where reference=p_reference and customer_id=auth.uid();
 if not found then raise insufficient_privilege using message='Forbidden'; end if;
 perform id from public.equipment where id=b.equipment_id for update;
 select * into b from public.bookings where id=b.id for update;
 if b.status='CANCELLED' then return; end if;
 if b.status<>'REQUESTED' then raise check_violation using message='Contact support to cancel'; end if;
 perform public.transition_rental_booking(b.id,'CANCELLED','Customer withdrew unpaid request');
end $$;

create function private.customer_booking_item(p_booking uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('reference',b.reference,'days',b.end_date-b.start_date,'start_date',b.start_date,'end_date',b.end_date,'status',b.status,
 'fulfilment_method',b.fulfilment_method,'rental_subtotal',b.rental_subtotal,'delivery_fee',b.delivery_fee,'service_fee',b.service_fee,
 'security_deposit',b.security_deposit,'total_payable',b.total_payable,'hold_expires_at',b.hold_expires_at,'created_at',b.created_at,
 'title',coalesce(r.equipment_snapshot->>'title',e.title),'image',r.equipment_snapshot->>'image',
 'collection',r.equipment_snapshot->'collection','verification_required',coalesce((r.equipment_snapshot->>'verification_required')::boolean,e.verification_required),
 'history',coalesce((select jsonb_agg(jsonb_build_object('status',h.new_status,'at',h.created_at) order by h.created_at,h.id) from public.booking_status_history h where h.booking_id=b.id),'[]'::jsonb))
 from public.bookings b join public.equipment e on e.id=b.equipment_id left join private.customer_booking_requests r on r.booking_id=b.id
 where b.id=p_booking and b.customer_id=auth.uid()
 and exists(select 1 from public.profiles where id=auth.uid() and account_status<>'suspended');
$$;
create function public.customer_booking_detail(p_reference text) returns jsonb
language sql stable security definer set search_path='' as $$
 select private.customer_booking_item(id) from public.bookings where reference=p_reference and customer_id=auth.uid();
$$;
create function public.customer_booking_list(p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and account_status<>'suspended') then raise insufficient_privilege using message='Forbidden'; end if;
 if p_page is null or p_page<1 or p_page>10000 then raise invalid_parameter_value using message='Invalid page'; end if;
 select jsonb_build_object('total',(select count(*) from public.bookings where customer_id=auth.uid()),'items',coalesce(jsonb_agg(private.customer_booking_item(id) order by created_at desc,id),'[]'::jsonb)) into result
 from (select id,created_at from public.bookings where customer_id=auth.uid() order by created_at desc,id limit 20 offset (p_page-1)*20) b;
 return result;
end $$;
revoke all on function private.customer_booking_item(uuid) from public,anon,authenticated;
revoke all on function public.booking_collection_info(uuid),public.request_customer_booking(uuid,date,date,uuid,jsonb,text,text,text,boolean),public.cancel_customer_booking(text),public.customer_booking_detail(text),public.customer_booking_list(integer) from public,anon;
grant execute on function public.booking_collection_info(uuid),public.request_customer_booking(uuid,date,date,uuid,jsonb,text,text,text,boolean),public.cancel_customer_booking(text),public.customer_booking_detail(text),public.customer_booking_list(integer) to authenticated;
commit;
