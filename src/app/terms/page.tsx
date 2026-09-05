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

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-[14px] text-[#5b6a5d]">Last updated September 5, 2026</p>
          </div>

          <div className="flex flex-col gap-10">
            <Section title="1. Agreement to terms">
              <p>
                By creating a Restock account or using the Restock Telegram or WhatsApp bots, you
                agree to these Terms. If you don&rsquo;t agree, please don&rsquo;t use the service.
              </p>
            </Section>

            <Section title="2. What Restock is">
              <p>
                Restock is a household and small-business purchase tracking service. You log
                purchases by message, receipt photo, or manual entry; Restock uses that history to
                predict when items are likely to run low, send reminders, surface deals, help you
                find nearby stores, and answer questions about your own data through an AI
                assistant. Restock does not process payments and does not connect to your bank
                account or card.
              </p>
            </Section>

            <Section title="3. Your account">
              <p>
                You&rsquo;re responsible for keeping your account credentials and any linked
                Telegram or WhatsApp identity secure, and for the accuracy of the information you
                log. You must be able to form a binding agreement to use Restock.
              </p>
            </Section>

            <Section title="4. Acceptable use">
              <p>
                You agree not to misuse the service — including attempting to access another
                user&rsquo;s account or Team data without authorization, sending abusive or
                automated spam through the Telegram or WhatsApp bots, or attempting to reverse
                engineer, scrape, or disrupt Restock&rsquo;s systems.
              </p>
            </Section>

            <Section title="5. Teams">
              <p>
                If you create a Restock Team, you&rsquo;re responsible for who you invite and for
                understanding that purchases and reminders logged under that Team are visible to
                its members. Removing a member does not retroactively delete purchase history they
                contributed while active.
              </p>
            </Section>

            <Section title="6. Third-party integrations">
              <p>
                Connecting Google Calendar, Telegram, or WhatsApp to Restock is optional and
                governed by those providers&rsquo; own terms in addition to ours. Restock isn&rsquo;t
                responsible for the availability or behavior of third-party services.
              </p>
            </Section>

            <Section title="7. AI features and predictions">
              <p>
                Restocking predictions, spending insights, and AI assistant responses are generated
                from your own logged data and are estimates, not guarantees — actual consumption can
                vary. Nothing in Restock constitutes financial advice, and deal or pricing
                information is sourced from third parties and may not reflect current, in-store
                availability or pricing.
              </p>
            </Section>

            <Section title="8. Intellectual property">
              <p>
                Restock&rsquo;s branding, design, and underlying software are owned by Restock
                Solutions. You retain ownership of the purchase and household data you log; by
                using the service, you grant us the right to process it as described in our{' '}
                <a href="/privacy" className="text-[#132B22] font-semibold underline">
                  Privacy Policy
                </a>{' '}
                to operate Restock for you.
              </p>
            </Section>

            <Section title="9. Termination">
              <p>
                You may stop using Restock and request account deletion at any time. We may
                suspend or terminate access for accounts that violate these Terms or misuse the
                service.
              </p>
            </Section>

            <Section title="10. Disclaimer and limitation of liability">
              <p>
                Restock is provided &ldquo;as is,&rdquo; without warranties of any kind. To the
                fullest extent permitted by law, Restock and its operators are not liable for
                indirect, incidental, or consequential damages arising from your use of the
                service, including reliance on restocking predictions or deal information.
              </p>
            </Section>

            <Section title="11. Changes to these terms">
              <p>
                We may update these Terms as the service evolves. Continued use of Restock after an
                update means you accept the revised Terms, reflected by the date at the top of this
                page.
              </p>
            </Section>

            <Section title="12. Governing law">
              <p>
                These Terms are governed by the laws of Saskatchewan, Canada, without regard to
                conflict-of-law principles.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                Questions about these Terms can be sent to{' '}
                <a href="mailto:hello@restock.chat" className="text-[#132B22] font-semibold underline">
                  hello@restock.chat
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
