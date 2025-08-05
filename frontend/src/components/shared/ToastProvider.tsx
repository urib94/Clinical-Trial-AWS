'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  actions?: ToastAction[]
}

export interface ToastAction {
  label: string
  action: () => void
  variant?: 'primary' | 'secondary'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  removeAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.persistent ? undefined : 5000),
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-remove toast after duration
    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-600" />
      case 'info':
        return <Info className="h-5 w-5 text-primary-600" />
    }
  }

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-success-400 bg-success-50'
      case 'error':
        return 'border-l-error-400 bg-error-50'
      case 'warning':
        return 'border-l-warning-400 bg-warning-50'
      case 'info':
        return 'border-l-primary-400 bg-primary-50'
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'toast pointer-events-auto overflow-hidden border-l-4 p-4 animate-slide-down',
        getStyles()
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {toast.title}
          </p>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-700">
              {toast.message}
            </p>
          )}
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={cn(
                    'rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
                    action.variant === 'primary'
                      ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <button
            onClick={() => onRemove(toast.id)}
            className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return context.addToast({ type: 'success', title, message, ...options })
  }, [context])

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return context.addToast({ type: 'error', title, message, ...options })
  }, [context])

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return context.addToast({ type: 'warning', title, message, ...options })
  }, [context])

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return context.addToast({ type: 'info', title, message, ...options })
  }, [context])

  return {
    ...context,
    success,
    error,
    warning,
    info,
  }
}