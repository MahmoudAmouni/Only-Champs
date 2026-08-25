# 01 — Database

Everything here is runnable SQL. Create the files under `supabase/migrations/` with
the names given, paste the contents, and apply them in numeric order. Do not
reorder — later migrations depend on earlier ones.

Apply locally with `supabase db reset`, or paste into the Supabase SQL editor for a
hosted project.

---

## 1. The model in one picture

```
auth.users (managed by Supabase)
    │ 1:1
    ▼
 profiles ──────────┬──────────────────────┐
    │               │                      │
    │ 1:1           │ as client            │ as sender
    ▼               ▼                      ▼
 coaches         subscriptions          messages
    │ 1:N            │ N:1                 │ N:1
    ├── tiers ◀──────┘                  conversations
    ├── posts            (min_tier_level gate)
    ├── exercises
    ├── programs ── program_days ── program_exercises
    │                                      │
    ├── check_ins                          │ referenced by
    └── conversations                      ▼
                          workout_logs ── set_logs
```

Read the arrows as ownership. Almost everything hangs off `coaches`, and almost every
access question resolves to *"what tier does this client hold with that coach?"*

## 2. Conventions used throughout

| Rule | Reason |
|---|---|
| Primary keys are `uuid default gen_random_uuid()` | No enumerable IDs in URLs; safe to generate client-side if ever needed |
| Money is `integer` cents, never `float` | Floating point loses money. `4999` is $49.99 |
| Timestamps are `timestamptz`, never `timestamp` | Clients are in every timezone; naive timestamps silently corrupt |
| Weight is stored in **kilograms** as `numeric(6,2)` | One canonical unit in the DB; convert for display only |
| Every table has `created_at`; mutable ones have `updated_at` | Debugging and sorting |
| Foreign keys always declare `on delete` | Otherwise deletes fail at 2am with a constraint error |
| Table names are plural, columns `snake_case` | Matches Postgres and Supabase codegen conventions |

---

## 3. Migration `00001_extensions_and_enums.sql`

```sql
-- pgcrypto provides gen_random_uuid()
create extension if not exists "pgcrypto";

-- Roles are per-relationship, not global, but a profile still needs a default
-- posture for onboarding routing.
create type user_role as enum ('coach', 'client');

-- Mirrors Stripe's subscription statuses exactly. Do not invent our own values:
-- the webhook copies Stripe's string straight in, and any divergence becomes a bug.
create type subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'
);

create type post_media_type as enum ('text', 'image', 'video');

create type conversation_type as enum ('direct', 'group');
```

### Why `subscription_status` mirrors Stripe

Stripe is the source of truth for whether someone has paid. Every value it can send
must be storable, or the webhook throws and the user silently loses access they paid
for. The access check treats `active` and `trialing` as entitling, and everything else
as not.

---

## 4. Migration `00002_profiles_and_coaches.sql`

```sql
-- One row per authenticated human. Extends auth.users, which we cannot alter.
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role   not null default 'client',
  full_name    text        not null default '',
  avatar_url   text,
  bio          text,
  timezone     text        not null default 'UTC',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Coach-specific data. Present only for profiles acting as coaches.
create table coaches (
  id                        uuid primary key references profiles(id) on delete cascade,
  handle                    text unique not null,
  display_name              text not null,
  headline                  text,
  bio                       text,
  cover_image_url           text,
  specialties               text[] not null default '{}',
  stripe_account_id         text unique,
  stripe_onboarding_complete boolean not null default false,
  is_published              boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- URL-safe, lowercase, 3-30 chars. Enforced here so a bad handle can never
  -- reach the database from any code path.
  constraint handle_format check (handle ~ '^[a-z0-9][a-z0-9_-]{2,29}$')
);

create index coaches_handle_idx on coaches(handle);
```

`coaches.id` **is** `profiles.id` **is** `auth.users.id`. One person, one UUID,
everywhere. This makes every policy simpler: `auth.uid() = coach_id` is the entire
ownership check.

`is_published` gates the public storefront. A coach in the middle of setup should not
appear at a public URL, and `stripe_onboarding_complete` must be true before they can
take money.

### Auto-create a profile on signup

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Without this trigger, a signed-up user has no profile row and every join fails. It is
`security definer` because `auth.users` is not writable by ordinary roles.

### Shared `updated_at` trigger

```sql
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger t_profiles_updated before update on profiles
  for each row execute function touch_updated_at();
create trigger t_coaches_updated before update on coaches
  for each row execute function touch_updated_at();
```

