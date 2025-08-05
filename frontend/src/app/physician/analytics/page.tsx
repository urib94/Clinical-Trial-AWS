import { Metadata } from 'next'
import { AnalyticsDashboard } from '@/components/physician/AnalyticsDashboard'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Clinical trial analytics and data insights',
}

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}