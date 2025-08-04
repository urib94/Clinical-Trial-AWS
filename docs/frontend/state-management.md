# State Management Architecture - Clinical Trial Platform

## Overview

This document defines the state management architecture for the dual-portal Clinical Trial platform, ensuring efficient data flow, offline capabilities, and optimal performance across both physician admin and patient portals.

## State Management Philosophy

### 1. Hybrid Approach
- **React Context**: Global application state (auth, theme, notifications)
- **TanStack Query**: Server state management with caching and synchronization
- **Local State**: Component-specific state with useState/useReducer
- **URL State**: Navigation and filter state managed through Next.js router

### 2. Data Flow Principles
- **Unidirectional Data Flow**: Clear data propagation patterns
- **Optimistic Updates**: Immediate UI feedback with rollback capability
- **Offline-First**: Local state with background synchronization
- **Real-time Updates**: WebSocket integration for multi-user scenarios

## Global State Architecture

### Authentication Context

```typescript
// lib/contexts/AuthContext.tsx
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  mfaRequired: boolean;
  sessionExpiry: Date | null;
}

interface AuthActions {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setupMFA: (method: MFAMethod) => Promise<void>;
  verifyMFA: (code: string) => Promise<void>;
}

const AuthContext = createContext<{
  state: AuthState;
  actions: AuthActions;
} | null>(null);
```

### Theme and Accessibility Context

```typescript
// lib/contexts/ThemeContext.tsx
interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

interface ThemeActions {
  setMode: (mode: ThemeState['mode']) => void;
  setFontSize: (size: ThemeState['fontSize']) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setColorBlindnessMode: (mode: ThemeState['colorBlindnessMode']) => void;
}
```

### Notification Context

```typescript
// lib/contexts/NotificationContext.tsx
interface NotificationState {
  notifications: Notification[];
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  requestPushPermission: () => Promise<boolean>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
}
```

### Offline and PWA Context

```typescript
// lib/contexts/OfflineContext.tsx
interface OfflineState {
  isOnline: boolean;
  pendingActions: PendingAction[];
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSync: Date | null;
  storageUsage: {
    used: number;
    available: number;
  };
}

interface OfflineActions {
  queueAction: (action: OfflineAction) => void;
  syncPendingActions: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  exportOfflineData: () => Promise<Blob>;
}
```

## Server State Management (TanStack Query)

### Query Configuration

```typescript
// lib/queries/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408, 429
        if (error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status)) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        // Global error handling
        console.error('Mutation error:', error);
      },
    },
  },
});
```

### Query Keys Structure

```typescript
// lib/queries/keys.ts
export const queryKeys = {
  // Authentication
  auth: {
    user: ['auth', 'user'] as const,
    permissions: ['auth', 'permissions'] as const,
  },
  
  // Physician Portal
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    patients: {
      all: ['admin', 'patients'] as const,
      byId: (id: string) => ['admin', 'patients', id] as const,
      roster: (filters: PatientFilters) => ['admin', 'patients', 'roster', filters] as const,
    },
    questionnaires: {
      all: ['admin', 'questionnaires'] as const,
      byId: (id: string) => ['admin', 'questionnaires', id] as const,
      responses: (questionnaireId: string) => ['admin', 'questionnaires', questionnaireId, 'responses'] as const,
    },
    analytics: {
      summary: ['admin', 'analytics', 'summary'] as const,
      responses: (filters: AnalyticsFilters) => ['admin', 'analytics', 'responses', filters] as const,
    },
    media: {
      all: ['admin', 'media'] as const,
      byPatient: (patientId: string) => ['admin', 'media', 'patient', patientId] as const,
    },
  },
  
  // Patient Portal
  patient: {
    profile: ['patient', 'profile'] as const,
    questionnaires: {
      assigned: ['patient', 'questionnaires', 'assigned'] as const,
      byId: (id: string) => ['patient', 'questionnaires', id] as const,
      responses: ['patient', 'questionnaires', 'responses'] as const,
    },
    media: {
      uploads: ['patient', 'media', 'uploads'] as const,
      library: ['patient', 'media', 'library'] as const,
    },
    history: ['patient', 'history'] as const,
  },
} as const;
```

