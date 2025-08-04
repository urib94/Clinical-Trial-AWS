# Custom Hooks - Clinical Trial Platform

## Overview

This document outlines the custom React hooks for the Clinical Trial platform, providing reusable stateful logic for both physician admin and patient portals. All hooks follow React best practices, provide proper TypeScript support, and include comprehensive error handling.

## Hook Categories

### Authentication Hooks (`/auth/`)
Manage user authentication, session state, and security features.

### Data Hooks (`/data/`)
Handle API calls, caching, and server state synchronization.

### UI Hooks (`/ui/`)
Manage user interface state and interactions.

### Form Hooks (`/forms/`)
Handle form state, validation, and submission.

### PWA Hooks (`/pwa/`)
Manage Progressive Web App features and offline functionality.

### Questionnaire Hooks (`/questionnaires/`)
Specialized hooks for questionnaire building and response management.

## Authentication Hooks

### useAuth

Manages global authentication state and provides auth actions.

```typescript
// hooks/auth/useAuth.ts
import { useContext, useCallback } from 'react';
import { AuthContext } from '@/lib/contexts/AuthContext';

export interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  mfaRequired: boolean;
  sessionExpiry: Date | null;
  
  // Actions
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkPermission: (resource: string, action: string) => boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { state, actions } = context;
  
  const checkPermission = useCallback((resource: string, action: string) => {
    return state.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
  }, [state.permissions]);
  
  return {
    ...state,
    ...actions,
    checkPermission,
  };
};

// Usage Example:
function AdminDashboard() {
  const { user, isAuthenticated, checkPermission, signOut } = useAuth();
  
  const canManagePatients = checkPermission('patients', 'manage');
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      {canManagePatients && <PatientManagementPanel />}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### useSignIn

Handles user sign-in with validation and error handling.

```typescript
// hooks/auth/useSignIn.ts
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { validateLoginCredentials } from '@/lib/validation/auth';

export interface UseSignInReturn {
  signIn: (credentials: LoginCredentials) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useSignIn = (): UseSignInReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn: authSignIn } = useAuth();
  
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate credentials
      const validation = validateLoginCredentials(credentials);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      await authSignIn(credentials);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authSignIn]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    signIn,
    isLoading,
    error,
    clearError,
  };
};

// Usage Example:
function LoginForm() {
  const { signIn, isLoading, error, clearError } = useSignIn();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signIn(credentials);
    if (success) {
      // Redirect to dashboard
      router.push('/admin');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert type="error" onDismiss={clearError}>
          {error}
        </Alert>
      )}
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <FormField.Input
          type="email"
          value={credentials.email}
          onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        />
      </FormField>
      <Button type="submit" loading={isLoading}>
        Sign In
      </Button>
    </form>
  );
}
```

### useTwoFactor

Manages two-factor authentication setup and verification.

```typescript
// hooks/auth/useTwoFactor.ts
import { useState, useCallback } from 'react';
import { setupMFA, verifyMFA, generateBackupCodes } from '@/lib/api/auth';

export interface UseTwoFactorReturn {
  // Setup state
  isSettingUp: boolean;
  setupMethod: MFAMethod | null;
  qrCode: string | null;
  backupCodes: string[] | null;
  
  // Verification state
  isVerifying: boolean;
  verificationError: string | null;
  
