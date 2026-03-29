import axios from 'axios'
import useAuthStore from '../store/authStore'
import { DEMO_TOKEN, matchDemoResponse } from '../services/demoData'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
})

// Request interceptor — attach access token + demo mode bypass
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken

  // Demo mode: return mock data without hitting backend
  if (token === DEMO_TOKEN) {
    const method = (config.method || 'get').toUpperCase()
    const url = (config.baseURL || '') + (config.url || '')
    const demoResponse = matchDemoResponse(method, url)

    if (demoResponse) {
      const fakeAdapter = () =>
        Promise.resolve({
          data: demoResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        })
      config.adapter = fakeAdapter
    }
    return config
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 with token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Nie próbuj refresha dla endpointów auth (login/register zwracają 401 przy złych danych)
    const isAuthEndpoint = originalRequest.url?.match(/\/auth\/(login|register|refresh|accept-invite)/)

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshURL = import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/api/auth/refresh`
          : '/api/auth/refresh'
        const { data } = await axios.post(refreshURL, {}, {
          withCredentials: true,
        })

        const newToken = data.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        processQueue(null, newToken)

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
