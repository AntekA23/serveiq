import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      get isAuthenticated() {
        return !!get().accessToken
      },

      setAuth: (user, accessToken) => set({ user, accessToken }),

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'serveiq-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
)

/**
 * Synchronously read persisted auth from localStorage.
 * Called once at app start before React renders.
 * This avoids the async hydration race condition entirely.
 */
export function ensureHydrated() {
  try {
    const raw = localStorage.getItem('serveiq-auth')
    if (!raw) return
    const parsed = JSON.parse(raw)
    const state = parsed?.state
    if (state?.accessToken && state?.user) {
      useAuthStore.setState({ user: state.user, accessToken: state.accessToken })
    }
  } catch {
    // corrupted localStorage — ignore, user will need to login
  }
}

export default useAuthStore
