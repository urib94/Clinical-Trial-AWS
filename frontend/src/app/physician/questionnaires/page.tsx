import { Metadata } from 'next'
import { QuestionnaireList } from '@/components/physician/QuestionnaireList'

export const metadata: Metadata = {
  title: 'Questionnaires',
  description: 'Manage and create questionnaires for clinical trials',
}

export default function QuestionnairesPage() {
  return <QuestionnaireList />
}