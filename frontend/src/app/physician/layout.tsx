import { Metadata } from 'next'
import { PhysicianLayout } from '@/components/physician/PhysicianLayout'

export const metadata: Metadata = {
  title: 'Physician Portal',
  description: 'Clinical trial management portal for physicians',
}

export default function PhysicianPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PhysicianLayout>
      {children}
    </PhysicianLayout>
  )
}