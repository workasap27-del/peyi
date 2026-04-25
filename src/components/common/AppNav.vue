<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)

const tabs = [
  { name: 'Carte',      to: '/',            icon: '🗺️' },
  { name: 'Résultats',  to: '/sondages',    icon: '📊' },
]

// ── Admin access ──────────────────────────────────────────────────────────────
const adminToken = ref(localStorage.getItem('peyi_admin_token') || '')
const showAdminAccess = ref(!!adminToken.value)
const showPasswordModal = ref(false)
const adminPasswordInput = ref('')
const adminAuthError = ref('')
const adminAuthLoading = ref(false)

async function tryAdminAccess() {
  if (!adminPasswordInput.value) return
  adminAuthError.value = ''
  adminAuthLoading.value = true
  try {
    const res = await fetch('/api/admin/list-surveys', {
      headers: { Authorization: `Bearer ${adminPasswordInput.value}` },
    })
    if (res.ok) {
      localStorage.setItem('peyi_admin_token', adminPasswordInput.value)
      adminToken.value = adminPasswordInput.value
      showAdminAccess.value = true
      showPasswordModal.value = false
      menuOpen.value = false
      router.push('/admin/questions')
    } else {
      adminAuthError.value = 'Mot de passe incorrect'
      adminPasswordInput.value = ''
    }
  } catch {
    adminAuthError.value = 'Erreur réseau'
  } finally {
    adminAuthLoading.value = false
  }
}

function goToAdmin() {
  router.push('/admin/questions')
  menuOpen.value = false
}
</script>

<template>
  <!-- Bottom nav principale (mobile-first) -->
  <nav class="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 safe-area-inset-bottom">
    <div class="flex">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
        :class="route.path === tab.to || (tab.to !== '/' && route.path.startsWith(tab.to))
          ? 'text-emerald-700'
          : 'text-gray-400 hover:text-gray-600'"
      >
        <span class="text-xl leading-none">{{ tab.icon }}</span>
        <span class="text-[10px] font-medium">{{ tab.name }}</span>
      </RouterLink>

      <!-- Bouton menu secondaire -->
      <button
        class="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
        :class="menuOpen ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'"
        @click="menuOpen = !menuOpen"
      >
        <span class="text-xl leading-none">☰</span>
        <span class="text-[10px] font-medium">Plus</span>
      </button>
    </div>
  </nav>

  <!-- Menu slide-up secondaire -->
  <Transition name="menu">
    <div
      v-if="menuOpen"
      class="fixed inset-x-0 bottom-[57px] z-[9000] bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 px-4 py-5 pointer-events-auto"
      style="max-height: 50vh;"
    >
      <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
      <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Navigation</p>

      <div class="space-y-1">
        <RouterLink
          to="/comment-ca-marche"
          class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition"
          @click="menuOpen = false"
        >
          <span class="text-2xl">💡</span>
          <div>
            <p class="font-medium text-sm">Comment ça marche ?</p>
            <p class="text-xs text-gray-400">La vision et le fonctionnement de Péyi</p>
          </div>
        </RouterLink>
        <RouterLink
          to="/mentions-legales"
          class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition"
          @click="menuOpen = false"
        >
          <span class="text-2xl">📄</span>
          <div>
            <p class="font-medium text-sm">Mentions légales</p>
            <p class="text-xs text-gray-400">Données, vie privée, éditeur</p>
          </div>
        </RouterLink>

        <!-- Admin bouton (visible si token connu) -->
        <button
          v-if="showAdminAccess"
          class="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-gray-50 transition text-left"
          @click="goToAdmin"
        >
          <span class="text-2xl">⚙️</span>
          <div>
            <p class="font-medium text-sm">Administration</p>
            <p class="text-xs text-gray-400">Gérer les sondages</p>
          </div>
        </button>
      </div>

      <!-- Point secret pour activer l'accès admin -->
      <button
        v-if="!showAdminAccess"
        class="w-full py-1 text-center text-gray-100 text-[8px] select-none mt-2"
        @click="showPasswordModal = true"
      >·</button>
    </div>
  </Transition>

  <!-- Overlay menu -->
  <Transition name="fade">
    <div
      v-if="menuOpen"
      class="fixed inset-0 z-[8999] bg-black/20"
      @click="menuOpen = false"
    />
  </Transition>

  <!-- Modal admin password -->
  <Transition name="fade">
    <div
      v-if="showPasswordModal"
      class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center px-6"
      @click.self="showPasswordModal = false"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 class="font-bold text-gray-900 mb-4 text-lg">Accès administration</h3>
        <input
          v-model="adminPasswordInput"
          type="password"
          placeholder="Mot de passe"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-2 focus:border-emerald-500 focus:outline-none"
          :disabled="adminAuthLoading"
          @keyup.enter="tryAdminAccess"
        />
        <p v-if="adminAuthError" class="text-red-500 text-xs mb-3">{{ adminAuthError }}</p>
        <div v-else class="mb-3" />
        <button
          class="w-full bg-emerald-600 text-white rounded-xl py-3 font-medium text-sm hover:bg-emerald-500 transition disabled:opacity-40"
          :disabled="adminAuthLoading || !adminPasswordInput"
          @click="tryAdminAccess"
        >{{ adminAuthLoading ? 'Vérification…' : 'Accéder' }}</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active, .menu-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.menu-enter-from, .menu-leave-to {
  transform: translateY(100%);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
