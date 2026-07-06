import { createFileRoute } from '@tanstack/react-router'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
} as const

// TODO (phase 2): signature verification
// Once Grow's real payload + signing scheme are known, populate these and
// verify the request BEFORE any business logic runs.
// const GROW_WEBHOOK_SECRET = process.env.GROW_WEBHOOK_SECRET
// const SIGNATURE_HEADER = '' // e.g. 'x-grow-signature'
// const TIMESTAMP_HEADER = '' // e.g. 'x-grow-timestamp'
// const SIGNATURE_TOLERANCE_SECONDS = 300

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

        // 2. Collect all headers.
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

        // 4. Persist the log. Failures here must NOT fail the response, or
        // Grow will retry indefinitely.
        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { error } = await supabaseAdmin.from('grow_webhook_logs').insert({
            method: 'POST',
            source_ip: sourceIp,
            headers,
            raw_body: rawBody,
            parsed_json: parsedJson as never,
            parse_error: parseError,
            processing_result: 'logged_only',
          })
          if (error) {
            console.error('[grow-webhook] failed to persist log', error)
          }
        } catch (err) {
          console.error('[grow-webhook] unexpected error while logging', err)
        }

        return Response.json(
          { ok: true, received: true },
          { status: 200, headers: CORS_HEADERS },
        )
      },
    },
  },
})
