ALTER TABLE public.guest_print_orders ADD COLUMN print_kind text NOT NULL DEFAULT 'document' CHECK (print_kind IN ('document', 'passport'));
ALTER TABLE public.guest_print_orders ADD COLUMN photo_count integer CHECK (photo_count BETWEEN 1 AND 16);
COMMENT ON COLUMN public.guest_print_orders.photo_count IS 'Number of 35 x 45 mm portraits on the submitted A4 passport PDF sheet.';