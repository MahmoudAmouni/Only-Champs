-- Public storefront reads.
--
-- Two things a signed-out visitor is supposed to see on a published
-- storefront were invisible to them, because the data behind both sits in
-- tables that are correctly locked down:
--
--   1. The coach's avatar lives on `profiles`, which no anonymous visitor
--      can read, so `coaches -> profiles(avatar_url)` came back null and
--      every public storefront rendered a blank avatar.
--   2. The active-client count is aggregated from `subscriptions`, readable
--      only by the client and the coach on the row, so the social-proof
--      badge never appeared for the audience it exists to convince.
--
-- Neither is fixed by loosening the base tables. See docs/01-DATABASE.md §7.

-- 1. A published coach's own profile row is public, because their storefront
--    already is. Scoped by an exists() against coaches, so it covers coaches
--    who have published and nobody else — client profiles are untouched.
create policy "read published coach profiles" on profiles
  for select using (
    exists (
      select 1 from public.coaches c
      where c.id = profiles.id and c.is_published
    )
  );

-- 2. Aggregate-only view over subscriptions, same pattern as post_previews.
--    security_invoker = false is required: under the caller's own permissions
--    the join returns only the caller's own subscription and every count
--    reads 0 or 1. Safe because the column list is one integer per coach —
--    no row-level detail, not who subscribed, at what tier, or for how much.
create view coach_stats
with (security_invoker = false) as
select
  c.id as coach_id,
  count(s.id) filter (
    where s.status in ('active', 'trialing')
  )::int as active_client_count
from coaches c
left join subscriptions s on s.coach_id = c.id
where c.is_published
group by c.id;

grant select on coach_stats to anon, authenticated;
