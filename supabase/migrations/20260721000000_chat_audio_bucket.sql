insert into storage.buckets (id, name, public)
values ('chat_audio', 'chat_audio', true)
on conflict (id) do nothing;

create policy "chat audio public read"
  on storage.objects for select
  using ( bucket_id = 'chat_audio' );

create policy "chat audio insert authenticated"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'chat_audio' );
