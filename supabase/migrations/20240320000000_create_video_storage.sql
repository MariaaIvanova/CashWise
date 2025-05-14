-- Create a storage bucket for lesson videos
insert into storage.buckets (id, name, public)
values ('lesson-videos', 'lesson-videos', true);

-- Set up storage policies to allow public access to videos
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'lesson-videos' );

-- Allow authenticated users to upload videos (you can restrict this further if needed)
create policy "Authenticated users can upload videos"
on storage.objects for insert
with check (
  bucket_id = 'lesson-videos'
  and auth.role() = 'authenticated'
); 