import { Metadata } from 'next'
import { QuestionnaireBuilder } from '@/components/physician/QuestionnaireBuilder'

export const metadata: Metadata = {
  title: 'Create Questionnaire',
  description: 'Create a new questionnaire for clinical trials',
}

export default function NewQuestionnairePage() {
  return <QuestionnaireBuilder />
}