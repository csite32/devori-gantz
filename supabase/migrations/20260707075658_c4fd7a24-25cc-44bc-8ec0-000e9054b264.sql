
-- 1) ui_overrides: hide updated_by from public/authenticated reads
REVOKE SELECT (updated_by) ON public.ui_overrides FROM anon, authenticated;

-- 2) Set immutable search_path on email queue helper functions
ALTER FUNCTION public.delete_email(text, bigint)               SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_email(text, jsonb)               SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb)   SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
