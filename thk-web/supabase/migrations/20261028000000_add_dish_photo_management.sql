begin;

-- Each reusable dish may carry a public representative photo for the public menu.
alter table public.dishes
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-images', 'dish-images', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists dish_images_public_read on storage.objects;
create policy dish_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'dish-images');

drop policy if exists dish_images_staff_insert on storage.objects;
create policy dish_images_staff_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dish-images'
    and private.has_staff_role(array['ceo','admin'])
  );

drop policy if exists dish_images_staff_update on storage.objects;
create policy dish_images_staff_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'dish-images'
    and private.has_staff_role(array['ceo','admin'])
  )
  with check (
    bucket_id = 'dish-images'
    and private.has_staff_role(array['ceo','admin'])
  );

drop policy if exists dish_images_staff_delete on storage.objects;
create policy dish_images_staff_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dish-images'
    and private.has_staff_role(array['ceo','admin'])
  );

commit;