  // Actions
  startSetup: (method: MFAMethod) => Promise<MFASetup>;
  verifySetup: (code: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<boolean>;
  generateNewBackupCodes: () => Promise<string[]>;
  cancelSetup: () => void;
}

export const useTwoFactor = (): UseTwoFactorReturn => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupMethod, setSetupMethod] = useState<MFAMethod | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const startSetup = useCallback(async (method: MFAMethod) => {
    setIsSettingUp(true);
    setSetupMethod(method);
    setVerificationError(null);
    
    try {
      const setup = await setupMFA(method);
      setQrCode(setup.qrCode || null);
      setBackupCodes(setup.backupCodes || null);
      return setup;
    } catch (error) {
      setVerificationError('Failed to start MFA setup');
      throw error;
    } finally {
      setIsSettingUp(false);
    }
  }, []);
  
  const verifySetup = useCallback(async (code: string) => {
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const result = await verifyMFA(code, 'setup');
      if (result.success) {
        setSetupMethod(null);
        setQrCode(null);
        return true;
      } else {
        setVerificationError('Invalid verification code');
        return false;
      }
    } catch (error) {
      setVerificationError('Verification failed');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);
  
  const verifyCode = useCallback(async (code: string) => {
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const result = await verifyMFA(code, 'login');
      if (!result.success) {
        setVerificationError('Invalid verification code');
      }
      return result.success;
    } catch (error) {
      setVerificationError('Verification failed');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);
  
  const generateNewBackupCodes = useCallback(async () => {
    const codes = await generateBackupCodes();
    setBackupCodes(codes);
    return codes;
  }, []);
  
  const cancelSetup = useCallback(() => {
    setSetupMethod(null);
    setQrCode(null);
    setBackupCodes(null);
    setVerificationError(null);
  }, []);
  
  return {
    isSettingUp,
    setupMethod,
    qrCode,
    backupCodes,
    isVerifying,
    verificationError,
    startSetup,
    verifySetup,
    verifyCode,
    generateNewBackupCodes,
    cancelSetup,
  };
};
```

## Data Hooks

### useQuery

Enhanced wrapper around TanStack Query with error handling and TypeScript support.

```typescript
// hooks/data/useQuery.ts
import { useQuery as useTanStackQuery, UseQueryOptions } from '@tanstack/react-query';
import { APIResponse } from '@/types';

export interface UseQueryReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isStale: boolean;
}

export const useQuery = <T>(
  queryKey: readonly string[],
  queryFn: () => Promise<APIResponse<T>>,
  options?: Omit<UseQueryOptions<APIResponse<T>, Error, T>, 'queryKey' | 'queryFn'>
): UseQueryReturn<T> => {
  const query = useTanStackQuery({
    queryKey,
    queryFn,
    select: (response) => {
      if (!response.success) {
        throw new Error(response.error?.message || 'Query failed');
      }
      return response.data!;
    },
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.message.includes('4')) return false;
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isStale: query.isStale,
  };
};

// Usage Example:
function PatientList() {
  const { data: patients, isLoading, error, refetch } = useQuery(
    ['patients'],
    () => fetchPatients(),
    {
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
  
  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return (
    <div>
      {patients?.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}
```

### useMutation

Enhanced wrapper around TanStack Query mutations with optimistic updates.

```typescript
// hooks/data/useMutation.ts
import { useMutation as useTanStackMutation, useQueryClient } from '@tanstack/react-query';
import { APIResponse } from '@/types';

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  invalidateQueries?: string[][];
  optimisticUpdate?: {
    queryKey: string[];
    updater: (oldData: any, variables: TVariables) => any;
  };
}

export const useMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<APIResponse<TData>>,
  options?: UseMutationOptions<TData, TVariables>
) => {
  const queryClient = useQueryClient();
  
  return useTanStackMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      if (!response.success) {
        throw new Error(response.error?.message || 'Mutation failed');
      }
      return response.data!;
    },
    onMutate: async (variables) => {
      // Optimistic update
      if (options?.optimisticUpdate) {
        const { queryKey, updater } = options.optimisticUpdate;
        await queryClient.cancelQueries({ queryKey });
        
        const previousData = queryClient.getQueryData(queryKey);
        queryClient.setQueryData(queryKey, (old: any) => updater(old, variables));
        
        return { previousData };
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (options?.optimisticUpdate && context?.previousData) {
        queryClient.setQueryData(options.optimisticUpdate.queryKey, context.previousData);
      }
      options?.onError?.(error, variables);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options?.onSuccess?.(data, variables);
    },
  });
};

