import { Metadata } from 'next'
import { PatientManagement } from '@/components/physician/PatientManagement'

export const metadata: Metadata = {
  title: 'Patients',
  description: 'Manage your clinical trial patients',
}

export default function PatientsPage() {
  return <PatientManagement />
}