Attach this trigger to every table that gains an `updated_at` column later.

---

## 5. Migration `00003_tiers_and_subscriptions.sql`

```sql
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
```

`level` carries all the meaning. `name` is cosmetic — a coach may call level 3
"Inner Circle" and it still grants level-3 access. **Never gate on `name`.**

```sql
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
```

`on delete restrict` for `tier_id` is deliberate: deleting a tier that people are
paying for would orphan live subscriptions. Coaches deactivate tiers
(`is_active = false`) instead of deleting them.

The partial index on `(coach_id)` filtered to entitling statuses is the one the coach
dashboard hits constantly — "how many active clients do I have."

---

## 6. Migration `00004_access_helpers.sql` — the heart of the system

These three functions are what every policy calls. They are `security definer` so they
can read `subscriptions` and `tiers` without triggering those tables' own policies —
which would cause infinite recursion.

```sql
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
```

### Three details that matter

**The coach scores 99.** Without this, a coach could not read their own gated content,
and every policy would need a second `or auth.uid() = coach_id` clause. One special
case here removes a repeated clause everywhere else.

**`set search_path = public` is required.** A `security definer` function without a
pinned search path can be hijacked: a caller creates a malicious `subscriptions` table
in a schema earlier on their path, and the function reads that instead. This is a real
privilege-escalation vector, not a formality.

**`stable`, not `volatile`.** It tells the planner the result cannot change within a
statement, so the function is evaluated once per query rather than once per row. On a
feed of 200 posts that is the difference between one subquery and two hundred.

---

## 7. Migration `00005_content.sql`

```sql
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
```

`media_path` stores the **storage object path**, never a URL. URLs are minted as
short-lived signed links at request time by code that has already passed the RLS
check. Storing a public URL would make the gate meaningless — the link would work for
anyone who ever saw it.

`published_at is null` means draft. Drafts are visible to their coach only.

### Locked-post previews

Clients must see that locked content *exists* — that is what drives upgrades — without
receiving its body. A view exposes only safe columns:

```sql
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
```

Note what is absent: `body` and `media_path`. Even a total compromise of this view
leaks a title and a thumbnail.

> `security_invoker = on` is essential. Without it the view runs as its **owner**, and
> the underlying `posts` policies are skipped entirely — every post becomes readable
> by everyone. This flag requires Postgres 15+, which Supabase provides.

The preview view intentionally has *no* tier filter, because it is safe for a client to
know a locked post exists. The `posts` table itself is filtered strictly.

---

## 8. Migration `00006_training.sql`

```sql
create table exercises (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid references coaches(id) on delete cascade,  -- null = global library
  name         text not null,
  muscle_group text,
  equipment    text,
  demo_path    text,
  instructions text,
  created_at   timestamptz not null default now()
);

create index exercises_coach_idx on exercises(coach_id);

create table programs (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references coaches(id) on delete cascade,
  name           text not null,
  description    text,
  duration_weeks smallint not null default 4,
  is_template    boolean not null default false,
  client_id      uuid references profiles(id) on delete cascade,  -- null when template
  min_tier_level smallint not null default 3,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- A template belongs to nobody; an assigned program belongs to exactly one client.
  constraint template_xor_assigned
    check ((is_template and client_id is null) or (not is_template))
);

create trigger t_programs_updated before update on programs
  for each row execute function touch_updated_at();

create table program_days (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs(id) on delete cascade,
  week_number smallint not null,
  day_number  smallint not null,
  name        text not null default 'Training Day',
  notes       text,
  constraint unique_day_slot unique (program_id, week_number, day_number)
);

create table program_exercises (
  id              uuid primary key default gen_random_uuid(),
  program_day_id  uuid not null references program_days(id) on delete cascade,
  exercise_id     uuid not null references exercises(id) on delete restrict,
  order_index     smallint not null default 0,
  target_sets     smallint not null default 3,
  target_reps     text not null default '8-12',   -- text: "8-12", "AMRAP", "30s"
  target_rpe      numeric(3,1),
  rest_seconds    integer default 90,
  notes           text
);

create index prog_ex_day_idx on program_exercises(program_day_id, order_index);
```

`target_reps` is **text**, not integer. Real programming says "8–12", "AMRAP", "30
seconds each side". An integer column forces coaches to lie to the schema.

