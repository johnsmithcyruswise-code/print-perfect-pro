-- roles
CREATE TYPE public.app_role AS ENUM ('admin','manager','operator','csr','customer');
CREATE TYPE public.order_status AS ENUM ('pending','processing','printing','qa','ready','shipped','cancelled');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','manager','operator','csr'))
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('BZ-' || upper(substr(md5(random()::text), 1, 8))),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  paper_size text NOT NULL,
  custom_width_mm numeric,
  custom_height_mm numeric,
  paper_type text NOT NULL,
  color_mode text NOT NULL,
  sides text NOT NULL,
  binding text NOT NULL DEFAULT 'none',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 10000),
  turnaround text NOT NULL DEFAULT 'standard',
  addons text[] NOT NULL DEFAULT '{}',
  notes text,
  coupon_code text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  delivery_method text NOT NULL DEFAULT 'pickup',
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders(user_id);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_created_idx ON public.orders(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders update" ON public.orders FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "orders delete staff" ON public.orders FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.order_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  content_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_files_order_idx ON public.order_files(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_files TO authenticated;
GRANT ALL ON public.order_files TO service_role;
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files read" ON public.order_files FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "files insert" ON public.order_files FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "files delete" ON public.order_files FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON public.order_events(order_id);
GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events read" ON public.order_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid())))
);
CREATE POLICY "events insert" ON public.order_events FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid())))
);

CREATE TABLE public.coupons (
  code text PRIMARY KEY,
  percent_off integer NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO authenticated, anon;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons public read" ON public.coupons FOR SELECT TO authenticated, anon USING (active);

INSERT INTO public.coupons (code, percent_off, description) VALUES
  ('WELCOME10', 10, 'Welcome discount for new customers'),
  ('BULK15', 15, 'Bulk order discount'),
  ('STUDENT20', 20, 'Student special'),
  ('BAZZ5', 5, 'Loyalty thank-you'),
  ('LAUNCH25', 25, 'Launch week promo');

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();