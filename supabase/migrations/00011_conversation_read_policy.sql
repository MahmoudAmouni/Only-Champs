-- Fix: a coach could not start a direct conversation.
--
-- ensureDirectConversation does `insert ... returning id`, which failed with
-- "new row violates row-level security policy" (42501) even though the
-- INSERT policy (auth.uid() = coach_id) was satisfied. The insert on its own
-- succeeded; only the RETURNING failed.
--
-- RETURNING makes Postgres evaluate the SELECT policy against the new row.
-- That policy was `can_read_conversation(id)` — a SECURITY DEFINER function
-- that answers the question by running its own `select ... from
-- conversations where c.id = $1`. That inner query runs under its own
-- snapshot and cannot see the row still being written by the statement that
-- called it, so it returned false for every freshly inserted row and RLS
-- refused to return it.
--
-- The predicate is the same either way; the difference is where it is
-- evaluated. Written against the row's own columns it needs no self-query,
-- so it holds for a row that does not exist yet anywhere else.
--
-- tier_level() is left in place: it reads subscriptions, a different table,
-- so it has no such visibility problem. can_read_conversation() is also kept
-- and still used by the messages policies, where it queries conversations —
-- a different table from messages — and is therefore fine.

drop policy "read permitted conversations" on conversations;

create policy "read permitted conversations" on conversations
  for select using (
    coach_id = auth.uid()
    or (type = 'direct' and client_id = auth.uid())
    or (type = 'group' and public.tier_level(coach_id) >= min_tier_level)
  );
