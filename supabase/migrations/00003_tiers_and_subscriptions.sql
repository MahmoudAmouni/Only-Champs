-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

create table tiers (
  id                uuid primary key default gen_random_uuid(),
  coach_id          uuid not null references coaches(id) on delete cascade,
  level             smallint not null,          -- 1 content, 2 group, 3 one-to-one
  name              text not null,
  description       text,
  price_cents       integer not null,
  currency          text not null default 'usd',
  features          text[] not null default '{}',
  stripe_product_id text,
  stripe_price_id   text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint level_range check (level between 1 and 3),
  constraint price_positive check (price_cents > 0),
  -- A coach may define each level at most once.
  constraint one_tier_per_level unique (coach_id, level)
);

create index tiers_coach_idx on tiers(coach_id) where is_active;


create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references profiles(id) on delete cascade,
  coach_id               uuid not null references coaches(id) on delete cascade,
  tier_id                uuid not null references tiers(id) on delete restrict,
  status                 subscription_status not null,
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  -- A client holds at most one subscription per coach. Upgrading changes tier_id
  -- on the existing row rather than inserting a second one.
  constraint one_sub_per_coach unique (client_id, coach_id)
);

create index subs_client_idx on subscriptions(client_id);
create index subs_coach_active_idx on subscriptions(coach_id)
  where status in ('active','trialing');

create trigger t_tiers_updated before update on tiers
  for each row execute function touch_updated_at();
create trigger t_subscriptions_updated before update on subscriptions
  for each row execute function touch_updated_at();
