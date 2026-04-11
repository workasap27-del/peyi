import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const store = useAuthStore()
  return {
    user: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    isAdmin: computed(() => store.isAdmin),
    loading: computed(() => store.loading),
    signInWithMagicLink: store.signInWithMagicLink,
    signOut: store.signOut,
  }
}
