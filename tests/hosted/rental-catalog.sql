-- Read-only catalogue assertions; safe on the linked development project.
do $$
declare f record; t text;
begin
 foreach t in array array['bookings','booking_status_history','availability_blocks'] loop
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t and c.relrowsecurity) then raise exception 'Missing RLS on %',t; end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename=t) then raise exception 'Missing policy on %',t; end if;
  if has_table_privilege('anon','public.'||t,'SELECT') or has_table_privilege('authenticated','public.'||t,'UPDATE') or has_table_privilege('authenticated','public.'||t,'INSERT') then raise exception 'Unsafe grant on %',t; end if;
 end loop;
 if not exists(select 1 from pg_constraint where conrelid='public.bookings'::regclass and conname='bookings_no_overlap' and contype='x') then raise exception 'Missing exclusion constraint'; end if;
 foreach t in array array['owner_id_snapshot','ownership_type_snapshot','commission_bps_snapshot','commission_amount_snapshot','owner_net_snapshot','pricing_snapshot'] loop
  if has_column_privilege('authenticated','public.bookings',t,'SELECT') then raise exception 'Internal booking column exposed: %',t; end if;
 end loop;
 foreach t in array array['bookings_customer_date','bookings_status','bookings_expiry','bookings_equipment_dates','booking_history_booking','availability_blocks_range'] loop
  if to_regclass('public.'||t) is null then raise exception 'Missing index: %',t; end if;
 end loop;
 for f in select p.oid,n.nspname,p.proname,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where p.proname in ('quote_rental','create_rental_booking','transition_rental_booking','create_availability_block','rental_availability','expire_booking_holds','rental_quote','rental_setting','guard_booking','booking_history','guard_block','expire_equipment_holds') and n.nspname in ('public','private') loop
  if has_function_privilege('anon',f.oid,'EXECUTE') then raise exception 'Anonymous execution granted: %',f.proname; end if;
  if f.nspname='private' and has_function_privilege('authenticated',f.oid,'EXECUTE') then raise exception 'Private function callable: %',f.proname; end if;
  if f.proconfig is null or not exists(select 1 from unnest(f.proconfig) c where c like 'search_path=%') then raise exception 'Missing fixed search path: %',f.proname; end if;
 end loop;
 if has_function_privilege('authenticated','public.expire_booking_holds()','EXECUTE') then raise exception 'User-callable privileged sweeper'; end if;
end $$;
select 'Phase 2 RLS, policies, grants, exclusion, indexes and function boundaries passed' as result;
