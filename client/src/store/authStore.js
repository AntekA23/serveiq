import { useState, useEffect } from 'react'
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
 * Hook that returns true only after zustand has rehydrated from localStorage.
 * Use this to prevent rendering auth-dependent UI before stored state is available.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated())

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])

  return hydrated
}

export default useAuthStore
