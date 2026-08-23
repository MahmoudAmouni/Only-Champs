-- Generated from docs/01-DATABASE.md — do not edit the SQL logic here
-- without also updating that doc. See it for the full rationale behind
-- every table, constraint, and policy.

insert into storage.buckets (id, name, public) values
  ('avatars',          'avatars',          true),
  ('exercise-demos',   'exercise-demos',   true),
  ('post-media',       'post-media',       false),
  ('check-in-photos',  'check-in-photos',  false)
on conflict (id) do nothing;


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
