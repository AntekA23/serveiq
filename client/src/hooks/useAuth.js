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

    // No token — not logged in
    if (!currentToken) return

    // Demo mode — already set
    if (currentToken === DEMO_TOKEN) return

    // We have both token AND user in localStorage — just use them.
    // Don't call /auth/me at all. The token will be validated
    // on actual API calls, and refresh will happen automatically
    // via the interceptor when needed.
    if (currentUser) return

    // Edge case: token exists but no user (corrupted state) — clear it
    useAuthStore.getState().logout()
  }, [])

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