```sql
create table workout_logs (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references profiles(id) on delete cascade,
  program_day_id uuid references program_days(id) on delete set null,
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  notes          text,
  created_at     timestamptz not null default now()
);

create index workout_logs_client_idx on workout_logs(client_id, started_at desc);

create table set_logs (
  id                  uuid primary key default gen_random_uuid(),
  workout_log_id      uuid not null references workout_logs(id) on delete cascade,
  program_exercise_id uuid references program_exercises(id) on delete set null,
  exercise_id         uuid not null references exercises(id) on delete restrict,
  set_number          smallint not null,
  weight_kg           numeric(6,2),
  reps                smallint,
  rpe                 numeric(3,1),
  completed           boolean not null default true
);

create index set_logs_workout_idx on set_logs(workout_log_id);
```

`set_logs` stores `exercise_id` directly as well as `program_exercise_id`. The
denormalisation is intentional: if a coach later edits or deletes the program, the
client's training history must still say what they actually lifted. History is a fact;
the program is a plan.

```sql
create table check_ins (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references profiles(id) on delete cascade,
  coach_id     uuid not null references coaches(id) on delete cascade,
  week_of      date not null,
  weight_kg    numeric(6,2),
  sleep_hours  numeric(3,1),
  adherence_pct smallint,
  energy_score smallint,
  notes        text,
  photo_paths  text[] not null default '{}',
  coach_reply  text,
  replied_at   timestamptz,
  created_at   timestamptz not null default now(),

  constraint adherence_range check (adherence_pct between 0 and 100),
  constraint energy_range check (energy_score between 1 and 10),
  constraint one_per_week unique (client_id, coach_id, week_of)
);

create index check_ins_coach_idx on check_ins(coach_id, week_of desc);
```

`week_of` is a `date` normalised to Monday, which makes `one_per_week` enforceable and
weekly charts trivial to group.

---

## 9. Migration `00007_messaging.sql`

```sql
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references coaches(id) on delete cascade,
  type            conversation_type not null,
  client_id       uuid references profiles(id) on delete cascade, -- direct only
  min_tier_level  smallint,                                       -- group only
  title           text,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),

  constraint direct_has_client check (
    (type = 'direct' and client_id is not null and min_tier_level is null) or
    (type = 'group'  and client_id is null and min_tier_level is not null)
  ),
  constraint one_direct_thread unique nulls not distinct (coach_id, client_id)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text,
  media_path      text,
  created_at      timestamptz not null default now(),

  constraint has_content check (body is not null or media_path is not null)
);

create index messages_thread_idx on messages(conversation_id, created_at desc);
```

Direct threads require level 3 to write into; group threads require the level stored
on the conversation. The check constraint makes the two shapes mutually exclusive, so
a malformed conversation cannot exist.

```sql
create or replace function public.can_read_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from conversations c
     where c.id = p_conversation_id
       and (
         c.coach_id = auth.uid()
         or (c.type = 'direct' and c.client_id = auth.uid())
         or (c.type = 'group'  and public.tier_level(c.coach_id) >= c.min_tier_level)
       )
  );
$$;
```

```sql
-- Keep last_message_at current so thread lists sort without a subquery.
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger t_messages_touch after insert on messages
  for each row execute function touch_conversation();
```

---

## 10. Migration `00008_rls_policies.sql`

Enable RLS on every table first. **A table with RLS off is fully readable by anyone
holding the anon key**, which is published in the JS bundle. Forgetting one line here
is the difference between a secure app and an open database.

```sql
alter table profiles          enable row level security;
alter table coaches           enable row level security;
alter table tiers             enable row level security;
alter table subscriptions     enable row level security;
alter table posts             enable row level security;
alter table exercises         enable row level security;
alter table programs          enable row level security;
alter table program_days      enable row level security;
alter table program_exercises enable row level security;
alter table workout_logs      enable row level security;
alter table set_logs          enable row level security;
alter table check_ins         enable row level security;
alter table conversations     enable row level security;
alter table messages          enable row level security;
```

### profiles

```sql
create policy "read own profile" on profiles
  for select using (auth.uid() = id);

-- A coach may read the profile of anyone subscribed to them, and vice versa.
create policy "read connected profiles" on profiles
  for select using (
    public.coaches_client(id) or public.tier_level(id) > 0
  );

create policy "update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
```

### coaches

```sql
-- Published storefronts are world-readable, including signed-out visitors.
create policy "read published coaches" on coaches
  for select using (is_published or auth.uid() = id);

create policy "insert own coach row" on coaches
  for insert with check (auth.uid() = id);

create policy "update own coach row" on coaches
  for update using (auth.uid() = id) with check (auth.uid() = id);
```

