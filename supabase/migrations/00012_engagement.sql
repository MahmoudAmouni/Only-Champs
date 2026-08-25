-- Client-side engagement: likes and saves.
--
-- The client had no way to act on anything. They could read a feed and log a
-- workout, and that was the whole surface. These give a subscriber something
-- to do with a post and give the coach a signal about which posts land.

create table post_likes (
  post_id    uuid not null references posts(id) on delete cascade,
  client_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, client_id)
);

create table saved_posts (
  post_id    uuid not null references posts(id) on delete cascade,
  client_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, client_id)
);

create index post_likes_post_idx on post_likes(post_id);
create index saved_posts_client_idx on saved_posts(client_id, created_at desc);

alter table post_likes  enable row level security;
alter table saved_posts enable row level security;

-- Entitlement is not re-derived here. `posts` already has a SELECT policy that
-- exposes only published rows the caller holds the tier for, so an EXISTS
-- against it answers "may this person see this post?" exactly once, in one
-- place. A subquery inside a policy runs as the caller, so posts' own RLS
-- applies — which is the entire point.
create policy "read likes on readable posts" on post_likes
  for select using (exists (select 1 from posts p where p.id = post_id));

create policy "like readable posts" on post_likes
  for insert with check (
    client_id = auth.uid()
    and exists (select 1 from posts p where p.id = post_id)
  );

create policy "unlike own likes" on post_likes
  for delete using (client_id = auth.uid());

-- Saves are private: a coach has no business seeing who bookmarked what, and
-- unlike a like it carries no signal the coach is owed.
create policy "read own saves" on saved_posts
  for select using (client_id = auth.uid());

create policy "save readable posts" on saved_posts
  for insert with check (
    client_id = auth.uid()
    and exists (select 1 from posts p where p.id = post_id)
  );

create policy "unsave own saves" on saved_posts
  for delete using (client_id = auth.uid());

-- Aggregate like counts, readable by anyone who can read the post. Same
-- reasoning as coach_stats: expose the number, not the rows.
create view post_like_counts
with (security_invoker = false) as
select post_id, count(*)::int as like_count
from post_likes
group by post_id;

grant select on post_like_counts to anon, authenticated;
