begin;
-- Preserve reservations when the entire asset becomes unavailable; flag them for staff.
-- Invoker security retains the Phase 1 equipment RLS and Phase 2 booking/blocks RLS.
create or replace view public.booking_availability_conflicts with (security_invoker=true) as
 select b.id booking_id,a.id block_id,'availability_block'::text reason
 from public.bookings b join public.availability_blocks a
 on b.equipment_id=a.equipment_id and daterange(b.start_date,b.end_date,'[)') && a.period
 where b.status in ('REQUESTED','APPROVED','PAYMENT_PENDING','CONFIRMED','CHECKED_OUT','DISPUTED')
 and (b.hold_expires_at is null or b.hold_expires_at>now())
 union all
 select b.id,null::uuid,'operational_status'::text
 from public.bookings b join public.equipment e on b.equipment_id=e.id
 where e.operational_status in ('MAINTENANCE','UNAVAILABLE','ARCHIVED')
 and b.status in ('REQUESTED','APPROVED','PAYMENT_PENDING','CONFIRMED','CHECKED_OUT','DISPUTED')
 and (b.hold_expires_at is null or b.hold_expires_at>now());
revoke all on public.booking_availability_conflicts from public,anon;
grant select on public.booking_availability_conflicts to authenticated;
commit;
