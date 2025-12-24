-- =====================================================
-- FYSA SaaS Storage Bucket Policies
-- Run this in Supabase SQL Editor to enable file uploads
-- =====================================================

-- Allow public read access to the documentos bucket
CREATE POLICY "Public read access for documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');

-- Allow authenticated and anonymous users to upload files
CREATE POLICY "Allow uploads to documentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos');

-- Allow updates to files in documentos bucket
CREATE POLICY "Allow updates to documentos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documentos')
WITH CHECK (bucket_id = 'documentos');

-- Allow deletes from documentos bucket
CREATE POLICY "Allow deletes from documentos"
ON storage.objects FOR DELETE
USING (bucket_id = 'documentos');

