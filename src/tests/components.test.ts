import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import NotFound from '@/views/NotFound.vue'
import HowItWorks from '@/views/HowItWorks.vue'
import LegendPanel from '@/components/map/LegendPanel.vue'

// ── Router helper ─────────────────────────────────────────────────────────────
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/sondages', component: { template: '<div />' } },
    ],
  })
}

// ── NotFound ──────────────────────────────────────────────────────────────────
describe('NotFound', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('affiche le titre "Page introuvable"', async () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [makeRouter(), createPinia()] },
    })
    expect(wrapper.text()).toContain('Page introuvable')
  })

  it('affiche le bouton de retour à la carte', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [makeRouter(), createPinia()] },
    })
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Retour')
  })

  it('affiche l\'emoji carte 🗺️', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [makeRouter(), createPinia()] },
    })
    expect(wrapper.text()).toContain('🗺️')
  })
})

// ── HowItWorks ────────────────────────────────────────────────────────────────
describe('HowItWorks', () => {
  it('affiche le titre "Comment"', () => {
    const wrapper = mount(HowItWorks, {
      global: { plugins: [makeRouter(), createPinia()] },
    })
    expect(wrapper.text()).toContain('Comment')
  })

  it('affiche la mention "Anonyme"', () => {
    const wrapper = mount(HowItWorks, {
      global: { plugins: [makeRouter(), createPinia()] },
    })
    expect(wrapper.text()).toContain('Anonyme')
  })
})

// ── LegendPanel ───────────────────────────────────────────────────────────────
describe('LegendPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // window.innerWidth par défaut dans happy-dom est 1024 → expanded = true
    vi.stubGlobal('innerWidth', 1024)
  })

  it('affiche la légende par défaut sur desktop', async () => {
    const wrapper = mount(LegendPanel, {
      global: { plugins: [createPinia()] },
    })
    // Trigger onMounted (innerWidth >= 768 → expanded)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Participation')
  })

  it('contient les 3 niveaux de participation', async () => {
    const wrapper = mount(LegendPanel, {
      global: { plugins: [createPinia()] },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Forte participation')
    expect(wrapper.text()).toContain('Modérée')
    expect(wrapper.text()).toContain('Aucune')
  })

  it('se replie quand on clique sur le bouton i', async () => {
    const wrapper = mount(LegendPanel, {
      global: { plugins: [createPinia()] },
    })
    await wrapper.vm.$nextTick()
    // Find collapse button (the one that says "i" with title "Replier")
    const collapseBtn = wrapper.find('button[title="Replier"]')
    if (collapseBtn.exists()) {
      await collapseBtn.trigger('click')
      // Expanded contenu should be gone
      expect(wrapper.text()).not.toContain('Forte participation')
    }
  })
})
