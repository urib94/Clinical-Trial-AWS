'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthenticationState, User, LoginCredentials, MFASetup } from '@/types';

interface AuthContextValue extends AuthenticationState {
  // Authentication actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // MFA actions
  setupMFA: (method: MFASetup['method']) => Promise<MFASetup>;
  verifyMFA: (code: string) => Promise<void>;
  disableMFA: () => Promise<void>;
  
  // Profile actions
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  
  // Session management
  checkSession: () => Promise<void>;
  extendSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthenticationState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    permissions: [],
    mfaRequired: false,
    sessionExpiry: null,
    tokens: null,
  });

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // TODO: Implement actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: data.user,
        tokens: data.tokens,
        sessionExpiry: new Date(data.sessionExpiry),
        mfaRequired: data.mfaRequired || false,
        permissions: data.permissions || [],
        isLoading: false,
      }));
      
      // Store tokens securely
      if (data.tokens) {
        localStorage.setItem('clinical-trial-tokens', JSON.stringify(data.tokens));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.tokens?.accessToken}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local state
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      mfaRequired: false,
      sessionExpiry: null,
      tokens: null,
    });
    
    // Clear stored tokens
    localStorage.removeItem('clinical-trial-tokens');
  }, [state.tokens?.accessToken]);

  // Register function
  const register = useCallback(async (userData: any) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/auth/register/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: data.user,
        tokens: data.tokens,
        sessionExpiry: new Date(data.sessionExpiry),
        mfaRequired: data.mfaRequired || false,
        permissions: data.permissions || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!state.tokens?.refreshToken) return;
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: state.tokens.refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        tokens: data.tokens,
        sessionExpiry: new Date(data.sessionExpiry),
      }));
      
      localStorage.setItem('clinical-trial-tokens', JSON.stringify(data.tokens));
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
    }
  }, [state.tokens?.refreshToken, logout]);

  // Setup MFA
  const setupMFA = useCallback(async (method: MFASetup['method']): Promise<MFASetup> => {
    const response = await fetch('/api/auth/mfa/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.tokens?.accessToken}`,
      },
      body: JSON.stringify({ method }),
    });
    
    if (!response.ok) {
      throw new Error('MFA setup failed');
    }
    
    return response.json();
  }, [state.tokens?.accessToken]);

  // Verify MFA
  const verifyMFA = useCallback(async (code: string) => {
    const response = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.tokens?.accessToken}`,
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      throw new Error('MFA verification failed');
    }
    
    setState(prev => ({ ...prev, mfaRequired: false }));
  }, [state.tokens?.accessToken]);

  // Disable MFA
  const disableMFA = useCallback(async () => {
    const response = await fetch('/api/auth/mfa/disable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.tokens?.accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('MFA disable failed');
    }
  }, [state.tokens?.accessToken]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    const response = await fetch('/api/patients/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.tokens?.accessToken}`,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Profile update failed');
    }
    
    const updatedUser = await response.json();
    setState(prev => ({ ...prev, user: updatedUser }));
  }, [state.tokens?.accessToken]);

  // Change password
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.tokens?.accessToken}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    
    if (!response.ok) {
      throw new Error('Password change failed');
    }
  }, [state.tokens?.accessToken]);

  // Check session
  const checkSession = useCallback(async () => {
    const tokens = localStorage.getItem('clinical-trial-tokens');
    if (!tokens) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    try {
      const parsedTokens = JSON.parse(tokens);
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${parsedTokens.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Session invalid');
      }
      
      const data = await response.json();
      
      setState({
        isAuthenticated: true,
        user: data.user,
        tokens: parsedTokens,
        sessionExpiry: new Date(data.sessionExpiry),
        mfaRequired: data.mfaRequired || false,
        permissions: data.permissions || [],
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('clinical-trial-tokens');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Extend session
  const extendSession = useCallback(async () => {
    if (!state.tokens?.accessToken) return;
    
    try {
      const response = await fetch('/api/auth/extend-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.tokens.accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          sessionExpiry: new Date(data.sessionExpiry),
        }));
      }
    } catch (error) {
      console.error('Session extension failed:', error);
    }
  }, [state.tokens?.accessToken]);

  // Initialize auth state on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.sessionExpiry || !state.tokens) return;
    
    const refreshTime = state.sessionExpiry.getTime() - Date.now() - (5 * 60 * 1000); // 5 minutes before expiry
    
    if (refreshTime > 0) {
      const timeout = setTimeout(() => {
        refreshToken();
      }, refreshTime);
      
      return () => clearTimeout(timeout);
    }
  }, [state.sessionExpiry, state.tokens, refreshToken]);

  const contextValue: AuthContextValue = {
    ...state,
    login,
    logout,
    register,
    refreshToken,
    setupMFA,
    verifyMFA,
    disableMFA,
    updateProfile,
    changePassword,
    checkSession,
    extendSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}