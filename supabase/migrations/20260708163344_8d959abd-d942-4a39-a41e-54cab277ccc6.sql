
CREATE TABLE public.homepage_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  value text NOT NULL,
  value_type text NOT NULL CHECK (value_type IN ('number','text')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.homepage_pricing TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_pricing TO authenticated;
GRANT ALL ON public.homepage_pricing TO service_role;

ALTER TABLE public.homepage_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homepage_pricing readable by everyone"
  ON public.homepage_pricing FOR SELECT
  USING (true);

CREATE POLICY "homepage_pricing admin insert"
  ON public.homepage_pricing FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "homepage_pricing admin update"
  ON public.homepage_pricing FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "homepage_pricing admin delete"
  ON public.homepage_pricing FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER homepage_pricing_set_updated_at
  BEFORE UPDATE ON public.homepage_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.homepage_pricing (key, label, value, value_type) VALUES
  ('butterfly_course_price', 'מחיר קורס Butterfly Cut', '580', 'number'),
  ('shaggy_bob_course_price', 'מחיר קורס Shaggy Bob', '580', 'number'),
  ('lob_chic_course_price', 'מחיר קורס Lob Chic', '580', 'number'),
  ('bundle_price_text', 'טקסט מחיר חבילת 3 הקורסים', '1,500 ₪ במקום 1,740 ₪', 'text');