### tiers

```sql
-- Prices must be public — the storefront is a sales page.
create policy "read active tiers" on tiers
  for select using (is_active or auth.uid() = coach_id);

create policy "coach manages tiers" on tiers
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
```

### subscriptions

```sql
create policy "read own subscriptions" on subscriptions
  for select using (auth.uid() = client_id or auth.uid() = coach_id);

-- Deliberately no INSERT or UPDATE policy for end users.
-- Only the Stripe webhook writes here, using the service role key.
-- A client who could insert their own subscription row could grant
-- themselves free access to every coach on the platform.
```

That comment is the single most important one in the schema. **Never add a client
insert policy to `subscriptions`.**

### posts — the tier gate

```sql
create policy "read entitled posts" on posts
  for select using (
    published_at is not null
    and public.has_tier(coach_id, min_tier_level)
  );

create policy "coach manages posts" on posts
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
```

Two policies, and paid content is safe across the entire application. `has_tier`
returns 99 for the coach, so their drafts stay visible to them through the second
policy while the first hides drafts from everyone else.

### exercises, programs, training data

```sql
create policy "read exercises" on exercises
  for select using (coach_id is null or public.tier_level(coach_id) > 0 or auth.uid() = coach_id);

create policy "coach manages exercises" on exercises
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

create policy "read own or assigned programs" on programs
  for select using (
    auth.uid() = coach_id
    or (client_id = auth.uid() and public.has_tier(coach_id, min_tier_level))
  );

create policy "coach manages programs" on programs
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

create policy "read program days" on program_days
  for select using (exists (
    select 1 from programs p where p.id = program_id
      and (p.coach_id = auth.uid() or p.client_id = auth.uid())
  ));

create policy "coach manages program days" on program_days
  for all using (exists (
    select 1 from programs p where p.id = program_id and p.coach_id = auth.uid()
  ));

create policy "read program exercises" on program_exercises
  for select using (exists (
    select 1 from program_days d join programs p on p.id = d.program_id
     where d.id = program_day_id
       and (p.coach_id = auth.uid() or p.client_id = auth.uid())
  ));

create policy "coach manages program exercises" on program_exercises
  for all using (exists (
    select 1 from program_days d join programs p on p.id = d.program_id
     where d.id = program_day_id and p.coach_id = auth.uid()
  ));
```

### logs and check-ins

```sql
create policy "client owns workout logs" on workout_logs
  for all using (auth.uid() = client_id) with check (auth.uid() = client_id);

create policy "coach reads client workout logs" on workout_logs
  for select using (public.coaches_client(client_id));

create policy "client owns set logs" on set_logs
  for all using (exists (
    select 1 from workout_logs w where w.id = workout_log_id and w.client_id = auth.uid()
  ));

create policy "coach reads client set logs" on set_logs
  for select using (exists (
    select 1 from workout_logs w
     where w.id = workout_log_id and public.coaches_client(w.client_id)
  ));

create policy "client writes own check-ins" on check_ins
  for insert with check (auth.uid() = client_id);

create policy "participants read check-ins" on check_ins
  for select using (auth.uid() = client_id or auth.uid() = coach_id);

create policy "client edits own check-in" on check_ins
  for update using (auth.uid() = client_id) with check (auth.uid() = client_id);

create policy "coach replies to check-in" on check_ins
  for update using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
```

### messaging

```sql
create policy "read permitted conversations" on conversations
  for select using (public.can_read_conversation(id));

create policy "coach creates conversations" on conversations
  for insert with check (auth.uid() = coach_id);

create policy "read permitted messages" on messages
  for select using (public.can_read_conversation(conversation_id));

create policy "send to permitted conversations" on messages
  for insert with check (
    sender_id = auth.uid() and public.can_read_conversation(conversation_id)
  );
```

Note the insert policy checks `sender_id = auth.uid()`. Without it, a user could
insert a message *as somebody else* into a thread they legitimately belong to.

---

## 11. Migration `00009_storage.sql`

```sql
insert into storage.buckets (id, name, public) values
  ('avatars',          'avatars',          true),
  ('exercise-demos',   'exercise-demos',   true),
  ('post-media',       'post-media',       false),
  ('check-in-photos',  'check-in-photos',  false)
on conflict (id) do nothing;
```

Path convention: **the first path segment is always the owning user's UUID** —
`post-media/{coach_id}/{uuid}.mp4`. Policies compare that segment against
`auth.uid()`, which is why the convention is mandatory rather than stylistic.

