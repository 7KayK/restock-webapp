'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: Message = {
  role: 'assistant',
  content:
    "Hi! I can help you understand your purchase history, check when items need restocking, or break down your spending. What would you like to know?",
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setStreaming(true)

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abort.signal,
      })

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '(no body)')
        console.error('[ChatInterface] API error:', res.status, res.statusText, errText)
        throw new Error(`Request failed: ${res.status} ${errText}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = {
            role: 'assistant',
            content: copy[copy.length - 1].content + chunk,
          }
          return copy
        })
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('[ChatInterface] Caught error:', err)
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }
        return copy
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [input, messages, streaming])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex flex-col bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]" style={{ height: 'calc(100vh - 290px)', minHeight: '380px' }}>
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center gap-2 text-base text-[#132B22]">
          <MessageSquare className="h-4 w-4 text-[#132B22]" />
          Chat with your data
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4 min-h-0 pt-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[#132B22] text-white'
                      : 'bg-[#F7F2E7] text-[#132B22] border border-[rgba(19,43,34,0.10)]'
                  )}
                >
                  {msg.content}
                  {streaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                    <span className="inline-flex items-center gap-1 ml-1">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-[#132B22] inline-block"
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            delay: dot * 0.2,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          className="flex gap-2 shrink-0"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your purchases, spending, or restocks…"
            disabled={streaming}
            className="flex-1 text-[#132B22] placeholder:text-[#132B22]/35"
          />
          <motion.div
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Button
              type="submit"
              size="icon"
              disabled={streaming || !input.trim()}
              className="bg-[#132B22] hover:bg-[#132B22]/90 text-white shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  )
}
