-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

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
