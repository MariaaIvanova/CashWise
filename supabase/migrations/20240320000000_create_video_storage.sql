-- Create a storage bucket for lesson videos if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'lesson-videos'
    ) THEN
        insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        values (
            'lesson-videos',
            'lesson-videos',
            true,
            52428800, -- 50MB in bytes
            array['video/mp4', 'video/webm', 'video/quicktime']
        );
    END IF;
END $$;

-- Set up storage policies to allow public access to videos
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'lesson-videos' );

-- Allow authenticated users to upload videos
create policy "Authenticated users can upload videos"
on storage.objects for insert
with check (
    bucket_id = 'lesson-videos'
    and auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own videos
create policy "Users can update their own videos"
on storage.objects for update
with check (
    bucket_id = 'lesson-videos'
    and auth.uid() = owner
);

-- Allow authenticated users to delete their own videos
create policy "Users can delete their own videos"
on storage.objects for delete
using (
    bucket_id = 'lesson-videos'
    and auth.uid() = owner
); 