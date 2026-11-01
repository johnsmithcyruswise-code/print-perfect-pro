CREATE TABLE public.guest_print_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_number text NOT NULL UNIQUE DEFAULT ('BZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
 customer_name text NOT NULL,
 customer_phone text NOT NULL,
 file_name text NOT NULL,
 file_path text NOT NULL,
 content_type text NOT NULL,
 paper_size text NOT NULL CHECK (paper_size IN ('A4', 'A3')),
 color_mode text NOT NULL CHECK (color_mode IN ('bw', 'color')),
 quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 999),
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','printing','ready','collected')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.guest_print_orders TO authenticated;
GRANT ALL ON public.guest_print_orders TO service_role;
ALTER TABLE public.guest_print_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read guest print orders" ON public.guest_print_orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update guest print orders" ON public.guest_print_orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX guest_print_orders_created_at_idx ON public.guest_print_orders (created_at DESC);
CREATE INDEX guest_print_orders_phone_idx ON public.guest_print_orders (customer_phone, created_at DESC);