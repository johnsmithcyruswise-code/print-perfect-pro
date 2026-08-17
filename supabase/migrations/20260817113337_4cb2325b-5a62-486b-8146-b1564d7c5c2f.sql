CREATE POLICY "print files own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'print-files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));
CREATE POLICY "print files own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'print-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "print files own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'print-files' AND (storage.foldername(name))[1] = auth.uid()::text);