import { ChatInterface } from '@/components/shared/ChatInterface'

export default function AssistantPage() {
  return (
    <div className="space-y-6 max-w-4xl h-full flex flex-col">
      <div className="shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-[#132B22]">AI Assistant</h1>
        <p className="text-sm text-[#132B22]/50 mt-0.5">
          Ask about your purchases, spending patterns, or restock predictions
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  )
}
