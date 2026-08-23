-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

create table posts (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references coaches(id) on delete cascade,
  min_tier_level  smallint not null default 1,
  media_type      post_media_type not null default 'text',
  title           text not null,
  body            text,
  media_path      text,          -- storage object path, NOT a public URL
  thumbnail_path  text,
  duration_seconds integer,
  published_at    timestamptz,   -- null means draft
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint min_tier_range check (min_tier_level between 1 and 3)
);

create index posts_feed_idx on posts(coach_id, published_at desc)
  where published_at is not null;

create trigger t_posts_updated before update on posts
  for each row execute function touch_updated_at();


create view post_previews
with (security_invoker = on) as
select
  p.id,
  p.coach_id,
  p.title,
  p.media_type,
  p.min_tier_level,
  p.thumbnail_path,
  p.duration_seconds,
  p.published_at,
  public.tier_level(p.coach_id) >= p.min_tier_level as is_unlocked
from posts p
where p.published_at is not null;
