'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Plus, 
  Save, 
  Eye, 
  ArrowLeft, 
  GripVertical,
  X,
  Type,
  Hash,
  Calendar,
  Clock,
  CheckSquare,
  Radio,
  FileText,
  Star,
  Upload
} from 'lucide-react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/components/shared/ToastProvider'
import { cn, generateId } from '@/lib/utils'

const questionnaireSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  category: z.string(),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 minute'),
  allowMultipleSubmissions: z.boolean(),
  showProgressBar: z.boolean(),
  allowBackNavigation: z.boolean(),
  requireAllQuestions: z.boolean(),
})

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>

interface Question {
  id: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'time' | 'radio' | 'checkbox' | 'select' | 'scale' | 'file_upload'
  title: string
  description?: string
  required: boolean
  order: number
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }
}

const QUESTION_TYPES = [
  { type: 'text', label: 'Short Text', icon: Type, description: 'Single line text input' },
  { type: 'textarea', label: 'Long Text', icon: FileText, description: 'Multi-line text input' },
  { type: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
  { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { type: 'time', label: 'Time', icon: Clock, description: 'Time picker' },
  { type: 'radio', label: 'Single Choice', icon: Radio, description: 'Select one option' },
  { type: 'checkbox', label: 'Multiple Choice', icon: CheckSquare, description: 'Select multiple options' },
  { type: 'scale', label: 'Scale', icon: Star, description: 'Rating scale (1-10)' },
  { type: 'file_upload', label: 'File Upload', icon: Upload, description: 'File attachment' },
] as const

export function QuestionnaireBuilder() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { success, error: showError } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      category: 'custom',
      estimatedDuration: 5,
      allowMultipleSubmissions: false,
      showProgressBar: true,
      allowBackNavigation: true,
      requireAllQuestions: false,
    },
  })

  const addQuestion = useCallback((type: Question['type']) => {
    const newQuestion: Question = {
      id: generateId(),
      type,
      title: `New ${QUESTION_TYPES.find(qt => qt.type === type)?.label || 'Question'}`,
      required: false,
      order: questions.length,
      options: ['radio', 'checkbox', 'select'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    }
    setQuestions(prev => [...prev, newQuestion])
    setSelectedQuestionId(newQuestion.id)
  }, [questions.length])

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }, [])

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null)
    }
  }, [selectedQuestionId])

  const moveQuestion = useCallback((dragIndex: number, hoverIndex: number) => {
    setQuestions(prev => {
      const newQuestions = [...prev]
      const draggedQuestion = newQuestions[dragIndex]
      newQuestions.splice(dragIndex, 1)
      newQuestions.splice(hoverIndex, 0, draggedQuestion)
      return newQuestions.map((q, index) => ({ ...q, order: index }))
    })
  }, [])

  const onSubmit = async (data: QuestionnaireFormData) => {
    try {
      setIsSaving(true)

      if (questions.length === 0) {
        showError('No questions added', 'Please add at least one question to your questionnaire.')
        return
      }

      const questionnaireData = {
        ...data,
        questions: questions.map((q, index) => ({ ...q, order: index })),
        status: 'draft',
        version: '1.0',
      }

      // TODO: Replace with actual API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      success('Questionnaire saved successfully')
      router.push('/physician/questionnaires')

    } catch (error: any) {
      console.error('Save error:', error)
      showError('Failed to save questionnaire', error.message || 'Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-medium text-gray-900">
                  {isPreview ? 'Preview Questionnaire' : 'Create Questionnaire'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setIsPreview(!isPreview)}
                  className="btn btn-secondary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isPreview ? 'Edit' : 'Preview'}
                </button>
                <button
                  type="submit"
                  form="questionnaire-form"
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Questionnaire'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {!isPreview && (
            <>
              {/* Question Types Sidebar */}
              <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Question Types</h3>
                  <div className="space-y-2">
                    {QUESTION_TYPES.map((questionType) => (
                      <button
                        key={questionType.type}
                        onClick={() => addQuestion(questionType.type)}
                        className="w-full flex items-center p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <questionType.icon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {questionType.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {questionType.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Builder Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Form Settings */}
                <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                  <form id="questionnaire-form" onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Questionnaire Settings</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="form-label">Title *</label>
                          <input
                            {...register('title')}
                            type="text"
                            className={cn('form-input', errors.title && 'form-input-error')}
                            placeholder="Enter questionnaire title"
                          />
                          {errors.title && (
                            <div className="form-error">{errors.title.message}</div>
                          )}
                        </div>

                        <div>
                          <label className="form-label">Description</label>
                          <textarea
                            {...register('description')}
                            rows={3}
                            className="form-input"
                            placeholder="Brief description of the questionnaire"
                          />
                        </div>

                        <div>
                          <label className="form-label">Instructions</label>
                          <textarea
                            {...register('instructions')}
                            rows={3}
                            className="form-input"
                            placeholder="Instructions for patients"
                          />
                        </div>

                        <div>
                          <label className="form-label">Category</label>
                          <select {...register('category')} className="form-input">
                            <option value="symptom_tracker">Symptom Tracker</option>
                            <option value="medication_adherence">Medication Adherence</option>
                            <option value="quality_of_life">Quality of Life</option>
                            <option value="side_effects">Side Effects</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label">Estimated Duration (minutes)</label>
                          <input
                            {...register('estimatedDuration', { valueAsNumber: true })}
                            type="number"
                            min="1"
                            className={cn('form-input', errors.estimatedDuration && 'form-input-error')}
                          />
                          {errors.estimatedDuration && (
                            <div className="form-error">{errors.estimatedDuration.message}</div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              {...register('showProgressBar')}
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-900">Show progress bar</label>
                          </div>

                          <div className="flex items-center">
                            <input
                              {...register('allowBackNavigation')}
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-900">Allow back navigation</label>
                          </div>

                          <div className="flex items-center">
                            <input
                              {...register('requireAllQuestions')}
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-900">Require all questions</label>
                          </div>

                          <div className="flex items-center">
                            <input
                              {...register('allowMultipleSubmissions')}
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-900">Allow multiple submissions</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Question Builder */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <div className="max-w-2xl mx-auto">
                      {questions.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Start by adding a question type from the sidebar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {questions.map((question, index) => (
                            <QuestionEditor
                              key={question.id}
                              question={question}
                              index={index}
                              isSelected={selectedQuestionId === question.id}
                              onSelect={() => setSelectedQuestionId(question.id)}
                              onUpdate={updateQuestion}
                              onDelete={deleteQuestion}
                              onMove={moveQuestion}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isPreview && (
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-2xl mx-auto p-6">
                <QuestionnairePreview 
                  formData={watch()} 
                  questions={questions} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}

// Question Editor Component
interface QuestionEditorProps {
  question: Question
  index: number
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: string, updates: Partial<Question>) => void
  onDelete: (id: string) => void
  onMove: (dragIndex: number, hoverIndex: number) => void
}

function QuestionEditor({ question, index, isSelected, onSelect, onUpdate, onDelete, onMove }: QuestionEditorProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'question',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'question',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index)
        item.index = index
      }
    },
  })

  const addOption = () => {
    const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`]
    onUpdate(question.id, { options: newOptions })
  }

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])]
    newOptions[optionIndex] = value
    onUpdate(question.id, { options: newOptions })
  }

  const removeOption = (optionIndex: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== optionIndex)
    onUpdate(question.id, { options: newOptions })
  }

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn(
        'card cursor-pointer transition-all',
        isSelected ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md',
        isDragging && 'opacity-50'
      )}
      onClick={onSelect}
    >
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            <span className="text-sm font-medium text-gray-500">
              Question {index + 1}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(question.id)
            }}
            className="text-gray-400 hover:text-error-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <input
              type="text"
              value={question.title}
              onChange={(e) => onUpdate(question.id, { title: e.target.value })}
              className="form-input font-medium"
              placeholder="Question title"
            />
          </div>

          {question.description !== undefined && (
            <div>
              <textarea
                value={question.description || ''}
                onChange={(e) => onUpdate(question.id, { description: e.target.value })}
                className="form-input"
                placeholder="Question description (optional)"
                rows={2}
              />
            </div>
          )}

          {['radio', 'checkbox', 'select'].includes(question.type) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Options</label>
                <button
                  onClick={addOption}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Option
                </button>
              </div>
              <div className="space-y-2">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                      className="form-input flex-1"
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    {question.options!.length > 2 && (
                      <button
                        onClick={() => removeOption(optionIndex)}
                        className="text-gray-400 hover:text-error-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate(question.id, { required: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-900">Required</label>
            </div>
            <span className="text-xs text-gray-500 capitalize">
              {QUESTION_TYPES.find(t => t.type === question.type)?.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Questionnaire Preview Component
interface QuestionnairePreviewProps {
  formData: QuestionnaireFormData
  questions: Question[]
}

function QuestionnairePreview({ formData, questions }: QuestionnairePreviewProps) {
  return (
    <div className="card max-w-2xl mx-auto">
      <div className="card-header">
        <h1 className="text-2xl font-bold text-gray-900">{formData.title || 'Untitled Questionnaire'}</h1>
        {formData.description && (
          <p className="mt-2 text-gray-600">{formData.description}</p>
        )}
        {formData.instructions && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-900">{formData.instructions}</p>
          </div>
        )}
      </div>
      <div className="card-body space-y-6">
        {questions.length === 0 ? (
          <p className="text-center text-gray-500">No questions to preview</p>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                {index + 1}. {question.title}
                {question.required && <span className="text-error-500 ml-1">*</span>}
              </label>
              {question.description && (
                <p className="text-sm text-gray-600">{question.description}</p>
              )}
              <QuestionPreview question={question} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function QuestionPreview({ question }: { question: Question }) {
  switch (question.type) {
    case 'text':
      return <input type="text" className="form-input" placeholder="Short text answer" disabled />
    case 'textarea':
      return <textarea className="form-input" rows={4} placeholder="Long text answer" disabled />
    case 'number':
      return <input type="number" className="form-input" placeholder="Numeric answer" disabled />
    case 'date':
      return <input type="date" className="form-input" disabled />
    case 'time':
      return <input type="time" className="form-input" disabled />
    case 'radio':
      return (
        <div className="space-y-2">
          {question.options?.map((option, index) => (
            <label key={index} className="flex items-center">
              <input type="radio" name={question.id} className="h-4 w-4 text-primary-600" disabled />
              <span className="ml-2 text-gray-900">{option}</span>
            </label>
          ))}
        </div>
      )
    case 'checkbox':
      return (
        <div className="space-y-2">
          {question.options?.map((option, index) => (
            <label key={index} className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-primary-600 rounded" disabled />
              <span className="ml-2 text-gray-900">{option}</span>
            </label>
          ))}
        </div>
      )
    case 'scale':
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">1</span>
          <input type="range" min="1" max="10" className="flex-1" disabled />
          <span className="text-sm text-gray-600">10</span>
        </div>
      )
    case 'file_upload':
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
        </div>
      )
    default:
      return <div className="text-gray-500">Unsupported question type</div>
  }
}