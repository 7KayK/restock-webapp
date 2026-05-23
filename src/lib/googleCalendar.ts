import { prisma } from '@/lib/prisma'

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://restock.chat'
const REDIRECT_URI = `${APP_URL}/api/auth/callback/google-calendar`

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

// ── OAuth ─────────────────────────────────────────────────────────────────────

export function getOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/calendar.events',
    access_type:   'offline',
    prompt:        'consent',
  })
  return `https://accounts.google.com/o/oauth2/auth?${params}`
}

export async function exchangeCodeForTokens(code: string, userId: string): Promise<void> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      code,
    }),
  })

  const data = await res.json() as {
    access_token:  string
    refresh_token?: string
    expires_in:    number
    error?:        string
  }
  if (!res.ok) throw new Error(data.error ?? 'Token exchange failed')

  const expiresAt = new Date(Date.now() + data.expires_in * 1000)

  await prisma.userIntegration.upsert({
    where:  { userId_provider: { userId, provider: 'google_calendar' } },
    update: {
      accessToken: data.access_token,
      ...(data.refresh_token && { refreshToken: data.refresh_token }),
      expiresAt,
    },
    create: {
      userId,
      provider:     'google_calendar',
      accessToken:  data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt,
    },
  })
}

// ── Token management ──────────────────────────────────────────────────────────

async function refreshAccessToken(integration: {
  id: string
  refreshToken: string | null
}): Promise<string> {
  if (!integration.refreshToken) throw new Error('No refresh token — user must reconnect Google Calendar')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: integration.refreshToken,
    }),
  })

  const data = await res.json() as { access_token: string; expires_in: number; error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Token refresh failed')

  const expiresAt = new Date(Date.now() + data.expires_in * 1000)
  await prisma.userIntegration.update({
    where: { id: integration.id },
    data:  { accessToken: data.access_token, expiresAt },
  })

  return data.access_token
}

async function getValidToken(userId: string): Promise<string> {
  const integration = await prisma.userIntegration.findFirst({
    where: { userId, provider: 'google_calendar' },
  })
  if (!integration) throw new Error('Google Calendar not connected')

  const expired = integration.expiresAt && integration.expiresAt <= new Date()
  return expired ? refreshAccessToken(integration) : integration.accessToken
}

// ── Calendar events ───────────────────────────────────────────────────────────

export interface CalendarEventInput {
  title:        string
  date:         Date
  description?: string
  location?:    string
}

export async function createCalendarEvent(
  userId: string,
  { title, date, description, location }: CalendarEventInput,
): Promise<string> {
  const token = await getValidToken(userId)

  const end = new Date(date.getTime() + 60 * 60 * 1000) // 1-hour block
  const body = JSON.stringify({
    summary:     title,
    description: description ?? undefined,
    location:    location ?? undefined,
    start: { dateTime: date.toISOString(), timeZone: 'UTC' },
    end:   { dateTime: end.toISOString(),  timeZone: 'UTC' },
  })

  const res = await fetch(CALENDAR_API, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body,
  })

  const data = await res.json() as { id: string; error?: { message: string } }
  if (!res.ok) throw new Error(data.error?.message ?? 'Failed to create calendar event')

  return data.id
}

export async function createShoppingTripEvent(
  userId: string,
  items: string[],
  date: Date,
  storeName?: string,
): Promise<string> {
  const title = storeName ? `Restock run — ${storeName}` : 'Restock shopping trip'
  const description = `Items to restock:\n${items.map((i) => `• ${i}`).join('\n')}`
  return createCalendarEvent(userId, { title, date, description, location: storeName })
}

export async function createTeamOrderEvent(
  teamId: string,
  items: string[],
  date: Date,
  notes?: string,
): Promise<string> {
  const team = await prisma.team.findUnique({
    where:  { id: teamId },
    select: { name: true, ownerId: true },
  })
  if (!team) throw new Error('Team not found')

  const parts = [
    `Team: ${team.name}`,
    `Items:\n${items.map((i) => `• ${i}`).join('\n')}`,
    notes ? `Notes: ${notes}` : null,
  ].filter(Boolean)

  return createCalendarEvent(team.ownerId, {
    title:       `${team.name} — restock order`,
    date,
    description: parts.join('\n\n'),
  })
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
  const token = await getValidToken(userId)

  const res = await fetch(`${CALENDAR_API}/${eventId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete calendar event: ${res.status}`)
  }
}
