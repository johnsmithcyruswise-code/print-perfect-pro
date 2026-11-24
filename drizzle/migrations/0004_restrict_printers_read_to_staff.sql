DROP POLICY IF EXISTS "printers read" ON public.printers;
CREATE POLICY "printers read" ON public.printers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));