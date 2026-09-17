-- DEVELOPMENT ONLY. Demo values are not approved live trading policies.
begin;
insert into public.categories(name,slug,description,active,display_order,is_demo) values
 ('Plant & Machinery','plant-machinery','Demo category',true,1,true),
 ('Power Tools','power-tools','Demo category',true,2,true),
 ('Cleaning','cleaning','Demo category',true,3,true),
 ('Landscaping','landscaping','Demo category',true,4,true),
 ('Access Equipment','access-equipment','Demo category',true,5,true),
 ('Site Equipment','site-equipment','Demo category',true,6,true)
 on conflict(slug) do nothing;
insert into public.service_areas(id,name,slug,active,is_demo) values
 ('10000000-0000-4000-8000-000000000001','Glasgow (demo)','glasgow-demo',true,true) on conflict do nothing;
insert into public.locations(id,service_area_id,name,reference,address,postcode,active,is_demo) values
 ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Demo depot — not a collection address','DEMO-GLA', '{"city":"Glasgow","country":"GB"}','G1 1AA',false,true) on conflict do nothing;
insert into public.owners(id,owner_type,company_name,contact_name,email,commission_bps,notes,is_demo) values
 ('10000000-0000-4000-8000-000000000003','company','ABC Groundworks Ltd (demo)','Demo contact','owner@example.invalid',1500,'Development fixture only. No real payout details.',true) on conflict do nothing;
-- Company equipment uses ownership_type=COMPANY and owner_id=NULL; no artificial owner needed.
insert into public.platform_settings(key,value,description,is_demo) values
 ('brand_name','"Equipment hire — demo"','Demo brand',true),
 ('default_currency','"GBP"','Initial currency',true),
 ('default_timezone','"Europe/London"','Initial operating timezone',true),
 ('default_commission_bps','1500','Demo only, not an approved trading rate',true),
 ('default_service_region','"glasgow-demo"','Demo service region',true)
 on conflict(key) do nothing;
commit;
