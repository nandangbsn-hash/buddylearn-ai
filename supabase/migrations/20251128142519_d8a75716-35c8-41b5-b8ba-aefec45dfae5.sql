-- Make study-materials bucket public so edge functions can access files
UPDATE storage.buckets 
SET public = true 
WHERE id = 'study-materials';

-- Update storage policies to allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials');