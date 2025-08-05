import type { Metadata } from 'next';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { PatientFooter } from '@/components/patient/PatientFooter';
import { OfflineIndicator } from '@/components/patient/OfflineIndicator';

export const metadata: Metadata = {
  title: 'Patient Portal',
  description: 'Secure patient portal for clinical trial data collection.',
};

interface PatientLayoutProps {
  children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Patient-specific header */}
      <PatientHeader />
      
      {/* Offline status indicator */}
      <OfflineIndicator />
      
      {/* Main content area */}
      <main 
        id="main-content"
        className="flex-1 focus:outline-none"
        tabIndex={-1}
        role="main"
        aria-label="Patient portal main content"
      >
        <div className="medical-container py-6">
          {children}
        </div>
      </main>
      
      {/* Patient-specific footer */}
      <PatientFooter />
    </div>
  );
}