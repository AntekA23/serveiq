import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,

  get isAuthenticated() {
    return !!get().accessToken
  },

  setAuth: (user, accessToken) => set({ user, accessToken }),

  setUser: (user) => set({ user }),

  setAccessToken: (accessToken) => set({ accessToken }),

  logout: () => set({ user: null, accessToken: null }),
}))

export default useAuthStore
