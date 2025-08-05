'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PWAState, OfflineAction, ServiceWorkerMessage } from '@/types';

interface OfflineContextValue extends PWAState {
  // Actions
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeOfflineAction: (actionId: string) => void;
  retryOfflineActions: () => void;
  clearOfflineActions: () => void;
  
  // PWA features
  promptInstall: () => void;
  dismissInstallPrompt: () => void;
  updateApp: () => void;
  
  // Service worker messaging
  sendMessageToSW: (message: ServiceWorkerMessage) => void;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

interface OfflineProviderProps {
  children: React.ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<PWAState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInstallable: false,
    isInstalled: false,
    updateAvailable: false,
    pendingActions: [],
    syncStatus: 'idle',
    lastSync: null,
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Update online status
  const updateOnlineStatus = useCallback(() => {
    const online = navigator.onLine;
    setState(prev => ({ ...prev, isOnline: online }));
    
    if (online && state.pendingActions.length > 0) {
      // Trigger sync when back online
      sendMessageToSW({ type: 'SYNC_NOW' });
    }
  }, [state.pendingActions.length]);

  // Service worker message handler
  const handleSWMessage = useCallback((event: MessageEvent) => {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'SYNC_SUCCESS':
        setState(prev => ({
          ...prev,
          pendingActions: prev.pendingActions.filter(
            action => !action.payload.url || action.payload.url !== payload.url
          ),
          syncStatus: 'idle',
          lastSync: new Date(),
        }));
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
        queryClient.invalidateQueries({ queryKey: ['responses'] });
        break;
        
      case 'SYNC_FAILED':
        setState(prev => ({
          ...prev,
          syncStatus: 'error',
        }));
        break;
        
      case 'MEDIA_SYNC_SUCCESS':
        setState(prev => ({
          ...prev,
          pendingActions: prev.pendingActions.filter(
            action => action.type !== 'media_upload' || action.payload.url !== payload.url
          ),
          lastSync: new Date(),
        }));
        
        queryClient.invalidateQueries({ queryKey: ['media'] });
        break;
        
      case 'CACHE_UPDATED':
        setState(prev => ({ ...prev, updateAvailable: true }));
        break;
        
      case 'ONLINE':
        setState(prev => ({ ...prev, isOnline: true }));
        break;
        
      case 'OFFLINE':
        setState(prev => ({ ...prev, isOnline: false }));
        break;
    }
  }, [queryClient]);

  // Send message to service worker
  const sendMessageToSW = useCallback((message: ServiceWorkerMessage) => {
    if (registration && registration.active) {
      registration.active.postMessage(message);
    }
  }, [registration]);

  // Add offline action
  const addOfflineAction = useCallback((
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0,
    };
    
    setState(prev => ({
      ...prev,
      pendingActions: [...prev.pendingActions, newAction]
    }));
  }, []);

  // Remove offline action
  const removeOfflineAction = useCallback((actionId: string) => {
    setState(prev => ({
      ...prev,
      pendingActions: prev.pendingActions.filter(action => action.id !== actionId)
    }));
  }, []);

  // Retry offline actions
  const retryOfflineActions = useCallback(() => {
    if (!state.isOnline) return;
    
    setState(prev => ({ ...prev, syncStatus: 'syncing' }));
    sendMessageToSW({ type: 'SYNC_NOW' });
  }, [state.isOnline, sendMessageToSW]);

  // Clear all offline actions
  const clearOfflineActions = useCallback(() => {
    setState(prev => ({ ...prev, pendingActions: [] }));
  }, []);

  // PWA install prompt
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
    }
    
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setState(prev => ({ ...prev, isInstallable: false }));
    setDeferredPrompt(null);
  }, []);

  // Update app
  const updateApp = useCallback(() => {
    if (registration && registration.waiting) {
      sendMessageToSW({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration, sendMessageToSW]);

  // Initialize service worker and event listeners
  useEffect(() => {
    // Online/offline event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // PWA install event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
    });
    
    // Service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg);
          
          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', handleSWMessage);
          
          // Check for waiting service worker (update available)
          if (reg.waiting) {
            setState(prev => ({ ...prev, updateAvailable: true }));
          }
          
          // Listen for new service worker
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, updateAvailable: true }));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
    
    // Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setState(prev => ({ ...prev, isInstalled: true }));
    }
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [updateOnlineStatus, handleSWMessage]);

  // Persist pending actions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('clinical-trial-offline-actions', JSON.stringify(state.pendingActions));
      } catch (error) {
        console.error('Failed to persist offline actions:', error);
      }
    }
  }, [state.pendingActions]);

  // Load pending actions from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('clinical-trial-offline-actions');
        if (saved) {
          const actions = JSON.parse(saved);
          setState(prev => ({ ...prev, pendingActions: actions }));
        }
      } catch (error) {
        console.error('Failed to load offline actions:', error);
      }
    }
  }, []);

  const contextValue: OfflineContextValue = {
    ...state,
    addOfflineAction,
    removeOfflineAction,
    retryOfflineActions,
    clearOfflineActions,
    promptInstall,
    dismissInstallPrompt,
    updateApp,
    sendMessageToSW,
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
}