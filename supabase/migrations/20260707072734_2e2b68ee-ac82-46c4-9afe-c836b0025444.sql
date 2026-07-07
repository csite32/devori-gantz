
-- 1) Idempotency: unique per provider transaction
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_provider_txn_unique UNIQUE (provider_id, provider_txn_id);

-- 2) Lookup helper
CREATE INDEX IF NOT EXISTS purchases_buyer_email_idx
  ON public.purchases (buyer_email);

-- 3) Detailed error text on webhook logs
ALTER TABLE public.grow_webhook_logs
  ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- 4) Atomic grant + purchase insert
CREATE OR REPLACE FUNCTION public.grant_grow_purchase(
  p_user_id         uuid,
  p_product_id      uuid,
  p_provider_id     uuid,
  p_provider_txn_id text,
  p_buyer_email     text,
  p_raw_payload     jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind      product_kind;
  v_course_id uuid;
  v_bundle_id uuid;
BEGIN
  SELECT kind, course_id, bundle_id
    INTO v_kind, v_course_id, v_bundle_id
  FROM public.products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product % not found', p_product_id;
  END IF;

  IF v_kind = 'course' THEN
    INSERT INTO public.course_access (user_id, course_id, source)
    VALUES (p_user_id, v_course_id, 'purchase')
    ON CONFLICT (user_id, course_id) DO NOTHING;

  ELSIF v_kind = 'bundle' THEN
    INSERT INTO public.course_access (user_id, course_id, source)
    SELECT p_user_id, bc.course_id, 'bundle'
    FROM public.bundle_courses bc
    WHERE bc.bundle_id = v_bundle_id
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  INSERT INTO public.purchases (
    provider_id, provider_txn_id, buyer_email,
    product_id, status, raw_payload, processed_at
  )
  VALUES (
    p_provider_id, p_provider_txn_id, p_buyer_email,
    p_product_id, 'paid', p_raw_payload, now()
  )
  ON CONFLICT (provider_id, provider_txn_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_grow_purchase(uuid, uuid, uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_grow_purchase(uuid, uuid, uuid, text, text, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_grow_purchase(uuid, uuid, uuid, text, text, jsonb) TO service_role;
