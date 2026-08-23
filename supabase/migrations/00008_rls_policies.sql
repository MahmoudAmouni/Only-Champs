-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

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


create policy "read own profile" on profiles
  for select using (auth.uid() = id);

-- A coach may read the profile of anyone subscribed to them, and vice versa.
create policy "read connected profiles" on profiles
  for select using (
    public.coaches_client(id) or public.tier_level(id) > 0
  );

create policy "update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);


-- Published storefronts are world-readable, including signed-out visitors.
create policy "read published coaches" on coaches
  for select using (is_published or auth.uid() = id);

create policy "insert own coach row" on coaches
  for insert with check (auth.uid() = id);

create policy "update own coach row" on coaches
  for update using (auth.uid() = id) with check (auth.uid() = id);


-- Prices must be public — the storefront is a sales page.
create policy "read active tiers" on tiers
  for select using (is_active or auth.uid() = coach_id);

create policy "coach manages tiers" on tiers
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);


create policy "read own subscriptions" on subscriptions
  for select using (auth.uid() = client_id or auth.uid() = coach_id);

-- Deliberately no INSERT or UPDATE policy for end users.
-- Only the Stripe webhook writes here, using the service role key.
-- A client who could insert their own subscription row could grant
-- themselves free access to every coach on the platform.


create policy "read entitled posts" on posts
  for select using (
    published_at is not null
    and public.has_tier(coach_id, min_tier_level)
  );

create policy "coach manages posts" on posts
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);


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
