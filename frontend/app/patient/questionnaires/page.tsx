import { Metadata } from 'next';
import { QuestionnaireList } from '@/components/patient/QuestionnaireList';

export const metadata: Metadata = {
  title: 'Questionnaires',
  description: 'Complete your assigned questionnaires for the clinical trial.',
};

export default function QuestionnairesPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Questionnaires
        </h1>
        <p className="text-gray-600">
          Complete the questionnaires assigned by your research team. Your responses help advance medical research.
        </p>
      </div>

      <QuestionnaireList />
    </div>
  );
}