CREATE TABLE public.ui_overrides (
  editor_id TEXT PRIMARY KEY,
  section TEXT,
  styles JSONB NOT NULL DEFAULT '{}'::jsonb,
  text_content TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ui_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ui_overrides TO authenticated;
GRANT ALL ON public.ui_overrides TO service_role;

ALTER TABLE public.ui_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ui_overrides readable by everyone"
  ON public.ui_overrides FOR SELECT
  USING (true);

CREATE POLICY "ui_overrides admin insert"
  ON public.ui_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ui_overrides admin update"
  ON public.ui_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ui_overrides admin delete"
  ON public.ui_overrides FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ui_overrides_set_updated_at
  BEFORE UPDATE ON public.ui_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();