## Portal-Specific State Management

### Physician Admin Portal State

#### Questionnaire Builder State

```typescript
// hooks/admin/useQuestionnaireBuilder.ts
interface QuestionnaireBuilderState {
  questionnaire: QuestionnaireBuilder;
  activeQuestionId: string | null;
  draggedQuestion: Question | null;
  isPreviewMode: boolean;
  unsavedChanges: boolean;
  validationErrors: ValidationError[];
}

const useQuestionnaireBuilder = (questionnaireId?: string) => {
  const [state, dispatch] = useReducer(questionnaireBuilderReducer, initialState);
  
  // Auto-save functionality
  const debouncedSave = useMemo(
    () => debounce(async (questionnaire: QuestionnaireBuilder) => {
      await saveQuestionnaireDraft(questionnaire);
      dispatch({ type: 'MARK_SAVED' });
    }, 2000),
    []
  );
  
  // Actions
  const actions = useMemo(() => ({
    addQuestion: (question: Question, position?: number) => {
      dispatch({ type: 'ADD_QUESTION', payload: { question, position } });
      debouncedSave(state.questionnaire);
    },
    
    updateQuestion: (questionId: string, updates: Partial<Question>) => {
      dispatch({ type: 'UPDATE_QUESTION', payload: { questionId, updates } });
      debouncedSave(state.questionnaire);
    },
    
    deleteQuestion: (questionId: string) => {
      dispatch({ type: 'DELETE_QUESTION', payload: { questionId } });
      debouncedSave(state.questionnaire);
    },
    
    reorderQuestions: (fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER_QUESTIONS', payload: { fromIndex, toIndex } });
      debouncedSave(state.questionnaire);
    },
    
    setActiveQuestion: (questionId: string | null) => {
      dispatch({ type: 'SET_ACTIVE_QUESTION', payload: { questionId } });
    },
    
    togglePreview: () => {
      dispatch({ type: 'TOGGLE_PREVIEW' });
    },
    
    validateQuestionnaire: () => {
      const errors = validateQuestionnaireStructure(state.questionnaire);
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: { errors } });
      return errors.length === 0;
    },
  }), [state.questionnaire, debouncedSave]);
  
  return { state, actions };
};
```

#### Patient Management State

```typescript
// hooks/admin/usePatientManagement.ts
interface PatientManagementState {
  selectedPatients: Set<string>;
  filters: PatientFilters;
  sortBy: PatientSortField;
  sortOrder: 'asc' | 'desc';
  bulkAction: BulkAction | null;
  searchQuery: string;
}

const usePatientManagement = () => {
  const [state, setState] = useState<PatientManagementState>(initialState);
  
  const actions = useMemo(() => ({
    selectPatient: (patientId: string) => {
      setState(prev => ({
        ...prev,
        selectedPatients: new Set([...prev.selectedPatients, patientId])
      }));
    },
    
    deselectPatient: (patientId: string) => {
      setState(prev => {
        const selected = new Set(prev.selectedPatients);
        selected.delete(patientId);
        return { ...prev, selectedPatients: selected };
      });
    },
    
    selectAll: (patientIds: string[]) => {
      setState(prev => ({
        ...prev,
        selectedPatients: new Set(patientIds)
      }));
    },
    
    clearSelection: () => {
      setState(prev => ({
        ...prev,
        selectedPatients: new Set()
      }));
    },
    
    updateFilters: (filters: Partial<PatientFilters>) => {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, ...filters }
      }));
    },
    
    updateSort: (field: PatientSortField, order?: 'asc' | 'desc') => {
      setState(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: order || (prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc')
      }));
    },
    
    setSearchQuery: (query: string) => {
      setState(prev => ({ ...prev, searchQuery: query }));
    },
    
    setBulkAction: (action: BulkAction | null) => {
      setState(prev => ({ ...prev, bulkAction: action }));
    },
  }), []);
  
  return { state, actions };
};
```

### Patient Portal State

