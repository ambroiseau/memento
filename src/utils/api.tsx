import { API_ENDPOINTS, HEADERS, REQUEST_TIMEOUT } from './constants'

export const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeout)
    
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.')
    }
    throw error
  }
}

export const apiService = {
  getUserProfile: (userId: string) => 
    fetchWithTimeout(API_ENDPOINTS.USERS(userId), { headers: HEADERS }),
    
  getUserFamily: (userId: string) => 
    fetchWithTimeout(API_ENDPOINTS.USER_FAMILY(userId), { headers: HEADERS }),
    
  signUp: (email: string, password: string, name: string) =>
    fetchWithTimeout(API_ENDPOINTS.AUTH_SIGNUP, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ email, password, name })
    }),
    
  createUser: (userData: any) =>
    fetchWithTimeout(API_ENDPOINTS.USERS(''), {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(userData)
    }),
    
  joinFamily: (familyCode: string, userId: string) =>
    fetchWithTimeout(API_ENDPOINTS.FAMILIES_JOIN, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ familyCode, userId })
    }),
    
  createFamily: (familyName: string, createdBy: string) =>
    fetchWithTimeout(API_ENDPOINTS.FAMILIES, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ name: familyName, createdBy })
    })
}