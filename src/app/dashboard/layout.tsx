import { DashboardShell } from '@/components/layout/DashboardShell'
import { WelcomeOnboarding } from '@/components/dashboard/WelcomeOnboarding'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WelcomeOnboarding />
      <DashboardShell>{children}</DashboardShell>
    </>
  )
}