// Usage Example:
function PatientCard({ patient }: { patient: Patient }) {
  const updatePatientMutation = useMutation(
    (updates: Partial<Patient>) => updatePatient(patient.id, updates),
    {
      onSuccess: () => {
        toast.success('Patient updated successfully');
      },
      onError: (error) => {
        toast.error(`Failed to update patient: ${error.message}`);
      },
      invalidateQueries: [['patients'], ['patients', patient.id]],
      optimisticUpdate: {
        queryKey: ['patients', patient.id],
        updater: (oldData: Patient, variables) => ({ ...oldData, ...variables }),
      },
    }
  );
  
  const handleStatusChange = (status: PatientStatus) => {
    updatePatientMutation.mutate({ status });
  };
  
  return (
    <Card>
      <h3>{patient.firstName} {patient.lastName}</h3>
      <StatusSelect 
        value={patient.status}
        onChange={handleStatusChange}
        disabled={updatePatientMutation.isLoading}
      />
      {updatePatientMutation.isLoading && <Spinner />}
    </Card>
  );
}
```

## UI Hooks

### useModal

Manages modal state and focus management.

```typescript
// hooks/ui/useModal.ts
import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  modalRef: React.RefObject<HTMLDivElement>;
  initialFocusRef: React.RefObject<HTMLElement>;
}

export const useModal = (initialOpen = false): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  const open = useCallback(() => {
    // Store current focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    // Restore focus to previous element
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, []);
  
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        close();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus the initial focus element
      if (initialFocusRef.current) {
        initialFocusRef.current.focus();
      }
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    modalRef,
    initialFocusRef,
  };
};

