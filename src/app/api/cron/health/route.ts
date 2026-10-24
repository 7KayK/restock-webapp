import { NextRequest } from 'next/server'

// Runs once a day (see vercel.json). Calls the protected /api/health deep check
// and, if anything is failing, emails an alert so problems with prices, Google
// or the database are found before users hit them.
//
// Needs, in Vercel env vars: CRON_SECRET (Vercel sends it automatically on
// cron calls) and HEALTH_TOKEN. For the email: RESEND_API_KEY, ALERT_EMAIL
// (where to send) and optionally ALERT_FROM. Without those the failure is
// still written to the logs.
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Not found', { status: 404 })
  }
  const token = process.env.HEALTH_TOKEN
  if (!token) return Response.json({ ok: false, error: 'HEALTH_TOKEN not set' }, { status: 500 })

  const origin = new URL(request.url).origin
  let report: { status?: string; failed?: string[]; checks?: { name: string; ok: boolean; detail: string }[] } | null = null
  let fetchError: string | null = null
  try {
    const res = await fetch(`${origin}/api/health?token=${encodeURIComponent(token)}&deep=1`, { cache: 'no-store' })
    report = res.ok ? await res.json() : null
    if (!res.ok) fetchError = `health endpoint returned HTTP ${res.status}`
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err)
  }

  const ok = report?.status === 'ALL_OK'
  if (ok) return Response.json({ ok: true })

  const lines = report?.checks?.filter((c) => !c.ok).map((c) => `- ${c.name}: ${c.detail.slice(0, 300)}`) ?? []
  const text = fetchError
    ? `Restock daily check could not run: ${fetchError}`
    : `Restock daily check found problems:\n${lines.join('\n') || '(no detail)'}`
  console.error('[cron health]', text)

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ALERT_EMAIL
  if (apiKey && to) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.ALERT_FROM ?? 'Restock Alerts <onboarding@resend.dev>',
          to: [to],
          subject: 'Restock daily check: problems found',
          text,
        }),
      })
    } catch (err) {
      console.error('[cron health] email failed', err)
    }
  }
  return Response.json({ ok: false, emailed: Boolean(apiKey && to) })
}
