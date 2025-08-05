import { Metadata } from 'next'
import { Dashboard } from '@/components/physician/Dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Physician dashboard with patient statistics and activity overview',
}

export default function DashboardPage() {
  return <Dashboard />
}