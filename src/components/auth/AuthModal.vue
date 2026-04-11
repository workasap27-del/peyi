<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

defineProps<{ surveyId: string }>()
const emit = defineEmits<{
  success: []
  close: []
}>()

const auth = useAuthStore()

type Step = 'phone' | 'otp'
const step = ref<Step>('phone')
const phone = ref('')
const otp = ref('')
const loading = ref(false)
const errorMsg = ref('')

// Format phone: ensure it starts with + and country code
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // If starts with 0 (French local), prefix with +590 (Guadeloupe)
  if (digits.startsWith('0')) return '+590' + digits.slice(1)
  // If already has country code
  if (digits.startsWith('590') || digits.startsWith('596')) return '+' + digits
  return '+' + digits
}

async function sendOtp() {
  errorMsg.value = ''
  const normalized = normalizePhone(phone.value)
  if (normalized.length < 10) {
    errorMsg.value = 'Numéro invalide'
    return
  }
  loading.value = true
  try {
    await auth.sendPhoneOtp(normalized)
    phone.value = normalized
    step.value = 'otp'
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Erreur envoi OTP'
  } finally {
    loading.value = false
  }
}

async function verifyOtp() {
  errorMsg.value = ''
  if (otp.value.length < 4) {
    errorMsg.value = 'Code invalide'
    return
  }
  loading.value = true
  try {
    await auth.verifyPhoneOtp(phone.value, otp.value)
    emit('success')
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Code incorrect'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div
      class="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl px-6 py-8 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Confirme ton numéro</h2>
            <p class="text-sm text-gray-500 mt-0.5">Pour participer de façon sécurisée</p>
          </div>
          <button class="p-2 rounded-full hover:bg-gray-100 text-gray-400" @click="emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Step 1: Phone -->
        <div v-if="step === 'phone'" class="space-y-4">
          <div class="bg-emerald-50 rounded-2xl p-4 flex gap-3">
            <span class="text-2xl">🔒</span>
            <div class="text-sm text-emerald-800">
              <p class="font-semibold">Anonymat garanti</p>
              <p class="text-emerald-700 mt-0.5">Ton numéro est haché — on ne stocke pas ton identité, uniquement tes réponses.</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Numéro de téléphone</label>
            <div class="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
              <span class="bg-gray-50 px-3 flex items-center text-gray-500 text-sm border-r border-gray-200">
                🇬🇵 +590
              </span>
              <input
                v-model="phone"
                type="tel"
                placeholder="690 00 00 00"
                class="flex-1 px-3 py-3 text-base outline-none bg-white"
                @keydown.enter="sendOtp"
              />
            </div>
          </div>

          <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

          <button
            class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            :disabled="loading"
            @click="sendOtp"
          >
            <span v-if="loading">Envoi en cours…</span>
            <span v-else>Recevoir le code →</span>
          </button>
        </div>

        <!-- Step 2: OTP -->
        <div v-else class="space-y-4">
          <div class="text-center">
            <p class="text-sm text-gray-600">Code envoyé au</p>
            <p class="font-semibold text-gray-900">{{ phone }}</p>
            <button class="text-xs text-emerald-600 mt-1 underline" @click="step = 'phone'">
              Modifier le numéro
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Code reçu par SMS</label>
            <input
              v-model="otp"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              class="w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              @keydown.enter="verifyOtp"
            />
          </div>

          <p v-if="errorMsg" class="text-sm text-red-600 text-center">{{ errorMsg }}</p>

          <button
            class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            :disabled="loading || otp.length < 4"
            @click="verifyOtp"
          >
            <span v-if="loading">Vérification…</span>
            <span v-else>Valider et participer →</span>
          </button>
        </div>

        <p class="text-xs text-gray-400 text-center mt-4">
          En continuant, tu acceptes nos
          <RouterLink to="/mentions-legales" class="underline" @click="emit('close')">mentions légales</RouterLink>
        </p>
      </div>
    </div>
  </Teleport>
</template>