// Usage Example:
function QuestionnaireSettings({ questionnaire }: { questionnaire: Questionnaire }) {
  const { isOpen, open, close, modalRef, initialFocusRef } = useModal();
  
  return (
    <>
      <Button onClick={open}>Settings</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={close}
        ref={modalRef}
        title="Questionnaire Settings"
      >
        <form onSubmit={handleSubmit}>
          <FormField>
            <FormField.Label>Title</FormField.Label>
            <FormField.Input
              ref={initialFocusRef}
              defaultValue={questionnaire.title}
              name="title"
            />
          </FormField>
          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}
```

### useToast

Manages toast notifications with auto-dismiss and action support.

```typescript
// hooks/ui/useToast.ts
import { useContext, useCallback } from 'react';
import { NotificationContext } from '@/lib/contexts/NotificationContext';

export interface ToastOptions {
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface UseToastReturn {
  toast: {
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
  };
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const useToast = (): UseToastReturn => {
  const { addNotification, removeNotification, clearAll } = useContext(NotificationContext);
  
  const createToast = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    options?: ToastOptions
  ) => {
    addNotification({
      type,
      title: message,
      duration: options?.duration ?? (type === 'error' ? 0 : 5000),
      persistent: options?.persistent ?? false,
      actions: options?.actions,
    });
  }, [addNotification]);
  
  const toast = {
    success: useCallback((message: string, options?: ToastOptions) => {
      createToast('success', message, options);
    }, [createToast]),
    
    error: useCallback((message: string, options?: ToastOptions) => {
      createToast('error', message, { persistent: true, ...options });
    }, [createToast]),
    
    warning: useCallback((message: string, options?: ToastOptions) => {
      createToast('warning', message, options);
    }, [createToast]),
    
    info: useCallback((message: string, options?: ToastOptions) => {
      createToast('info', message, options);
    }, [createToast]),
  };
  
  return {
    toast,
    dismiss: removeNotification,
    dismissAll: clearAll,
  };
};

// Usage Example:
function PatientInvitation() {
  const { toast } = useToast();
  const invitePatientMutation = useMutation(invitePatient, {
    onSuccess: () => {
      toast.success('Patient invitation sent successfully');
    },
    onError: (error) => {
      toast.error(`Failed to send invitation: ${error.message}`, {
        actions: [
          {
            label: 'Retry',
            action: () => invitePatientMutation.mutate(patientData),
            variant: 'primary',
          },
        ],
      });
    },
  });
  
  return (
    <Button 
      onClick={() => invitePatientMutation.mutate(patientData)}
      loading={invitePatientMutation.isLoading}
    >
      Send Invitation
    </Button>
  );
}
```

## Questionnaire Hooks

### useQuestionnaireBuilder

Manages questionnaire builder state with drag-and-drop and auto-save.

```typescript
// hooks/questionnaires/useQuestionnaireBuilder.ts
import { useReducer, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@/hooks/data';
import { debounce } from '@/lib/utils/debounce';

interface QuestionnaireBuilderState {
  questionnaire: QuestionnaireBuilder;
  activeQuestionId: string | null;
  draggedQuestion: Question | null;
  isPreviewMode: boolean;
  unsavedChanges: boolean;
  validationErrors: ValidationError[];
  history: QuestionnaireBuilder[];
  historyIndex: number;
}

type QuestionnaireBuilderAction =
  | { type: 'ADD_QUESTION'; payload: { question: Question; position?: number } }
  | { type: 'UPDATE_QUESTION'; payload: { questionId: string; updates: Partial<Question> } }
  | { type: 'DELETE_QUESTION'; payload: { questionId: string } }
  | { type: 'REORDER_QUESTIONS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_ACTIVE_QUESTION'; payload: { questionId: string | null } }
  | { type: 'SET_DRAGGED_QUESTION'; payload: { question: Question | null } }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'MARK_SAVED' }
  | { type: 'SET_VALIDATION_ERRORS'; payload: { errors: ValidationError[] } }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const questionnaireBuilderReducer = (
  state: QuestionnaireBuilderState,
  action: QuestionnaireBuilderAction
): QuestionnaireBuilderState => {
  switch (action.type) {
    case 'ADD_QUESTION': {
      const { question, position } = action.payload;
      const questions = [...state.questionnaire.questions];
      
      if (position !== undefined) {
        questions.splice(position, 0, question);
      } else {
        questions.push(question);
      }
      
      const newQuestionnaire = {
        ...state.questionnaire,
        questions: questions.map((q, index) => ({ ...q, order: index })),
      };
      
      return {
        ...state,
        questionnaire: newQuestionnaire,
        unsavedChanges: true,
        history: [...state.history.slice(0, state.historyIndex + 1), newQuestionnaire],
        historyIndex: state.historyIndex + 1,
      };
    }
    
    case 'UPDATE_QUESTION': {
      const { questionId, updates } = action.payload;
      const questions = state.questionnaire.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      );
      
      const newQuestionnaire = {
        ...state.questionnaire,
        questions,
      };
      
      return {
        ...state,
        questionnaire: newQuestionnaire,
        unsavedChanges: true,
        history: [...state.history.slice(0, state.historyIndex + 1), newQuestionnaire],
        historyIndex: state.historyIndex + 1,
      };
    }
    
    case 'DELETE_QUESTION': {
      const { questionId } = action.payload;
      const questions = state.questionnaire.questions
        .filter(q => q.id !== questionId)
        .map((q, index) => ({ ...q, order: index }));
      
      const newQuestionnaire = {
        ...state.questionnaire,
        questions,
      };
      
      return {
        ...state,
        questionnaire: newQuestionnaire,
        activeQuestionId: state.activeQuestionId === questionId ? null : state.activeQuestionId,
        unsavedChanges: true,
        history: [...state.history.slice(0, state.historyIndex + 1), newQuestionnaire],
        historyIndex: state.historyIndex + 1,
      };
    }
    
    case 'REORDER_QUESTIONS': {
      const { fromIndex, toIndex } = action.payload;
      const questions = [...state.questionnaire.questions];
      const [movedQuestion] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, movedQuestion);
      
      const newQuestionnaire = {
        ...state.questionnaire,
        questions: questions.map((q, index) => ({ ...q, order: index })),
      };
      
      return {
        ...state,
        questionnaire: newQuestionnaire,
        unsavedChanges: true,
        history: [...state.history.slice(0, state.historyIndex + 1), newQuestionnaire],
        historyIndex: state.historyIndex + 1,
      };
    }
    
    case 'UNDO': {
      if (state.historyIndex > 0) {
        return {
          ...state,
          questionnaire: state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
          unsavedChanges: true,
        };
      }
      return state;
    }
    
    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        return {
          ...state,
          questionnaire: state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
          unsavedChanges: true,
        };
      }
      return state;
    }
    
    default:
      return state;
  }
};

