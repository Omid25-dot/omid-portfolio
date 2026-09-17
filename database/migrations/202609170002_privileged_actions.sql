begin;
-- Direct PostgREST RPC calls must not bypass the application's Redis limiter.
create table private.mutation_rate_limits (
 actor_id uuid not null references auth.users(id) on delete cascade,
 operation text not null, hits integer not null check(hits > 0), expires_at timestamptz not null,
 primary key(actor_id,operation)
);
alter table private.mutation_rate_limits enable row level security;
revoke all on private.mutation_rate_limits from public,anon,authenticated;
create function private.limit_mutation(p_operation text) returns void
language plpgsql security definer set search_path = '' as $$
declare current_hits integer;
begin
 insert into private.mutation_rate_limits(actor_id,operation,hits,expires_at)
 values(auth.uid(),p_operation,1,now()+interval '15 minutes')
 on conflict(actor_id,operation) do update set
 hits = case when private.mutation_rate_limits.expires_at <= now() then 1 else private.mutation_rate_limits.hits+1 end,
 expires_at = case when private.mutation_rate_limits.expires_at <= now() then now()+interval '15 minutes' else private.mutation_rate_limits.expires_at end
 returning hits into current_hits;
 if current_hits > 8 then raise exception using errcode='P0001', message='Rate limit exceeded'; end if;
end $$;
revoke all on function private.limit_mutation(text) from public,anon,authenticated;
-- Called only by trusted definer functions; never a user-callable audit forgery endpoint.
create function private.append_audit(p_actor uuid, p_action text, p_resource text, p_id uuid,
 p_before jsonb default null, p_after jsonb default null, p_metadata jsonb default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 insert into public.audit_logs(actor_id,action,resource_type,resource_id,before_data,after_data,metadata)
 values(p_actor,p_action,p_resource,p_id,p_before,p_after,p_metadata) returning id into result;
 return result;
end $$;
revoke all on function private.append_audit(uuid,text,text,uuid,jsonb,jsonb,jsonb) from public, anon, authenticated;

create function public.change_profile_role(p_user_id uuid,p_role text) returns void
language plpgsql security definer set search_path = '' as $$
declare old_role text; actor uuid := auth.uid();
begin
 -- Lock actor and target so a concurrent demotion cannot authorise a stale mutation.
 perform id from public.profiles where id in(actor,p_user_id) order by id for update;
 if not private.has_role(array['super_admin']) then raise insufficient_privilege using message = 'Forbidden'; end if;
 perform private.limit_mutation('role-change');
 if actor = p_user_id then raise check_violation using message = 'Self role changes are not allowed'; end if;
 if p_role is null or p_role not in ('customer','staff','admin','super_admin') then raise check_violation using message = 'Invalid role'; end if;
 select role into old_role from public.profiles where id=p_user_id;
 if not found then raise no_data_found using message = 'Profile not found'; end if;
 if old_role = p_role then return; end if;
 update public.profiles set role=p_role where id=p_user_id;
 perform private.append_audit(actor,'profile.role_changed','profile',p_user_id,
 jsonb_build_object('role',old_role),jsonb_build_object('role',p_role),'{}');
end $$;
revoke all on function public.change_profile_role(uuid,text) from public,anon;
grant execute on function public.change_profile_role(uuid,text) to authenticated;

-- Concrete audit wiring: authorised admins can record an access review. No arbitrary payload.
create function public.record_access_review() returns uuid language plpgsql security definer set search_path = '' as $$
begin
 perform id from public.profiles where id=auth.uid() for update;
 if not private.has_role(array['admin','super_admin']) then raise insufficient_privilege using message = 'Forbidden'; end if;
 perform private.limit_mutation('access-review');
 return private.append_audit(auth.uid(),'security.access_reviewed','profile',auth.uid(),null,null,
 jsonb_build_object('source','admin_foundation'));
end $$;
revoke all on function public.record_access_review() from public,anon;
grant execute on function public.record_access_review() to authenticated;
commit;
