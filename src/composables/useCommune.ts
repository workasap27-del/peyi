import { ref, onMounted } from 'vue'
import type { Commune } from '@/types'
import { supabase } from '@/services/supabase'

// Singleton — chargé une seule fois pour toute l'app
const communes = ref<Commune[]>([])
const loaded = ref(false)

export function useCommune() {
  async function loadCommunes() {
    if (loaded.value) return
    const { data, error } = await supabase
      .from('communes')
      .select('*')
      .order('name')
    if (error) throw error
    communes.value = data as Commune[]
    loaded.value = true
  }

  function getCommuneById(id: string): Commune | undefined {
    return communes.value.find((c) => c.id === id)
  }

  function getCommuneByInsee(code: string): Commune | undefined {
    return communes.value.find((c) => c.code_insee === code)
  }

  onMounted(loadCommunes)

  return { communes, loadCommunes, getCommuneById, getCommuneByInsee }
}