export const useQuestionnaireBuilder = (questionnaireId?: string) => {
  // Load existing questionnaire
  const { data: existingQuestionnaire } = useQuery(
    ['questionnaires', questionnaireId],
    () => fetchQuestionnaire(questionnaireId!),
    { enabled: !!questionnaireId }
  );
  
  const initialState: QuestionnaireBuilderState = {
    questionnaire: existingQuestionnaire || createEmptyQuestionnaire(),
    activeQuestionId: null,
    draggedQuestion: null,
    isPreviewMode: false,
    unsavedChanges: false,
    validationErrors: [],
    history: [existingQuestionnaire || createEmptyQuestionnaire()],
    historyIndex: 0,
  };
  
  const [state, dispatch] = useReducer(questionnaireBuilderReducer, initialState);
  
  // Auto-save mutation
  const autoSaveMutation = useMutation(
    (questionnaire: QuestionnaireBuilder) => saveQuestionnaireDraft(questionnaire),
    {
      onSuccess: () => {
        dispatch({ type: 'MARK_SAVED' });
      },
    }
  );
  
  // Debounced auto-save
  const debouncedAutoSave = useMemo(
    () => debounce(async (questionnaire: QuestionnaireBuilder) => {
      autoSaveMutation.mutate(questionnaire);
    }, 2000),
    [autoSaveMutation]
  );
  
  // Actions
  const actions = useMemo(() => ({
    addQuestion: (question: Question, position?: number) => {
      dispatch({ type: 'ADD_QUESTION', payload: { question, position } });
      debouncedAutoSave(state.questionnaire);
    },
    
    updateQuestion: (questionId: string, updates: Partial<Question>) => {
      dispatch({ type: 'UPDATE_QUESTION', payload: { questionId, updates } });
      debouncedAutoSave(state.questionnaire);
    },
    
    deleteQuestion: (questionId: string) => {
      dispatch({ type: 'DELETE_QUESTION', payload: { questionId } });
      debouncedAutoSave(state.questionnaire);
    },
    
    reorderQuestions: (fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER_QUESTIONS', payload: { fromIndex, toIndex } });
      debouncedAutoSave(state.questionnaire);
    },
    
    setActiveQuestion: (questionId: string | null) => {
      dispatch({ type: 'SET_ACTIVE_QUESTION', payload: { questionId } });
    },
    
    setDraggedQuestion: (question: Question | null) => {
      dispatch({ type: 'SET_DRAGGED_QUESTION', payload: { question } });
    },
    
    togglePreview: () => {
      dispatch({ type: 'TOGGLE_PREVIEW' });
    },
    
    undo: () => {
      dispatch({ type: 'UNDO' });
    },
    
    redo: () => {
      dispatch({ type: 'REDO' });
    },
    
    validateQuestionnaire: () => {
      const errors = validateQuestionnaireStructure(state.questionnaire);
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: { errors } });
      return errors.length === 0;
    },
  }), [state.questionnaire, debouncedAutoSave]);
  
  return { state, actions };
};

