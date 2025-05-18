-- Create a storage bucket for avatars if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'avatars'
    ) THEN
        insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        values (
            'avatars',
            'avatars',
            true,
            5242880, -- 5MB in bytes
            array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        );
    END IF;
END $$;

-- Set up storage policies to allow public access to avatars
create policy "Public Access to Avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatars
create policy "Users can upload their own avatars"
on storage.objects for insert
with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
create policy "Users can update their own avatars"
on storage.objects for update
with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
create policy "Users can delete their own avatars"
on storage.objects for delete
using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
); 