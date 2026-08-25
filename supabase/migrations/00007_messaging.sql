-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

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
