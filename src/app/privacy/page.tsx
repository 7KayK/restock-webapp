import { MarketingNav } from '@/components/shared/MarketingNav'
import { MarketingFooter } from '@/components/shared/MarketingFooter'

const PLAYFAIR: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[#132B22] font-semibold text-[18px]">{title}</h2>
      <div className="text-[#3a473e] leading-relaxed text-[15px] flex flex-col gap-3">
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F2E7' }}>
      <MarketingNav />

      <main className="flex-1 px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="mb-14">
            <h1
              className="text-[#132B22] leading-tight mb-3"
              style={{ ...PLAYFAIR, fontSize: 'clamp(30px, 4vw, 42px)' }}
            >
              Privacy Policy
            </h1>
            <p className="text-[14px] text-[#5b6a5d]">Last updated September 5, 2026</p>
          </div>

          <div className="flex flex-col gap-10">
            <Section title="Overview">
              <p>
                Restock (&ldquo;Restock,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a household
                and small-business purchase tracking platform, operated across a web dashboard, a
                Telegram bot, and a WhatsApp bot that share one account and one database. This
                policy explains what information we collect across those channels, how we use it,
                and the choices you have.
              </p>
            </Section>

            <Section title="Information we collect">
              <p>
                <strong className="text-[#132B22]">Account information.</strong> Your email address
                and authentication details, handled through our authentication provider, Clerk.
                If you link Telegram or WhatsApp, we store the identifier needed to connect your
                messages to your account.
              </p>
              <p>
                <strong className="text-[#132B22]">Purchase and reminder data.</strong> Items,
                quantities, prices, and categories you log — by message, receipt photo, or manual
                entry — along with the restocking predictions and reminders Restock generates from
                that history.
              </p>
              <p>
                <strong className="text-[#132B22]">Receipt and photo uploads.</strong> Images you
                submit for item recognition are sent to our AI provider for processing and used to
                extract the items, quantities, and prices shown to you for confirmation.
              </p>
              <p>
                <strong className="text-[#132B22]">Location.</strong> If you use the store finder,
                your browser may share your approximate location with us for that single request,
                to find nearby stores. We do not track or store your location history.
              </p>
              <p>
                <strong className="text-[#132B22]">Calendar access.</strong> If you connect Google
                Calendar, we store the access token needed to create restock reminder events on
                your behalf, and nothing else from your calendar.
              </p>
              <p>
                <strong className="text-[#132B22]">Team data.</strong> If you create or join a
                Restock Team, purchases and reminders logged under that Team are visible to its
                other members.
              </p>
              <p>
                <strong className="text-[#132B22]">Waitlist information.</strong> If you join a
                waitlist before a feature launches, we collect your name, email, and country.
              </p>
            </Section>

            <Section title="How we use your information">
              <p>
                We use your data to operate the service you&rsquo;ve signed up for: predicting when
                items are likely to run out, sending reminders, answering your questions through
                the AI assistant using your own purchase history, matching deals to items you buy,
                and syncing reminders to your calendar if you&rsquo;ve connected it.
              </p>
              <p>
                Your purchase history is used only to power your own account&rsquo;s reminders,
                spending view, and AI assistant — and, where applicable, your Team&rsquo;s shared
                view. We do not use it for advertising, and we do not sell it.
              </p>
            </Section>

            <Section title="What we don't do">
              <p>
                Restock never connects to your bank account or card — there is nothing financial to
                link, because you log purchases by message, photo, or manual entry. We do not sell
                your personal information to third parties, and we do not share your purchase data
                with anyone outside your account or Team without your action.
              </p>
            </Section>

            <Section title="Third parties we work with">
              <p>
                Restock relies on a small number of service providers to operate, each of which
                processes data only as needed to provide their part of the service:
              </p>
              <p>
                Clerk (authentication), Anthropic (AI assistant responses and receipt/photo item
                recognition), Google (Calendar sync and, for the store finder, Maps/Places search),
                Telegram and WhatsApp (the messaging channels you choose to use), Railway (database
                hosting), and Vercel (web hosting). Deal and product information is retrieved from
                Kroger&rsquo;s developer platform and Open Food Facts, a public product database —
                these lookups do not include your personal information.
              </p>
            </Section>

            <Section title="Your choices and control">
              <p>
                You can disconnect Google Calendar or unlink Telegram/WhatsApp at any time from
                Settings. To request a copy of your data or full account deletion, contact us using
                the details below — we will act on verified requests within a reasonable time.
              </p>
            </Section>

            <Section title="Data security">
              <p>
                We use reasonable technical and organizational measures, including those provided
                by our hosting and infrastructure partners, to protect your information. No method
                of transmission or storage is completely secure, and we cannot guarantee absolute
                security.
              </p>
            </Section>

            <Section title="Children's privacy">
              <p>
                Restock is not directed at children, and we do not knowingly collect information
                from anyone under 13. If you believe a child has provided us with personal
                information, please contact us so we can remove it.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                We may update this policy as Restock&rsquo;s features change. Material changes will
                be reflected by updating the date at the top of this page.
              </p>
            </Section>

            <Section title="Contact us">
              <p>
                Questions about this policy or your data can be sent to{' '}
                <a href="mailto:privacy@restock.chat" className="text-[#132B22] font-semibold underline">
                  privacy@restock.chat
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
