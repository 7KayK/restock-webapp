import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart, BarChart3, Bell, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Restock
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col flex-1 items-center justify-center text-center px-6 py-24 gap-6">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Claude AI
        </div>
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl">
          Never run out of anything again
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl">
          Restock tracks your grocery purchases, predicts when you&apos;ll run out, and finds
          the best deals near you — automatically.
        </p>
        <div className="flex gap-3 mt-4">
          <Button size="lg" asChild>
            <Link href="/sign-up">Start for free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">View dashboard</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="rounded-lg border p-6 flex flex-col gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h3 className="font-semibold">Spend Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Visualize your grocery spending by category and time period.
          </p>
        </div>
        <div className="rounded-lg border p-6 flex flex-col gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h3 className="font-semibold">Smart Reminders</h3>
          <p className="text-sm text-muted-foreground">
            AI predicts restock dates based on your purchase history.
          </p>
        </div>
        <div className="rounded-lg border p-6 flex flex-col gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Ask questions, log purchases by voice, and get personalized insights.
          </p>
        </div>
      </section>
    </main>
  )
}
