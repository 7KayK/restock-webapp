import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { anthropic, DEFAULT_MODEL } from '@/lib/claude'

const SYSTEM_PROMPT = `You are the Restock AI assistant. You help users:
- Log grocery purchases (extract: item, quantity, unit, category, price)
- Check when items need to be restocked
- Analyze spending patterns
- Find deals and savings opportunities

When a user logs a purchase, extract structured data and confirm what was logged.
Be concise and helpful. Respond in plain text (no markdown).`

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { messages } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'messages array is required' }, { status: 400 })
  }

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const block = response.content[0]
  const content = block.type === 'text' ? block.text : ''

  return Response.json({ content })
}
