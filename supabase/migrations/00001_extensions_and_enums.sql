-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

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
