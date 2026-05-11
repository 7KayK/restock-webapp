import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { createTextStreamResponse } from 'ai'
import { anthropic, DEFAULT_MODEL } from '@/lib/claude'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

function buildSystemPrompt(context: {
  purchases: Array<{ item: string; quantity: number; unit: string | null; category: string | null; createdAt: Date }>
  monthlySpend: number
  reminders: Array<{ item: string; predictedDate: Date; confidence: number }>
}): string {
  const recentLines = context.purchases
    .slice(0, 30)
    .map((p) => {
      const unit = p.unit ? ` ${p.unit}` : ''
      const cat = p.category ? ` [${p.category}]` : ''
      const date = p.createdAt.toISOString().slice(0, 10)
      return `- ${p.item} × ${p.quantity}${unit}${cat} (${date})`
    })
    .join('\n')

  const reminderLines = context.reminders
    .map((r) => {
      const date = r.predictedDate.toISOString().slice(0, 10)
      const pct = Math.round(r.confidence * 100)
      return `- ${r.item}: due ${date} (${pct}% confidence)`
    })
    .join('\n')

  return `You are the Restock AI assistant — an intelligent household purchase tracker and restocking advisor.

You help this specific user manage their household purchases, predict when items need restocking, and understand their spending.

## User Context

**This month's spend:** $${context.monthlySpend.toFixed(2)}

**Recent purchases (last 30):**
${recentLines || 'No purchases yet.'}

**Active restock reminders:**
${reminderLines || 'No active reminders.'}

## Your Role

- Answer questions about the user's purchase history, spending patterns, and restock predictions using the data above
- Help the user understand when items are running low based on their purchase frequency
- Provide brief, actionable spending insights when asked
- Stay on topic: household purchases, restocking, and spending analysis only
- Be concise — respond in plain text, no markdown formatting
- When asked about a specific item, reference the actual data above if available`
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { messages?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'messages array is required' }, { status: 400 })
  }

  try {
    const user = await getOrCreateUser(userId)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [purchases, spendRows, reminders] = await Promise.all([
      prisma.purchase.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { item: true, quantity: true, unit: true, category: true, createdAt: true },
      }),
      prisma.purchase.findMany({
        where: { userId: user.id, createdAt: { gte: monthStart }, price: { not: null } },
        select: { price: true },
      }),
      prisma.reminder.findMany({
        where: { userId: user.id, active: true },
        orderBy: { predictedDate: 'asc' },
        take: 10,
        select: { item: true, predictedDate: true, confidence: true },
      }),
    ])

    const monthlySpend = spendRows.reduce((sum, p) => sum + (p.price ?? 0), 0)
    const systemPrompt = buildSystemPrompt({ purchases, monthlySpend, reminders })

    const allMessages = messages
      .filter((m): m is { role: 'user' | 'assistant'; content: string } => {
        if (typeof m !== 'object' || m === null) return false
        const role = (m as Record<string, unknown>).role
        return role === 'user' || role === 'assistant'
      })
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: String((m as Record<string, unknown>).content ?? ''),
      }))

    // Anthropic requires the first message to be from 'user'. Drop any leading assistant
    // messages (e.g. the UI welcome bubble) before sending to the API.
    const firstUserIdx = allMessages.findIndex((m) => m.role === 'user')
    const validMessages = firstUserIdx >= 0 ? allMessages.slice(firstUserIdx) : []

    if (validMessages.length === 0) {
      return Response.json({ error: 'No valid messages' }, { status: 400 })
    }

    console.log('[/api/ai] Starting stream — model:', DEFAULT_MODEL, 'messages:', validMessages.length)

    const stream = anthropic.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: 1000,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: validMessages,
    })

    const textStream = new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(event.delta.text)
            }
          }
          controller.close()
        } catch (err) {
          console.error('[/api/ai] Stream error:', err)
          controller.error(err)
        }
      },
      cancel() {
        stream.controller.abort()
      },
    })

    return createTextStreamResponse({ textStream })
  } catch (err) {
    console.error('[/api/ai] Handler error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
