-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

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
