import { ref } from 'vue'

export interface LatLng {
  lat: number
  lng: number
}

// Centre géographique de la Guadeloupe (Grande-Terre / Basse-Terre)
export const GUADELOUPE_CENTER: LatLng = { lat: 16.265, lng: -61.551 }
export const GUADELOUPE_ZOOM = 10

export function useGeolocation() {
  const position = ref<LatLng | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  function locate() {
    if (!navigator.geolocation) {
      error.value = 'Géolocalisation non supportée par ce navigateur'
      return
    }
    loading.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        position.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        loading.value = false
      },
      (err) => {
        error.value = err.message
        loading.value = false
      },
      { timeout: 8000, maximumAge: 60_000 },
    )
  }

  return { position, error, loading, locate }
}
