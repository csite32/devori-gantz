import { createFileRoute } from '@tanstack/react-router'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
} as const

function extractSourceIp(headers: Record<string, string>): string | null {
  const cf = headers['cf-connecting-ip']
  if (cf) return cf
  const xff = headers['x-forwarded-for']
  if (xff) return xff.split(',')[0]?.trim() ?? null
  const real = headers['x-real-ip']
  if (real) return real
  return null
}

export const Route = createFileRoute('/api/public/webhooks/grow')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        // 1. Read the raw body first — required for future signature verification.
        const rawBody = await request.text()

        // 2. Collect all headers (lower-cased).
        const headers: Record<string, string> = {}
        request.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value
        })

        // 3. Try to parse JSON. Failure is fine — we still log the raw body.
        let parsedJson: unknown = null
        let parseError: string | null = null
        if (rawBody.length > 0) {
          try {
            parsedJson = JSON.parse(rawBody)
          } catch (err) {
            parseError = err instanceof Error ? err.message : String(err)
          }
        }

        const sourceIp = extractSourceIp(headers)

        // 4. Persist the raw log up front so we never lose the record even if
        //    downstream processing crashes. Failures here must NOT fail the
        //    response, or Grow will retry indefinitely.
        let logId: string | null = null
        try {
          const { supabaseAdmin } = await import(
            '@/integrations/supabase/client.server'
          )
          const { data, error } = await supabaseAdmin
            .from('grow_webhook_logs')
            .insert({
              method: 'POST',
              source_ip: sourceIp,
              headers,
              raw_body: rawBody,
              parsed_json: parsedJson as never,
              parse_error: parseError,
              processing_result: 'logged_only',
            })
            .select('id')
            .single()
          if (error) {
            console.error('[grow-webhook] failed to persist log', error)
          } else {
            logId = data.id
          }
        } catch (err) {
          console.error('[grow-webhook] unexpected error while logging', err)
        }

        // 5. Business processing. Only runs if we have a log row AND JSON
        //    parsed cleanly. All error paths inside processGrowWebhook update
        //    the log row and return — nothing throws out to us.
        if (logId && parseError === null) {
          try {
            const { processGrowWebhook } = await import('@/lib/grow-webhook.server')
            await processGrowWebhook({
              logId,
              parsedJson,
              rawBody,
              headers,
            })
          } catch (err) {
            console.error('[grow-webhook] processing crashed', err)
            // Best-effort mark of failure; we still return 200 below.
            try {
              const { supabaseAdmin } = await import(
                '@/integrations/supabase/client.server'
              )
              await supabaseAdmin
                .from('grow_webhook_logs')
                .update({
                  processing_result: 'processing_error',
                  processing_error:
                    err instanceof Error ? err.message : String(err),
                })
                .eq('id', logId)
            } catch (updErr) {
              console.error('[grow-webhook] failed to mark log error', updErr)
            }
          }
        }

        // Always 200 so Grow does not retry on our internal issues.
        return Response.json(
          { ok: true, received: true },
          { status: 200, headers: CORS_HEADERS },
        )
      },
    },
  },
})
