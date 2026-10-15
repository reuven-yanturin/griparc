-- Funnel: unique tab sessions per variant, not raw event counts. Sessions can
-- have repeat views. These are descriptive totals, not randomized causal proof.
select marketing_variant,
 count(distinct session_id) filter(where event_name='landing_view') as visitors,
 count(distinct session_id) filter(where event_name='assessment_started') as assessment_starts,
 count(distinct session_id) filter(where event_name='assessment_completed') as assessment_completions,
 count(distinct session_id) filter(where event_name='results_viewed') as result_views,
 count(distinct session_id) filter(where event_name='pricing_viewed') as pricing_views,
 count(distinct session_id) filter(where event_name='early_access_submitted') as new_leads
from public.funnel_events where created_at >= now()-interval '30 days'
group by marketing_variant;
-- Qualified conversions and stated plan interest, including analytics opt-outs.
select marketing_variant,selected_goal,experience_level,selected_plan,
 count(*) as registrations,
 count(*) filter(where assessment is not null) as assessment_qualified
from public.early_access_leads where created_at >= now()-interval '30 days'
group by marketing_variant,selected_goal,experience_level,selected_plan;
-- Run daily via Supabase scheduled jobs (or run manually during pilot).
delete from public.request_limits where expires_at < now()-interval '1 day';
-- Keep anonymous event history for 90 days.
delete from public.funnel_events where created_at < now()-interval '90 days';
