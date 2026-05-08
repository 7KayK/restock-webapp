import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'

export async function streamChatResponse(
  messages: Anthropic.MessageParam[],
  systemPrompt?: string
) {
  return anthropic.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })
}

export async function getChatResponse(
  messages: Anthropic.MessageParam[],
  systemPrompt?: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}
