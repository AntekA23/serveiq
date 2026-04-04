import { useCallback } from 'react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { DEMO_TOKEN } from '../services/demoData'

export default function useAuth() {
  const { setAuth, setUser, logout: clearStore } = useAuthStore()

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password }, {
      withCredentials: true,
    })
    setAuth(data.user, data.accessToken)
    return data
  }, [setAuth])

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData)
    return data
  }, [])

  const logout = useCallback(async () => {
    const currentToken = useAuthStore.getState().accessToken
    if (currentToken !== DEMO_TOKEN) {
      try {
        await api.post('/auth/logout', {}, { withCredentials: true })
      } catch {
        // ignore logout errors
      }
    }
    clearStore()
  }, [clearStore])

  const forgotPassword = useCallback(async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  }, [])

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password })
    return data
  }, [])

  const checkAuth = useCallback(async () => {
    const currentToken = useAuthStore.getState().accessToken
    const currentUser = useAuthStore.getState().user

    // No token at all — nothing to check
    if (!currentToken) return

    // Skip auth check in demo mode - user is already set
    if (currentToken === DEMO_TOKEN) return

    // We have token + user in localStorage — trust it.
    // Try to refresh user data from server, but don't logout on failure.
    if (currentUser) {
      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
        if (data.accessToken) {
          setAuth(data.user, data.accessToken)
        }
      } catch {
        // Server unreachable or token expired and refresh failed.
        // Keep using cached user — don't logout.
        // Interceptor only logouts on explicit 401 from refresh now.
      }
      return
    }

    // Token exists but no user (shouldn't happen, but handle it)
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      if (data.accessToken) {
        setAuth(data.user, data.accessToken)
      }
    } catch {
      // No cached user and can't fetch — clear token
      useAuthStore.getState().logout()
    }
  }, [setUser, setAuth])

  const acceptInvite = useCallback(async (inviteToken, password, firstName, lastName, phone) => {
    const { data } = await api.post('/auth/accept-invite', { inviteToken, password, firstName, lastName, phone })
    return data
  }, [])

  return {
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    checkAuth,
    acceptInvite,
  }
}
