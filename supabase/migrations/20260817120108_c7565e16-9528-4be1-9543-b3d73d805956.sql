ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'completed';

CREATE TABLE public.printers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ip_address text,
  model text,
  location text,
  status text NOT NULL DEFAULT 'offline',
  is_default boolean NOT NULL DEFAULT false,
  ezeep_device_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.printers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.printers TO authenticated;
GRANT ALL ON public.printers TO service_role;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "printers read" ON public.printers FOR SELECT TO authenticated USING (true);
CREATE POLICY "printers insert staff" ON public.printers FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "printers update staff" ON public.printers FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "printers delete staff" ON public.printers FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER printers_touch BEFORE UPDATE ON public.printers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.orders
  ADD COLUMN staff_price numeric,
  ADD COLUMN pickup_deadline timestamptz,
  ADD COLUMN staff_notes text,
  ADD COLUMN customer_notes text,
  ADD COLUMN assigned_printer_id uuid REFERENCES public.printers(id) ON DELETE SET NULL;

CREATE TABLE public.print_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  printer_id uuid REFERENCES public.printers(id) ON DELETE SET NULL,
  operator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pages_printed integer NOT NULL DEFAULT 0,
  ezeep_job_id text,
  printed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.print_logs TO authenticated;
GRANT ALL ON public.print_logs TO service_role;
ALTER TABLE public.print_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "print logs read staff" ON public.print_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "print logs insert staff" ON public.print_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND operator_id = auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'app',
  subject text NOT NULL,
  message text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications read own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "notifications insert staff" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "notifications update own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.recent_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text,
  last_accessed timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recent_files TO authenticated;
GRANT ALL ON public.recent_files TO service_role;
ALTER TABLE public.recent_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recent files own" ON public.recent_files FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

INSERT INTO public.printers (name, ip_address, model, location, status, is_default)
VALUES
  ('Front Desk Color', '192.168.1.21', 'Canon imageRUNNER C3226i', 'Reception', 'online', true),
  ('Production Mono', '192.168.1.22', 'HP LaserJet M776', 'Back room', 'online', false),
  ('Wide Format', '192.168.1.23', 'Epson SureColor T5170', 'Workshop', 'offline', false);