#### Questionnaire Response State

```typescript
// hooks/patient/useQuestionnaireResponse.ts
interface QuestionnaireResponseState {
  responses: Record<string, ResponseValue>;
  currentStep: number;
  totalSteps: number;
  isValid: boolean;
  validationErrors: Record<string, string[]>;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  completionPercentage: number;
}

const useQuestionnaireResponse = (questionnaireId: string) => {
  const [state, dispatch] = useReducer(questionnaireResponseReducer, initialState);
  
  // Auto-save with offline support
  const { queueAction } = useOffline();
  
  const debouncedAutoSave = useMemo(
    () => debounce(async (responses: Record<string, ResponseValue>) => {
      dispatch({ type: 'SET_AUTO_SAVE_STATUS', payload: 'saving' });
      
      try {
        if (navigator.onLine) {
          await saveQuestionnaireResponse(questionnaireId, responses);
        } else {
          queueAction({
            type: 'SAVE_QUESTIONNAIRE_RESPONSE',
            payload: { questionnaireId, responses },
            timestamp: new Date(),
          });
        }
        dispatch({ type: 'SET_AUTO_SAVE_STATUS', payload: 'saved' });
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date() });
      } catch (error) {
        dispatch({ type: 'SET_AUTO_SAVE_STATUS', payload: 'error' });
        console.error('Auto-save failed:', error);
      }
    }, 3000),
    [questionnaireId, queueAction]
  );
  
  const actions = useMemo(() => ({
    updateResponse: (questionId: string, value: ResponseValue) => {
      dispatch({ type: 'UPDATE_RESPONSE', payload: { questionId, value } });
      debouncedAutoSave({ ...state.responses, [questionId]: value });
    },
    
    nextStep: () => {
      if (state.currentStep < state.totalSteps) {
        dispatch({ type: 'NEXT_STEP' });
      }
    },
    
    previousStep: () => {
      if (state.currentStep > 1) {
        dispatch({ type: 'PREVIOUS_STEP' });
      }
    },
    
    goToStep: (step: number) => {
      if (step >= 1 && step <= state.totalSteps) {
        dispatch({ type: 'GO_TO_STEP', payload: step });
      }
    },
    
    validateCurrentStep: () => {
      const errors = validateStep(state.currentStep, state.responses);
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
      return Object.keys(errors).length === 0;
    },
    
    submitQuestionnaire: async () => {
      if (actions.validateCurrentStep()) {
        try {
          await submitQuestionnaireResponse(questionnaireId, state.responses);
          dispatch({ type: 'MARK_SUBMITTED' });
          return true;
        } catch (error) {
          console.error('Submission failed:', error);
          return false;
        }
      }
      return false;
    },
  }), [state, questionnaireId, debouncedAutoSave]);
  
  return { state, actions };
};
```

#### Media Upload State

