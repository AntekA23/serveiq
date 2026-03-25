import { create } from 'zustand'

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

const useUiStore = create((set, get) => ({
  sidebarOpen: !isMobile,
  theme: 'dark',
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', newTheme)
    set({ theme: newTheme })
  },

  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))
    return id
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export default useUiStore
