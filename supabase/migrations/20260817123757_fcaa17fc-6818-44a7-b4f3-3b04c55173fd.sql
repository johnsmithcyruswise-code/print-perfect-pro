ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_lat double precision,
  ADD COLUMN IF NOT EXISTS last_lng double precision,
  ADD COLUMN IF NOT EXISTS last_location_accuracy double precision,
  ADD COLUMN IF NOT EXISTS last_location_at timestamptz;

CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u
WHERE lower(u.email) = 'mzedi2012@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;