// Usage Example:
function QuestionnaireBuilder({ questionnaireId }: { questionnaireId?: string }) {
  const { state, actions } = useQuestionnaireBuilder(questionnaireId);
  
  const handleDrop = useCallback((question: Question, position: number) => {
    if (state.draggedQuestion) {
      actions.addQuestion(state.draggedQuestion, position);
      actions.setDraggedQuestion(null);
    }
  }, [state.draggedQuestion, actions]);
  
  return (
    <div className="questionnaire-builder">
      <div className="toolbar">
        <Button onClick={actions.undo} disabled={state.historyIndex === 0}>
          Undo
        </Button>
        <Button onClick={actions.redo} disabled={state.historyIndex === state.history.length - 1}>
          Redo
        </Button>
        <Button onClick={actions.togglePreview}>
          {state.isPreviewMode ? 'Edit' : 'Preview'}
        </Button>
      </div>
      
      {state.isPreviewMode ? (
        <QuestionnairePreview questionnaire={state.questionnaire} />
      ) : (
        <div className="builder-workspace">
          <QuestionPalette onDragStart={actions.setDraggedQuestion} />
          <QuestionList
            questions={state.questionnaire.questions}
            activeQuestionId={state.activeQuestionId}
            onQuestionClick={actions.setActiveQuestion}
            onQuestionUpdate={actions.updateQuestion}
            onQuestionDelete={actions.deleteQuestion}
            onQuestionReorder={actions.reorderQuestions}
            onDrop={handleDrop}
          />
          {state.activeQuestionId && (
            <QuestionEditor
              question={state.questionnaire.questions.find(q => q.id === state.activeQuestionId)!}
              onUpdate={(updates) => actions.updateQuestion(state.activeQuestionId!, updates)}
            />
          )}
        </div>
      )}
      
      {state.unsavedChanges && (
        <div className="save-indicator">
          <Spinner size="sm" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}
```

## PWA Hooks

### useOffline

Manages offline state and queued actions for PWA functionality.

```typescript
// hooks/pwa/useOffline.ts
import { useContext, useCallback } from 'react';
import { OfflineContext } from '@/lib/contexts/OfflineContext';

export interface UseOfflineReturn {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  syncStatus: 'idle' | 'syncing' | 'error';
  queueAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  syncPendingActions: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

export const useOffline = (): UseOfflineReturn => {
  const context = useContext(OfflineContext);
  
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  
  const { state, actions } = context;
  
  const queueAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    actions.queueAction({
      ...action,
      id: generateId(),
      timestamp: new Date(),
      retryCount: 0,
    });
  }, [actions]);
  
  return {
    ...state,
    ...actions,
    queueAction,
  };
};

// Usage Example:
function QuestionnaireResponse() {
  const { isOnline, queueAction } = useOffline();
  const [responses, setResponses] = useState({});
  
  const saveResponse = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    
    if (isOnline) {
      // Save immediately if online
      saveQuestionnaireResponse(questionnaireId, { [questionId]: value });
    } else {
      // Queue for later if offline
      queueAction({
        type: 'SAVE_QUESTIONNAIRE_RESPONSE',
        payload: { questionnaireId, responses: { [questionId]: value } },
        maxRetries: 3,
      });
    }
  }, [isOnline, queueAction, questionnaireId]);
  
  return (
    <div>
      {!isOnline && (
        <Alert type="warning">
          You're offline. Your responses will be saved when you reconnect.
        </Alert>
      )}
      
      <QuestionnaireForm
        onResponseChange={saveResponse}
        responses={responses}
      />
    </div>
  );
}
```

## Testing Custom Hooks

### Hook Testing Utilities

```typescript
// __tests__/utils/hookTestUtils.tsx
import { renderHook, RenderHookOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { OfflineProvider } from '@/lib/contexts/OfflineProvider';

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const createHookWrapper = (queryClient = createTestQueryClient()) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineProvider>
          {children}
        </OfflineProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>
) => {
  return renderHook(hook, {
    wrapper: createHookWrapper(),
    ...options,
  });
};
```

### Example Hook Tests

```typescript
// __tests__/hooks/useAuth.test.ts
import { act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/auth/useAuth';
import { renderHookWithProviders } from '../utils/hookTestUtils';

describe('useAuth', () => {
  it('should provide authentication state', () => {
    const { result } = renderHookWithProviders(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.permissions).toEqual([]);
  });
  
  it('should handle sign in', async () => {
    const { result } = renderHookWithProviders(() => useAuth());
    
    const credentials = { email: 'test@example.com', password: 'password' };
    
    await act(async () => {
      await result.current.signIn(credentials);
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
    });
  });
  
  it('should check permissions correctly', () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: [
        { resource: 'patients', action: 'manage' },
        { resource: 'questionnaires', action: 'create' },
      ],
    };
    
    const { result } = renderHookWithProviders(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialState={{ user: mockUser, isAuthenticated: true }}>
          {children}
        </AuthProvider>
      ),
    });
    
    expect(result.current.checkPermission('patients', 'manage')).toBe(true);
    expect(result.current.checkPermission('patients', 'delete')).toBe(false);
  });
});
```

This comprehensive custom hooks documentation provides a solid foundation for building reusable, well-tested stateful logic across both portals of the Clinical Trial platform.