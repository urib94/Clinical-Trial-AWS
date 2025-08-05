import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PatientDashboard } from '@/components/patient/PatientDashboard';

export const metadata: Metadata = {
  title: 'Patient Dashboard',
  description: 'View your questionnaires, progress, and manage your profile.',
};

export default function PatientPage() {
  // For now, redirect to onboarding for new users
  // In production, this would check authentication status
  return <PatientDashboard />;
}