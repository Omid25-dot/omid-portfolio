begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
-- New objects must not inherit Supabase's permissive API grants.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 first_name text not null default '' check (length(first_name) <= 80),
 last_name text not null default '' check (length(last_name) <= 80),
 phone text not null default '' check (length(phone) <= 30 and phone ~ '^[+0-9 ()-]*$'),
 role text not null default 'customer' check (role in ('customer','staff','admin','super_admin')),
 account_status text not null default 'active' check (account_status in ('active','restricted','suspended')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated_at();
create function private.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 -- User metadata is deliberately ignored: role/status always use database defaults.
 insert into public.profiles(id) values (new.id); return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.create_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
create function private.has_role(allowed text[]) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = (select auth.uid()) and account_status = 'active' and role = any(allowed));
$$;
revoke all on function private.has_role(text[]) from public;
grant execute on function private.has_role(text[]) to authenticated;

create table public.categories (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), description text not null default '',
 image_reference text, active boolean not null default false, display_order integer not null default 0 check(display_order >= 0),
 is_demo boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.service_areas (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 country_code text not null default 'GB' check(country_code ~ '^[A-Z]{2}$'), timezone text not null default 'Europe/London',
 active boolean not null default false, is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.locations (
 id uuid primary key default gen_random_uuid(), service_area_id uuid not null references public.service_areas(id),
 name text not null, reference text not null unique, address jsonb not null default '{}' check(jsonb_typeof(address) = 'object'),
 postcode text not null, collection_available boolean not null default false, active boolean not null default false,
 is_demo boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.owners (
 id uuid primary key default gen_random_uuid(), owner_type text not null check(owner_type in ('company','individual')),
 company_name text, contact_name text not null, email text not null, phone text,
 address jsonb not null default '{}' check(jsonb_typeof(address) = 'object'),
 commission_bps integer check(commission_bps between 0 and 10000), payout_reference text,
 active boolean not null default false, notes text not null default '', is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(owner_type <> 'company' or length(trim(company_name)) > 0 and company_name is not null)
);
create table public.equipment (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 200),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), category_id uuid not null references public.categories(id),
 description text not null default '', daily_rate integer not null check(daily_rate >= 0),
 weekly_rate integer check(weekly_rate >= 0), security_deposit integer not null default 0 check(security_deposit >= 0),
 verification_required boolean not null default false, delivery_eligible boolean not null default false,
 collection_eligible boolean not null default false, ownership_type text not null check(ownership_type in ('COMPANY','THIRD_PARTY')),
 owner_id uuid references public.owners(id), commission_override_bps integer check(commission_override_bps between 0 and 10000),
 operational_status text not null default 'UNAVAILABLE' check(operational_status in ('AVAILABLE','RESERVED','ON_HIRE','MAINTENANCE','UNAVAILABLE','ARCHIVED')),
 base_location_id uuid not null references public.locations(id), internal_reference text unique,
 listed boolean not null default false, is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
 check((ownership_type = 'COMPANY' and owner_id is null and commission_override_bps is null) or (ownership_type = 'THIRD_PARTY' and owner_id is not null)),
 check((operational_status = 'ARCHIVED') = (archived_at is not null))
);
create table public.equipment_images (
 id uuid primary key default gen_random_uuid(), equipment_id uuid not null references public.equipment(id) on delete cascade,
 storage_path text not null unique check(length(storage_path) > 0), alt_text text not null check(length(alt_text) between 1 and 500),
 display_order integer not null default 0 check(display_order >= 0), is_primary boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index equipment_one_primary_image on public.equipment_images(equipment_id) where is_primary;
create table public.equipment_specifications (
 id uuid primary key default gen_random_uuid(), equipment_id uuid not null references public.equipment(id) on delete cascade,
 key text not null check(key ~ '^[a-z][a-z0-9_]*$'), label text not null, value jsonb not null,
 unit text, display_order integer not null default 0 check(display_order >= 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(equipment_id,key), check(jsonb_typeof(value) in ('string','number','boolean'))
);
create table public.platform_settings (
 key text primary key check(key ~ '^[a-z][a-z0-9_]*$'), value jsonb not null,
 description text not null default '', is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete set null,
 action text not null, resource_type text not null, resource_id uuid,
 before_data jsonb, after_data jsonb, metadata jsonb not null default '{}' check(jsonb_typeof(metadata) = 'object'),
 created_at timestamptz not null default now()
);
create index profiles_role_status on public.profiles(role,account_status);
create index equipment_category on public.equipment(category_id);
create index equipment_status on public.equipment(operational_status);
create index equipment_owner on public.equipment(owner_id) where owner_id is not null;
create index equipment_location on public.equipment(base_location_id);
create index locations_service_area on public.locations(service_area_id);
create index equipment_image_order on public.equipment_images(equipment_id,display_order);
create index audit_logs_time on public.audit_logs(created_at desc);
create index audit_logs_actor on public.audit_logs(actor_id,created_at desc);
create index audit_logs_resource on public.audit_logs(resource_type,resource_id);

-- Every table gets RLS and explicit grants, independent of provider defaults.
do $$ declare t text; begin
 foreach t in array array['profiles','categories','service_areas','locations','owners','equipment','equipment_images','equipment_specifications','platform_settings','audit_logs'] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from public, anon, authenticated',t);
   execute format('grant all on public.%I to service_role',t);
   if t not in ('profiles','audit_logs') then
     execute format('create trigger %I before update on public.%I for each row execute function private.touch_updated_at()',t||'_updated',t);
   end if;
 end loop;
end $$;
grant select on public.profiles to authenticated;
grant update(first_name,last_name,phone) on public.profiles to authenticated;
create policy profiles_self_read on public.profiles for select to authenticated using(id = (select auth.uid()));
create policy profiles_admin_read on public.profiles for select to authenticated using(private.has_role(array['admin','super_admin']));
create policy profiles_self_update on public.profiles for update to authenticated
 using(id = (select auth.uid()) and account_status in ('active','restricted'))
 with check(id = (select auth.uid()) and account_status in ('active','restricted'));
grant select on public.categories to anon, authenticated;
create policy categories_public_read on public.categories for select to anon, authenticated using(active);
create policy categories_staff_read on public.categories for select to authenticated using(private.has_role(array['staff','admin','super_admin']));
grant select on public.service_areas, public.locations, public.equipment, public.equipment_images, public.equipment_specifications to authenticated;
do $$ declare t text; begin
 foreach t in array array['service_areas','locations','equipment','equipment_images','equipment_specifications'] loop
   execute format('create policy operational_read on public.%I for select to authenticated using(private.has_role(array[''staff'',''admin'',''super_admin'']))',t);
 end loop;
end $$;
grant select on public.owners, public.audit_logs, public.platform_settings to authenticated;
create policy owners_admin_read on public.owners for select to authenticated using(private.has_role(array['admin','super_admin']));
create policy audit_admin_read on public.audit_logs for select to authenticated using(private.has_role(array['admin','super_admin']));
create policy settings_super_admin_read on public.platform_settings for select to authenticated using(private.has_role(array['super_admin']));
-- No authenticated DML grants except profile contact fields. New mutations need audited RPCs.
-- No public equipment projection until the catalogue phase: ownership fields cannot leak.
revoke all on function private.touch_updated_at(), private.create_profile() from public, anon, authenticated;
commit;
