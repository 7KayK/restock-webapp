import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Install Restock on your phone',
  description: 'Add Restock to your home screen in under a minute.',
}

const steps = [
  'Open restock.chat in Chrome on your Android phone and sign in.',
  'Tap the three-dot menu at the top right.',
  'Tap “Install app” (or “Add to Home screen”), then confirm.',
  'Open Restock from your home screen like any other app.',
  'When asked, allow Location. Restock needs it to find stores near you and work out drive times.',
]

export default function InstallPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-12 text-[#132B22]">
      <h1 className="text-3xl font-medium [font-family:var(--font-playfair)]">Install Restock on your phone</h1>
      <p className="mt-3 text-sm text-[#132B22]/65">
        Restock tells you the best place to shop for your list, using typical local prices, traffic-aware drive time and
        fuel cost. It takes under a minute to install.
      </p>

      <h2 className="mt-8 text-lg font-medium">Android (Chrome)</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>

      <h2 className="mt-8 text-lg font-medium">iPhone (Safari)</h2>
      <p className="mt-3 text-sm">
        Open restock.chat in Safari, tap the Share button, then “Add to Home Screen”.
      </p>

      <h2 className="mt-8 text-lg font-medium">Try this first</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
        <li>Add three or four things you buy often (for example milk, eggs, pork ribs).</li>
        <li>Open the Shopping Trip page and tap “Make the trip”.</li>
        <li>Tell us if a price looks wrong, a store is missing, or anything is confusing. Your feedback shapes what we build next.</li>
      </ul>

      <p className="mt-8 text-xs text-[#132B22]/45">
        Prices are typical local estimates, not today&apos;s shelf prices. Restock can&apos;t see live stock or how busy a store is.
      </p>
    </main>
  )
}
