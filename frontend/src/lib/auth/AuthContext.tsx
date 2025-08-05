'use client'

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import Cookies from 'js-cookie'
import { User, AuthenticationState } from '@/types'
import { apiClient } from '@/lib/api/client'

interface AuthContextType extends AuthenticationState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<boolean>
  verifyMFA: (code: string) => Promise<void>
  setupMFA: () => Promise<{ qrCode: string; backupCodes: string[] }>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: any; permissions: any[] } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { tokens: any } }
  | { type: 'REFRESH_TOKEN_FAILURE' }
  | { type: 'MFA_REQUIRED'; payload: { user: User } }
  | { type: 'MFA_SUCCESS'; payload: { tokens: any; permissions: any[] } }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: AuthenticationState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  permissions: [],
  mfaRequired: false,
  sessionExpiry: null,
  tokens: null,
}

function authReducer(state: AuthenticationState, action: AuthAction): AuthenticationState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      }
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        permissions: action.payload.permissions,
        tokens: action.payload.tokens,
        mfaRequired: false,
        sessionExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      }
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        tokens: null,
        permissions: [],
        mfaRequired: false,
      }
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      }
    
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        tokens: action.payload.tokens,
        sessionExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      }
    
    case 'REFRESH_TOKEN_FAILURE':
      return {
        ...initialState,
        isLoading: false,
      }
    
    case 'MFA_REQUIRED':
      return {
        ...state,
        user: action.payload.user,
        mfaRequired: true,
        isLoading: false,
      }
    
    case 'MFA_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        mfaRequired: false,
        tokens: action.payload.tokens,
        permissions: action.payload.permissions,
        sessionExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    
    default:
      return state
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  // Set up token refresh interval
  useEffect(() => {
    if (state.isAuthenticated && state.tokens?.accessToken) {
      const tokenData = jwtDecode(state.tokens.accessToken) as any
      const timeToExpiry = (tokenData.exp * 1000) - Date.now()
      
      // Refresh token 5 minutes before expiry
      const refreshTime = Math.max(timeToExpiry - 5 * 60 * 1000, 60 * 1000)
      
      const refreshInterval = setTimeout(() => {
        refreshToken()
      }, refreshTime)

      return () => clearTimeout(refreshInterval)
    }
  }, [state.tokens?.accessToken])

  const checkExistingSession = async () => {
    try {
      const accessToken = Cookies.get('access_token')
      const refreshTokenValue = Cookies.get('refresh_token')
      
      if (accessToken && refreshTokenValue) {
        // Verify token is still valid
        const tokenData = jwtDecode(accessToken) as any
        const isExpired = tokenData.exp * 1000 < Date.now()
        
        if (isExpired) {
          // Try to refresh the token
          const refreshSuccess = await refreshToken()
          if (!refreshSuccess) {
            dispatch({ type: 'SET_LOADING', payload: false })
            return
          }
        } else {
          // Token is valid, get user profile
          try {
            const response = await apiClient.get('/physicians/profile')
            const user = response.data.profile
            const permissions = user.permissions || []

            dispatch({ 
              type: 'LOGIN_SUCCESS', 
              payload: { 
                user, 
                tokens: { accessToken, refreshToken: refreshTokenValue },
                permissions 
              } 
            })
          } catch (error) {
            console.error('Failed to get user profile:', error)
            logout()
          }
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } catch (error) {
      console.error('Session check failed:', error)
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      dispatch({ type: 'LOGIN_START' })

      const response = await apiClient.post('/auth/login', {
        email,
        password,
        rememberMe,
      })

      const { user, tokens, mfaRequired, permissions } = response.data

      if (mfaRequired) {
        dispatch({ type: 'MFA_REQUIRED', payload: { user } })
        return
      }

      // Store tokens in cookies
      const cookieOptions = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        expires: rememberMe ? 30 : undefined, // 30 days or session
      }

      Cookies.set('access_token', tokens.accessToken, cookieOptions)
      Cookies.set('refresh_token', tokens.refreshToken, cookieOptions)

      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user, tokens, permissions } 
      })

      // Redirect to dashboard
      router.push('/physician/dashboard')

    } catch (error: any) {
      console.error('Login failed:', error)
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message })
      throw error
    }
  }

  const logout = () => {
    // Clear cookies
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    
    // Clear any cached data
    localStorage.clear()
    sessionStorage.clear()

    dispatch({ type: 'LOGOUT' })
    
    // Redirect to login
    router.push('/auth/login')
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = Cookies.get('refresh_token')
      
      if (!refreshTokenValue) {
        dispatch({ type: 'REFRESH_TOKEN_FAILURE' })
        return false
      }

      const response = await apiClient.post('/auth/refresh', {
        refreshToken: refreshTokenValue,
      })

      const { tokens } = response.data

      // Update cookies
      const cookieOptions = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
      }

      Cookies.set('access_token', tokens.accessToken, cookieOptions)
      Cookies.set('refresh_token', tokens.refreshToken, cookieOptions)

      dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: { tokens } })
      
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      dispatch({ type: 'REFRESH_TOKEN_FAILURE' })
      logout()
      return false
    }
  }

  const verifyMFA = async (code: string) => {
    try {
      const response = await apiClient.post('/auth/mfa/verify', {
        code,
        userId: state.user?.id,
      })

      const { tokens, permissions } = response.data

      // Store tokens in cookies
      const cookieOptions = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
      }

      Cookies.set('access_token', tokens.accessToken, cookieOptions)
      Cookies.set('refresh_token', tokens.refreshToken, cookieOptions)

      dispatch({ type: 'MFA_SUCCESS', payload: { tokens, permissions } })

      // Redirect to dashboard
      router.push('/physician/dashboard')

    } catch (error: any) {
      console.error('MFA verification failed:', error)
      throw error
    }
  }

  const setupMFA = async () => {
    try {
      const response = await apiClient.post('/auth/mfa/setup')
      return response.data
    } catch (error: any) {
      console.error('MFA setup failed:', error)
      throw error
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiClient.put('/physicians/profile', data)
      const updatedUser = response.data.profile

      dispatch({ type: 'UPDATE_USER', payload: updatedUser })
      
      return updatedUser
    } catch (error: any) {
      console.error('Profile update failed:', error)
      throw error
    }
  }

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    verifyMFA,
    setupMFA,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}