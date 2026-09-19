begin;
alter table public.equipment add column customer_details jsonb not null default '{}' check(jsonb_typeof(customer_details)='object');
alter table public.service_areas add column postcode_areas text[] not null default '{}';
create index equipment_public_catalogue on public.equipment(category_id,daily_rate,slug) where listed and archived_at is null;

create function private.catalogue_eligible(p_equipment uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.equipment e join public.categories c on c.id=e.category_id
 join public.locations l on l.id=e.base_location_id join public.service_areas s on s.id=l.service_area_id
 where e.id=p_equipment and e.listed and e.archived_at is null and e.operational_status in ('AVAILABLE','RESERVED','ON_HIRE') and c.active and l.active and s.active);
$$;
-- Extract the existing Phase 2 implementation, without its caller gate, into a private core.
-- The authenticated entry point keeps its gate; anonymous public wrappers require catalogue eligibility.
do $$ declare body text;
begin
 select prosrc into strict body from pg_proc where oid='public.rental_availability(uuid,date,date)'::regprocedure;
 body:=replace(body,'if not private.has_role(array[''customer'',''staff'',''admin'',''super_admin'']) then raise insufficient_privilege using message=''Forbidden''; end if;','');
 execute format('create function private.rental_availability_core(p_equipment uuid,p_start date,p_end date) returns jsonb language plpgsql security definer set search_path='''' as %L',body);
end $$;
create or replace function public.rental_availability(p_equipment uuid,p_start date,p_end date) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not private.has_role(array['customer','staff','admin','super_admin']) then raise insufficient_privilege using message='Forbidden'; end if;
 return private.rental_availability_core(p_equipment,p_start,p_end);
end $$;
create function public.public_rental_availability(p_equipment uuid,p_start date,p_end date) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not private.catalogue_eligible(p_equipment) then return jsonb_build_object('available',false,'reason','not_available','periods','[]'::jsonb); end if;
 return private.rental_availability_core(p_equipment,p_start,p_end);
end $$;
create function public.public_rental_quote(p_equipment uuid,p_start date,p_end date,p_method text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not private.catalogue_eligible(p_equipment) then raise exception using errcode='23P01',message='EQUIPMENT_UNAVAILABLE'; end if;
 return private.rental_quote(p_equipment,p_start,p_end,p_method)-array['ownership_type','owner_id','commission_bps','commission_amount','owner_net','commission_base'];
end $$;

create function private.catalogue_item(p_id uuid,p_start date default null,p_end date default null) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',e.id,'slug',e.slug,'title',e.title,'description',e.description,'daily_rate',e.daily_rate,'weekly_rate',e.weekly_rate,
 'security_deposit',e.security_deposit,'verification_required',e.verification_required,'delivery_eligible',e.delivery_eligible,
 'collection_eligible',e.collection_eligible and l.collection_available,'category',jsonb_build_object('slug',c.slug,'name',c.name),
 'service_area',s.name,'is_demo',e.is_demo,
 'details',jsonb_build_object('included',e.customer_details->'included','requirements',e.customer_details->'requirements','operator',e.customer_details->'operator','cancellation',e.customer_details->'cancellation'),
 'images',coalesce((select jsonb_agg(jsonb_build_object('path',i.storage_path,'alt',i.alt_text) order by i.is_primary desc,i.display_order,i.id) from public.equipment_images i where i.equipment_id=e.id and i.storage_path ~ '^catalogue/[a-zA-Z0-9/_-]+\.(webp|jpg|png|avif)$'),'[]'::jsonb),
 'specifications',coalesce((select jsonb_agg(jsonb_build_object('label',sp.label,'value',sp.value,'unit',sp.unit) order by sp.display_order,sp.key) from public.equipment_specifications sp where sp.equipment_id=e.id),'[]'::jsonb),
 'availability',case when p_start is not null then private.rental_availability_core(e.id,p_start,p_end) else null end)
 from public.equipment e join public.categories c on c.id=e.category_id join public.locations l on l.id=e.base_location_id join public.service_areas s on s.id=l.service_area_id
 where e.id=p_id and private.catalogue_eligible(e.id);
$$;

create function public.catalogue_search(p_query text default '',p_category text default '',p_postcode text default '',p_start date default null,p_end date default null,
 p_min integer default 0,p_max integer default 2147483647,p_delivery boolean default false,p_collection boolean default false,p_available boolean default false,p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare ids uuid[]; count_rows integer; postcode_area text;
begin
 if p_page is null or p_page<1 or p_page>10000 or p_min is null or p_max is null or p_min<0 or p_max<p_min or length(p_query)>100 or length(p_category)>120 or length(p_postcode)>10 then raise invalid_parameter_value using message='Invalid filters'; end if;
 if (p_start is null)<>(p_end is null) or (p_start is not null and (not isfinite(p_start) or not isfinite(p_end) or p_end<=p_start or p_end-p_start>366)) then raise invalid_parameter_value using message='Invalid dates'; end if;
 if p_available and p_start is null then raise invalid_parameter_value using message='Dates required'; end if;
 if coalesce(p_postcode,'')<>'' then
  if upper(trim(p_postcode)) !~ '^[A-Z]{1,2}[0-9][A-Z0-9]?( ?[0-9][A-Z]{2})?$' then raise invalid_parameter_value using message='Invalid postcode'; end if;
  postcode_area:=substring(upper(p_postcode) from '^[A-Z]+');
 end if;
 with matches as (
  select e.id,e.title from public.equipment e join public.categories c on c.id=e.category_id join public.locations l on l.id=e.base_location_id join public.service_areas s on s.id=l.service_area_id
  where private.catalogue_eligible(e.id) and (coalesce(p_category,'')='' or c.slug=p_category)
  and (coalesce(p_query,'')='' or strpos(lower(e.title||' '||e.description||' '||c.name),lower(trim(p_query)))>0)
  and e.daily_rate between p_min and p_max and (not p_delivery or e.delivery_eligible) and (not p_collection or (e.collection_eligible and l.collection_available))
  and (postcode_area is null or postcode_area=any(s.postcode_areas))
  and (not p_available or (private.rental_availability_core(e.id,p_start,p_end)->>'available')::boolean)
 ) select count(*)::integer,array(select id from matches order by title,id limit 12 offset (p_page-1)*12) into count_rows,ids from matches;
 return jsonb_build_object('total',count_rows,'page',p_page,'page_size',12,'items',coalesce((select jsonb_agg(private.catalogue_item(id,p_start,p_end) order by ord) from unnest(ids) with ordinality x(id,ord)),'[]'::jsonb));
end $$;
create function public.catalogue_detail(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
 select private.catalogue_item(id) from public.equipment where slug=p_slug and private.catalogue_eligible(id);
$$;
revoke all on function private.catalogue_eligible(uuid),private.rental_availability_core(uuid,date,date),private.catalogue_item(uuid,date,date) from public,anon,authenticated;
revoke all on function public.catalogue_search(text,text,text,date,date,integer,integer,boolean,boolean,boolean,integer),public.catalogue_detail(text),public.public_rental_quote(uuid,date,date,text),public.public_rental_availability(uuid,date,date) from public;
grant execute on function public.catalogue_search(text,text,text,date,date,integer,integer,boolean,boolean,boolean,integer),public.catalogue_detail(text),public.public_rental_quote(uuid,date,date,text),public.public_rental_availability(uuid,date,date) to anon,authenticated;

-- Dedicated public media only. No client write policy; trusted upload maintenance validates images.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('equipment-public','equipment-public',true,5242880,array['image/webp','image/jpeg','image/png','image/avif'])
on conflict(id) do nothing;
create policy catalogue_image_read on storage.objects for select to anon,authenticated using
 (bucket_id='equipment-public' and exists(select 1 from public.equipment_images i where i.storage_path=name and private.catalogue_eligible(i.equipment_id)));
-- Storage's policy needs a narrowly scoped predicate; raw image records remain private.
create function public.is_public_equipment_image(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.equipment_images i where i.storage_path=p_path and private.catalogue_eligible(i.equipment_id));
$$;
revoke all on function public.is_public_equipment_image(text) from public;
grant execute on function public.is_public_equipment_image(text) to anon,authenticated;
alter policy catalogue_image_read on storage.objects using(bucket_id='equipment-public' and public.is_public_equipment_image(name));
commit;
