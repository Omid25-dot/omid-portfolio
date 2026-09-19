-- DEVELOPMENT ONLY: explicit demo policies, not approved live trading terms.
-- Does not overwrite existing configuration. No equipment or bookings created.
begin;
insert into public.platform_settings(key,value,description,is_demo) values
 ('booking_min_days','1','Demo minimum hire days',true),
 ('booking_max_days','366','Demo maximum hire days',true),
 ('booking_hold_minutes','30','Demo request/approval/payment hold; no extension on transition',true),
 ('rental_service_fee','0','Demo service fee in GBP pennies',true),
 ('rental_tax_policy','"no_tax_configured"','Demo only: no tax calculated; review before trading',true)
 on conflict(key) do nothing;
commit;
