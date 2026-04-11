<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SurveyStory from '@/components/surveys/SurveyStory.vue'
import { useSurveysStore } from '@/stores/surveys'
import type { Survey } from '@/types'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useSurveysStore()

const survey = ref<Survey | null>(null)
const loading = ref(true)

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
  survey.value = store.getSurveyById(props.id) ?? null
  loading.value = false

  if (!survey.value) {
    router.replace('/')
    return
  }

  if (store.hasAnswered(props.id)) {
    router.replace(`/sondages/${props.id}`)
  }
})
</script>

<template>
  <div v-if="loading" class="fixed inset-0 bg-gray-950 flex items-center justify-center">
    <div class="text-white/50 text-sm">Chargement…</div>
  </div>
  <SurveyStory v-else-if="survey" :survey="survey" />
</template>
