import Cookies from 'js-cookie'
import { APIResponse, APIError } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface RequestConfig extends RequestInit {
  timeout?: number
}

class APIClient {
  private baseURL: string
  private defaultTimeout: number = 30000 // 30 seconds

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<APIResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      headers = {},
      ...restConfig
    } = config

    // Get access token from cookies
    const accessToken = Cookies.get('access_token')

    // Prepare headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    }

    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...restConfig,
        headers: requestHeaders,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Parse response
      let responseData: any
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      if (!response.ok) {
        const error: APIError = {
          code: responseData.code || 'API_ERROR',
          message: responseData.message || responseData.error || 'An error occurred',
          details: responseData.details,
          field: responseData.field,
          timestamp: new Date().toISOString(),
        }

        // Handle specific error cases
        if (response.status === 401) {
          // Unauthorized - token expired or invalid
          this.handleUnauthorized()
        } else if (response.status === 403) {
          // Forbidden - insufficient permissions
          error.message = 'You do not have permission to perform this action'
        } else if (response.status === 429) {
          // Too many requests
          error.message = 'Too many requests. Please try again later.'
        } else if (response.status >= 500) {
          // Server errors
          error.message = 'Server error. Please try again later.'
        }

        const apiResponse: APIResponse<T> = {
          success: false,
          error,
        }

        throw new APIClientError(apiResponse, response.status)
      }

      // Success response
      const apiResponse: APIResponse<T> = {
        success: true,
        data: responseData.data || responseData,
        meta: responseData.meta,
      }

      return apiResponse

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof APIClientError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new APIClientError({
            success: false,
            error: {
              code: 'TIMEOUT_ERROR',
              message: 'Request timed out',
              timestamp: new Date().toISOString(),
            },
          }, 408)
        }

        throw new APIClientError({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection.',
            timestamp: new Date().toISOString(),
          },
        }, 0)
      }

      throw error
    }
  }

  private handleUnauthorized() {
    // Clear tokens
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    
    // Redirect to login if not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
      window.location.href = '/auth/login'
    }
  }

  // HTTP Methods
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  // File upload method
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig,
    onProgress?: (progress: number) => void
  ): Promise<APIResponse<T>> {
    const accessToken = Cookies.get('access_token')

    const headers: HeadersInit = {}
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    try {
      // Use XMLHttpRequest for upload progress
      if (onProgress) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              onProgress(progress)
            }
          })

          xhr.addEventListener('load', () => {
            try {
              const responseData = JSON.parse(xhr.responseText)
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({
                  success: true,
                  data: responseData.data || responseData,
                  meta: responseData.meta,
                })
              } else {
                reject(new APIClientError({
                  success: false,
                  error: {
                    code: responseData.code || 'UPLOAD_ERROR',
                    message: responseData.message || 'Upload failed',
                    timestamp: new Date().toISOString(),
                  },
                }, xhr.status))
              }
            } catch (error) {
              reject(new APIClientError({
                success: false,
                error: {
                  code: 'PARSE_ERROR',
                  message: 'Failed to parse response',
                  timestamp: new Date().toISOString(),
                },
              }, xhr.status))
            }
          })

          xhr.addEventListener('error', () => {
            reject(new APIClientError({
              success: false,
              error: {
                code: 'UPLOAD_ERROR',
                message: 'Upload failed',
                timestamp: new Date().toISOString(),
              },
            }, xhr.status))
          })

          xhr.open('POST', `${this.baseURL}${endpoint}`)
          
          // Set headers
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, String(value))
          })

          xhr.send(formData)
        })
      }

      // Fallback to fetch for simple uploads
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        ...config,
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new APIClientError({
          success: false,
          error: {
            code: responseData.code || 'UPLOAD_ERROR',
            message: responseData.message || 'Upload failed',
            timestamp: new Date().toISOString(),
          },
        }, response.status)
      }

      return {
        success: true,
        data: responseData.data || responseData,
        meta: responseData.meta,
      }

    } catch (error) {
      if (error instanceof APIClientError) {
        throw error
      }

      throw new APIClientError({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Upload failed',
          timestamp: new Date().toISOString(),
        },
      }, 0)
    }
  }

  // Download method
  async download(endpoint: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Extract filename from response headers or use provided filename
      let downloadFilename = filename
      if (!downloadFilename) {
        const disposition = response.headers.get('content-disposition')
        if (disposition) {
          const filenameMatch = disposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            downloadFilename = filenameMatch[1]
          }
        }
      }

      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFilename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }
}

// Custom error class for API errors
export class APIClientError extends Error {
  public response: APIResponse<any>
  public status: number

  constructor(response: APIResponse<any>, status: number) {
    super(response.error?.message || 'API Error')
    this.name = 'APIClientError'
    this.response = response
    this.status = status
  }
}

// Create and export singleton instance
export const apiClient = new APIClient(API_BASE_URL)

// Convenience function to check if error is APIClientError
export function isAPIError(error: any): error is APIClientError {
  return error instanceof APIClientError
}