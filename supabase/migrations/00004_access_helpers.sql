-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

-- The highest tier level this user currently holds with a given coach.
-- Returns 0 when they hold nothing. A coach always scores 99 with themselves.
create or replace function public.tier_level(p_coach_id uuid)
returns smallint
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() = p_coach_id then 99::smallint
    else coalesce(
      (select max(t.level)
         from subscriptions s
         join tiers t on t.id = s.tier_id
        where s.client_id = auth.uid()
          and s.coach_id  = p_coach_id
          and s.status in ('active','trialing')),
      0::smallint)
  end;
$$;

-- Convenience wrapper used by most policies.
create or replace function public.has_tier(p_coach_id uuid, p_min smallint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.tier_level(p_coach_id) >= p_min;
$$;

-- True when the current user coaches the given client.
create or replace function public.coaches_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from subscriptions s
     where s.coach_id  = auth.uid()
       and s.client_id = p_client_id
       and s.status in ('active','trialing')
  );
$$;