```typescript
// hooks/patient/useMediaUpload.ts
interface MediaUploadState {
  uploads: MediaUpload[];
  totalSize: number;
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  errors: Record<string, string>;
}

const useMediaUpload = () => {
  const [state, setState] = useState<MediaUploadState>(initialState);
  const { queueAction } = useOffline();
  
  const actions = useMemo(() => ({
    addFiles: (files: File[]) => {
      const newUploads = files.map(file => ({
        id: generateId(),
        file,
        status: 'pending' as const,
        progress: 0,
        size: file.size,
      }));
      
      setState(prev => ({
        ...prev,
        uploads: [...prev.uploads, ...newUploads],
        totalSize: prev.totalSize + newUploads.reduce((sum, upload) => sum + upload.size, 0),
      }));
    },
    
    startUpload: async (uploadId: string) => {
      const upload = state.uploads.find(u => u.id === uploadId);
      if (!upload) return;
      
      setState(prev => ({
        ...prev,
        isUploading: true,
        uploads: prev.uploads.map(u => 
          u.id === uploadId ? { ...u, status: 'uploading' } : u
        ),
      }));
      
      try {
        if (navigator.onLine) {
          await uploadMediaFile(upload.file, (progress) => {
            setState(prev => ({
              ...prev,
              uploadProgress: { ...prev.uploadProgress, [uploadId]: progress },
            }));
          });
          
          setState(prev => ({
            ...prev,
            uploads: prev.uploads.map(u => 
              u.id === uploadId ? { ...u, status: 'completed' } : u
            ),
          }));
        } else {
          // Queue for offline upload
          queueAction({
            type: 'UPLOAD_MEDIA_FILE',
            payload: { file: upload.file, uploadId },
            timestamp: new Date(),
          });
          
          setState(prev => ({
            ...prev,
            uploads: prev.uploads.map(u => 
              u.id === uploadId ? { ...u, status: 'queued' } : u
            ),
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          uploads: prev.uploads.map(u => 
            u.id === uploadId ? { ...u, status: 'error' } : u
          ),
          errors: { ...prev.errors, [uploadId]: error.message },
        }));
      } finally {
        setState(prev => ({ ...prev, isUploading: false }));
      }
    },
    
    removeUpload: (uploadId: string) => {
      setState(prev => {
        const upload = prev.uploads.find(u => u.id === uploadId);
        return {
          ...prev,
          uploads: prev.uploads.filter(u => u.id !== uploadId),
          totalSize: prev.totalSize - (upload?.size || 0),
        };
      });
    },
    
    retryUpload: (uploadId: string) => {
      setState(prev => ({
        ...prev,
        uploads: prev.uploads.map(u => 
          u.id === uploadId ? { ...u, status: 'pending' } : u
        ),
        errors: { ...prev.errors, [uploadId]: undefined },
      }));
      actions.startUpload(uploadId);
    },
  }), [state, queueAction]);
  
  return { state, actions };
};
```

## Offline State Management

### Offline Action Queue

```typescript
// lib/offline/actionQueue.ts
interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

class OfflineActionQueue {
  private queue: OfflineAction[] = [];
  private isProcessing = false;
  
  add(action: Omit<OfflineAction, 'id' | 'retryCount'>) {
    const queuedAction: OfflineAction = {
      ...action,
      id: generateId(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3,
    };
    
    this.queue.push(queuedAction);
    this.persistQueue();
    
    if (navigator.onLine && !this.isProcessing) {
      this.processQueue();
    }
  }
  
  async processQueue() {
    if (this.isProcessing || !navigator.onLine) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0 && navigator.onLine) {
      const action = this.queue[0];
      
      try {
        await this.executeAction(action);
        this.queue.shift();
      } catch (error) {
        action.retryCount++;
        
        if (action.retryCount >= action.maxRetries) {
          console.error(`Action ${action.type} failed after ${action.maxRetries} retries:`, error);
          this.queue.shift(); // Remove failed action
        }
        
        break; // Stop processing on error
      }
    }
    
    this.persistQueue();
    this.isProcessing = false;
  }
  
  private async executeAction(action: OfflineAction) {
    switch (action.type) {
      case 'SAVE_QUESTIONNAIRE_RESPONSE':
        await saveQuestionnaireResponse(action.payload.questionnaireId, action.payload.responses);
        break;
      case 'UPLOAD_MEDIA_FILE':
        await uploadMediaFile(action.payload.file);
        break;
      case 'UPDATE_PATIENT_PROFILE':
        await updatePatientProfile(action.payload.updates);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
  
  private persistQueue() {
    localStorage.setItem('offlineActionQueue', JSON.stringify(this.queue));
  }
  
  private loadQueue() {
    const stored = localStorage.getItem('offlineActionQueue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }
  }
}
```

## Real-time Updates

### WebSocket Integration