```sql
create policy "public read avatars" on storage.objects
  for select using (bucket_id in ('avatars','exercise-demos'));

create policy "own folder write" on storage.objects
  for insert with check (
    bucket_id in ('avatars','exercise-demos','post-media','check-in-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own folder delete" on storage.objects
  for delete using ((storage.foldername(name))[1] = auth.uid()::text);

-- Private buckets are never read directly by clients. Server code that has already
-- passed an RLS check mints a short-lived signed URL instead.
create policy "owner reads private media" on storage.objects
  for select using (
    bucket_id in ('post-media','check-in-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

Check-in photos are body photos. They are private, owner-writable, and surfaced to the
coach only through server code that verified the coaching relationship first.

---

## 12. Testing the policies

Do this before building any UI. A policy bug found now costs minutes; found after the
frontend exists it costs a day of confused debugging.

```sql
-- Impersonate a level-1 client.
set local role authenticated;
set local request.jwt.claims = '{"sub":"<level-1-client-uuid>"}';

select count(*) from posts;                -- expect: level-1 posts only
select count(*) from posts where min_tier_level = 3;  -- expect: 0
select body from posts where min_tier_level = 3;      -- expect: 0 rows, not an error
select count(*) from post_previews;        -- expect: all published posts
```

**RLS filters rows; it does not raise errors.** A failing policy looks like an empty
result, never an exception. If a query returns nothing and you expected data, suspect
the policy before the query.

Write the same block for a level-3 client, a coach viewing their own data, a coach
attempting to read another coach's clients, and a signed-out visitor. Those five cases
cover essentially every access path in the product.

---

## 13. Generating types

```bash
supabase gen types typescript --linked > types/database.ts
```

Re-run after every migration. `types/database.ts` is generated output — never edit it
by hand, and re-generate rather than patching when it drifts.

> **`--db-url` needs Docker.** `supabase gen types typescript --db-url <connection
> string>` (used when the CLI isn't linked to the project — see §14) spins up a local
> container to introspect the schema, and fails outright without Docker running. If
> Docker isn't available, hand-maintain `types/database.ts` against the migrations
> instead — tedious but mechanical, and worth a careful diff against the real
> generated file once `supabase link` becomes available.

## 14. Applying migrations without the Supabase CLI login

`supabase link` (needed for `supabase db push`) requires either `supabase login` or a
Personal Access Token — both grant account-wide access across every project on the
account, not just this one. If that's more than you want to hand over for a one-time
schema push, connect directly to Postgres instead and run the migration files as
plain SQL. `scripts/run-migrations.mjs` in this repo does exactly that: it reads
`DATABASE_URL`, applies every file in `supabase/migrations/` in order inside a single
transaction, and rolls back the whole batch on any failure.

Two connection gotchas that cost real time working this out for the first time:

**Direct connections (`db.<ref>.supabase.co`) are IPv6-only by default.** Newer
Supabase projects don't provision an IPv4 address for the direct host unless you pay
for the add-on. On a network without IPv6 routing (common — check with
`nslookup db.<ref>.supabase.co`; if you only get an AAAA record and no route, you're
affected), this fails as a plain DNS/connection error, not an auth error, which makes
it look unrelated to the real cause. **Use the Session pooler connection string
instead** — Supabase dashboard → Project Settings → Database → Connection string
(the full page, not the "Connect" quick-start modal, which only shows the direct
option) → **Connection pooling** section → **Session** mode, port `5432`. It resolves
over IPv4 and works identically for this purpose. (The Transaction pooler on `6543`
also works for a one-off script like this, since it never uses prepared statements
across queries — but Session mode is the one Supabase itself recommends for
migrations.)

**Percent-encode special characters in the database password.** A password containing
`$`, `@`, `:`, `/`, or similar breaks URI parsing silently or produces a misleading
auth error. Supabase's own connection-string panel warns about this — encode before
using, e.g. `$` → `%24`.

If you hit `(EAUTHQUERY) auth_query secret check timed out` or
`authentication query failed: connection to database not available`, that's the
pooler itself failing to complete its internal auth check against Postgres — not
necessarily a wrong password. It's been observed clearing up after resetting the
database password (Project Settings → Database → **Reset database password**), which
appears to also refresh the pooler's cached credentials. A subsequent
`password authentication failed for user "postgres"` (Postgres error code `28P01`)
is a different, cleaner signal: the pooler reached Postgres fine, and the password
itself is simply wrong — re-copy it fresh rather than reusing a value from earlier in
the session.
