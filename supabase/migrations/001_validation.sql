-- Run once in the Supabase SQL editor. All access is server-side service_role.
create table public.early_access_leads (
 id uuid primary key default gen_random_uuid(),
 email text not null unique check (email = lower(trim(email))),
 selected_goal text not null check (selected_goal in ('start','pullup','skills','consistency')),
 experience_level text not null check (experience_level in ('new','beginner','consistent')),
 marketing_variant text not null check (marketing_variant in ('beginner','pullup')),
 selected_plan text check (selected_plan in ('monthly','annual')),
 assessment jsonb,
 attribution jsonb not null default '{}',
 adult_confirmed boolean not null check (adult_confirmed),
 email_consent boolean not null check (email_consent),
 consent_version text not null,
 created_at timestamptz not null default now()
);
create table public.funnel_events (
 id bigint generated always as identity primary key,
 event_name text not null check (event_name in ('landing_view','hero_cta_click','assessment_started','assessment_step_completed','assessment_completed','results_viewed','pricing_viewed','plan_selected','early_access_started','early_access_submitted')),
 session_id uuid not null,
 marketing_variant text not null check (marketing_variant in ('beginner','pullup')),
 properties jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create index funnel_events_reporting on public.funnel_events(created_at,marketing_variant,event_name);
create table public.request_limits (
 key text primary key,
 hits integer not null default 1,
 expires_at timestamptz not null
);
alter table public.early_access_leads enable row level security;
alter table public.funnel_events enable row level security;
alter table public.request_limits enable row level security;
revoke all on public.early_access_leads, public.funnel_events, public.request_limits from anon, authenticated;
-- Atomic durable limiter; no process-local state or stored IP addresses.
create function public.consume_rate_limit(p_key text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare count_now integer;
begin
 insert into public.request_limits as r(key,hits,expires_at)
 values(p_key,1,now()+make_interval(secs=>p_window_seconds))
 on conflict(key) do update set
 hits=case when r.expires_at < now() then 1 else r.hits+1 end,
 expires_at=case when r.expires_at < now() then now()+make_interval(secs=>p_window_seconds) else r.expires_at end
 returning hits into count_now;
 return count_now<=p_limit;
end; $$;
-- Registration + conversion event commit together. Duplicates never overwrite consent
-- or inflate conversions, and always receive the same generic success response.
create function public.register_early_access(p_lead jsonb,p_session uuid,p_analytics boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare new_id uuid;
begin
 insert into public.early_access_leads(email,selected_goal,experience_level,marketing_variant,selected_plan,assessment,attribution,adult_confirmed,email_consent,consent_version)
 values(p_lead->>'email',p_lead->>'selected_goal',p_lead->>'experience_level',p_lead->>'marketing_variant',p_lead->>'selected_plan',nullif(p_lead->'assessment','null'::jsonb),p_lead->'attribution',true,true,p_lead->>'consent_version')
 on conflict(email) do nothing returning id into new_id;
 if new_id is not null and p_analytics and p_session is not null then
 insert into public.funnel_events(event_name,session_id,marketing_variant,properties)
 values('early_access_submitted',p_session,p_lead->>'marketing_variant',jsonb_strip_nulls(jsonb_build_object('selected_goal',p_lead->>'selected_goal','experience_level',p_lead->>'experience_level','selected_plan',p_lead->>'selected_plan')) || (p_lead->'attribution'));
 end if;
end; $$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
revoke all on function public.register_early_access(jsonb,uuid,boolean) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
grant execute on function public.register_early_access(jsonb,uuid,boolean) to service_role;

-- Explicit service-role privileges, independent of project default grants.
grant all on public.early_access_leads, public.funnel_events, public.request_limits to service_role;
grant usage, select on sequence public.funnel_events_id_seq to service_role;
