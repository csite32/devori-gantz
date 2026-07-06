CREATE TABLE public.grow_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL DEFAULT 'POST',
  source_ip text,
  headers jsonb,
  raw_body text,
  parsed_json jsonb,
  parse_error text,
  processing_result text NOT NULL DEFAULT 'logged_only',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.grow_webhook_logs TO service_role;

ALTER TABLE public.grow_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX grow_webhook_logs_received_at_idx
  ON public.grow_webhook_logs (received_at DESC);