```typescript
// lib/websocket/client.ts
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  connect(userId: string, userType: 'physician' | 'patient') {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?userId=${userId}&userType=${userType}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'QUESTIONNAIRE_RESPONSE_UPDATED':
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.questionnaires.responses(message.payload.questionnaireId)
        });
        break;
      case 'PATIENT_STATUS_CHANGED':
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.patients.byId(message.payload.patientId)
        });
        break;
      case 'NEW_QUESTIONNAIRE_ASSIGNED':
        queryClient.invalidateQueries({
          queryKey: queryKeys.patient.questionnaires.assigned
        });
        break;
    }
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectInterval);
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

## Performance Optimization

### Query Optimization Strategies

1. **Selective Invalidation**: Only invalidate specific queries when data changes
2. **Background Refetching**: Update stale data in the background
3. **Optimistic Updates**: Immediately update UI with expected results
4. **Query Batching**: Combine multiple queries into single requests
5. **Infinite Queries**: Efficient pagination for large datasets

### State Persistence

```typescript
// lib/persistence/statePersistence.ts
interface PersistedState {
  auth: Partial<AuthState>;
  theme: ThemeState;
  questionnaire: Record<string, QuestionnaireResponseState>;
  media: MediaUploadState;
}

class StatePersistence {
  private storage: Storage;
  
  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }
  
  save<K extends keyof PersistedState>(key: K, state: PersistedState[K]) {
    try {
      this.storage.setItem(`clinicalTrial_${key}`, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to persist state for ${key}:`, error);
    }
  }
  
  load<K extends keyof PersistedState>(key: K): PersistedState[K] | null {
    try {
      const stored = this.storage.getItem(`clinicalTrial_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`Failed to load persisted state for ${key}:`, error);
      return null;
    }
  }
  
  clear(key?: keyof PersistedState) {
    if (key) {
      this.storage.removeItem(`clinicalTrial_${key}`);
    } else {
      // Clear all clinical trial related data
      Object.keys(this.storage).forEach(storageKey => {
        if (storageKey.startsWith('clinicalTrial_')) {
          this.storage.removeItem(storageKey);
        }
      });
    }
  }
}
```

## Testing State Management

### Testing Contexts

```typescript
// __tests__/utils/renderWithProviders.tsx
const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState = {},
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {}
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialState={preloadedState.auth}>
          <ThemeProvider initialState={preloadedState.theme}>
            <OfflineProvider>
              {children}
            </OfflineProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
  
  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};
```

### Testing Custom Hooks

```typescript
// __tests__/hooks/useQuestionnaireBuilder.test.ts
describe('useQuestionnaireBuilder', () => {
  it('should add question correctly', async () => {
    const { result } = renderHook(() => useQuestionnaireBuilder(), {
      wrapper: createWrapper(),
    });
    
    const newQuestion: Question = {
      id: 'q1',
      type: 'text',
      title: 'Test Question',
      required: true,
    };
    
    act(() => {
      result.current.actions.addQuestion(newQuestion);
    });
    
    expect(result.current.state.questionnaire.questions).toContain(newQuestion);
    expect(result.current.state.unsavedChanges).toBe(true);
  });
  
  it('should auto-save after changes', async () => {
    const mockSave = jest.fn();
    jest.mocked(saveQuestionnaireDraft).mockImplementation(mockSave);
    
    const { result } = renderHook(() => useQuestionnaireBuilder(), {
      wrapper: createWrapper(),
    });
    
    act(() => {
      result.current.actions.addQuestion(mockQuestion);
    });
    
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        questions: expect.arrayContaining([mockQuestion]),
      }));
    }, { timeout: 3000 });
  });
});
```

## Integration with Next.js 14

### App Router Integration

```typescript
// app/providers.tsx
'use client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));
  
  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <OfflineProvider>
                {children}
                <ReactQueryDevtools initialIsOpen={false} />
              </OfflineProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </Hydrate>
    </QueryClientProvider>
  );
}
```

### Server Components and State

```typescript
// app/admin/dashboard/page.tsx
import { getDashboardData } from '@/lib/api/admin';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const initialData = await getDashboardData();
  
  return (
    <DashboardClient 
      initialData={initialData}
      prefetch={{
        patients: queryKeys.admin.patients.all,
        questionnaires: queryKeys.admin.questionnaires.all,
      }}
    />
  );
}
```

This state management architecture provides a robust, scalable, and performant foundation for the dual-portal clinical trial platform, ensuring smooth user experiences across both physician admin and patient portals while maintaining data consistency and offline capabilities.