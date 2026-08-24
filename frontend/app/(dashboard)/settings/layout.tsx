import { requireAdmin } from '@/lib/actions/auth-guard'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <>{children}</>
}