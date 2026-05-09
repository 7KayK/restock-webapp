import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart, BarChart3, Bell, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F7B6C] flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <span className="text-[#1B3A5C] font-bold text-lg">Restock</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-[#1B3A5C]/70 hover:text-[#1B3A5C]" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button className="bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 text-white" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col flex-1 items-center justify-center text-center px-6 py-24 gap-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#0F7B6C]/20 bg-[#0F7B6C]/5 px-3 py-1 text-sm text-[#0F7B6C] font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Claude AI
        </div>
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl text-[#1B3A5C]">
          Never run out of anything again
        </h1>
        <p className="text-xl text-[#1B3A5C]/55 max-w-xl leading-relaxed">
          Restock tracks your purchases, predicts when you&apos;ll run out, and finds
          the best deals near you — automatically.
        </p>
        <div className="flex gap-3 mt-4">
          <Button size="lg" className="bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 text-white" asChild>
            <Link href="/sign-up">Start for free</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-[#1B3A5C]/20 text-[#1B3A5C]" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-gray-100 bg-white p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0F7B6C]/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-[#0F7B6C]" />
          </div>
          <h3 className="font-semibold text-[#1B3A5C]">Spend Analytics</h3>
          <p className="text-sm text-[#1B3A5C]/55 leading-relaxed">
            Visualise your spending by category and time period.
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0F7B6C]/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-[#0F7B6C]" />
          </div>
          <h3 className="font-semibold text-[#1B3A5C]">Smart Reminders</h3>
          <p className="text-sm text-[#1B3A5C]/55 leading-relaxed">
            AI predicts restock dates based on your purchase history.
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0F7B6C]/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-[#0F7B6C]" />
          </div>
          <h3 className="font-semibold text-[#1B3A5C]">AI Assistant</h3>
          <p className="text-sm text-[#1B3A5C]/55 leading-relaxed">
            Ask questions, log purchases by voice, and get personalised insights.
          </p>
        </div>
      </section>
    </main>
  )
}
