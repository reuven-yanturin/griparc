-- Apply after 001_validation.sql, including on existing projects.
-- Additive migration: existing rows and the original RPC are preserved.
-- The boolean is consumed server-side only; it is never exposed to browsers.
create or replace function public.register_early_access_v2(p_lead jsonb,p_session uuid,p_analytics boolean)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare new_id uuid;
begin
 insert into public.early_access_leads(email,selected_goal,experience_level,marketing_variant,selected_plan,assessment,attribution,adult_confirmed,email_consent,consent_version)
 values(p_lead->>'email',p_lead->>'selected_goal',p_lead->>'experience_level',p_lead->>'marketing_variant',p_lead->>'selected_plan',nullif(p_lead->'assessment','null'::jsonb),p_lead->'attribution',true,true,p_lead->>'consent_version')
 on conflict(email) do nothing returning id into new_id;
 if new_id is not null and p_analytics and p_session is not null then
 insert into public.funnel_events(event_name,session_id,marketing_variant,properties)
 values('early_access_submitted',p_session,p_lead->>'marketing_variant',jsonb_strip_nulls(jsonb_build_object('selected_goal',p_lead->>'selected_goal','experience_level',p_lead->>'experience_level','selected_plan',p_lead->>'selected_plan')) || (p_lead->'attribution'));
 end if;
return new_id is not null;
end; $$;
revoke all on function public.register_early_access_v2(jsonb,uuid,boolean) from public,anon,authenticated;
grant execute on function public.register_early_access_v2(jsonb,uuid,boolean) to service_role;
