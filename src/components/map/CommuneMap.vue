<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { Map as LMap, GeoJSON, Layer } from 'leaflet'
import type L from 'leaflet'
type LeafletInstance = typeof L
import { participationColor, circleRadius } from '@/data/communeStats'
import type { CommuneStat } from '@/data/communeStats'
import { useCommunesStore } from '@/stores/communes'
import geojsonData from '@/data/communes-971.json'
import GlobalStatsBar from './GlobalStatsBar.vue'
import OnboardingTooltip from './OnboardingTooltip.vue'
import LegendPanel from './LegendPanel.vue'

const communesStore = useCommunesStore()

const emit = defineEmits<{
  selectCommune: [commune: CommuneStat]
}>()

const mapEl = ref<HTMLDivElement | null>(null)
let map: LMap | null = null
let geoLayer: GeoJSON | null = null
let activeLayer: Layer | null = null
let labelMarkers: any[] = []

/** Centroïde simple : moyenne des coordonnées du plus grand anneau */
function centroid(geometry: GeoJSON.Geometry): [number, number] {
  let coords: number[][] = []

  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0] as number[][]
  } else if (geometry.type === 'MultiPolygon') {
    let best: number[][] = []
    for (const poly of (geometry.coordinates as number[][][][])) {
      if (poly[0].length > best.length) best = poly[0] as number[][]
    }
    coords = best
  }

  const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length
  const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
  return [lat, lng]
}

function getStatForFeature(feature: GeoJSON.Feature): CommuneStat | null {
  return communesStore.statsByCode[feature.properties?.code] ?? null
}

/** Render/re-render the GeoJSON layer with current stats */
function renderGeoLayer(L: LeafletInstance) {
  if (!map) return

  // Remove existing layers
  geoLayer?.remove()
  activeLayer = null

  // Remove old label markers
  labelMarkers.forEach(m => m.remove())
  labelMarkers = []

  const mx = communesStore.maxCount > 0
    ? communesStore.maxCount
    : Math.max(...Object.values(communesStore.statsByCode).map(s => s.participantCount), 0)

  // Teinte de base : donne une couleur verte aux terres guadeloupéennes (contraste avec l'océan)
  L.geoJSON(geojsonData as GeoJSON.FeatureCollection, {
    style: () => ({
      fillColor: '#1a4a2e',
      fillOpacity: 0.22,
      color: 'transparent',
      weight: 0,
    }),
    interactive: false,
  }).addTo(map)

  geoLayer = L.geoJSON(geojsonData as GeoJSON.FeatureCollection, {
    style: (feature) => {
      const stat = getStatForFeature(feature!)
      const count = stat?.participantCount ?? 0
      // Communes sans répondants : vert clair pâle pour les distinguer de l'océan
      const fillColor = count > 0 ? participationColor(count, mx) : '#a7f3d0'
      return {
        fillColor,
        fillOpacity: count >= 1 ? 0.55 : 0.25,
        color: 'rgba(15,60,30,0.55)',   // bordure vert forêt — contraste net sur fond beige
        weight: 1.5,
        opacity: 1,
      }
    },
    onEachFeature: (feature, layer) => {
      const stat = getStatForFeature(feature)
      if (!stat) return

      const color = participationColor(stat.participantCount, mx)

      layer.bindTooltip(`
        <div style="font-family:Inter,sans-serif;min-width:150px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${stat.displayName}</div>
          <div style="font-size:11px;color:#555;margin-bottom:2px;">
            👥 ${stat.participantCount} répondants
          </div>
          <div style="font-size:11px;font-weight:600;color:${color};">
            📊 ${stat.activeSurveyCount} sondage${stat.activeSurveyCount !== 1 ? 's' : ''} actif${stat.activeSurveyCount !== 1 ? 's' : ''}
          </div>
          <div style="font-size:10px;color:#999;margin-top:4px;">
            Cliquez pour participer →
          </div>
        </div>
      `, {
        direction: 'top',
        sticky: true,
        className: 'peyi-tooltip',
        offset: [0, -4],
      })

      layer.on('mouseover', () => {
        ;(layer as any).setStyle({
          fillOpacity: 0.72,
          weight: 2.5,
          color: 'rgba(5,40,20,0.85)',
        })
        ;(layer as any).bringToFront()
      })

      layer.on('mouseout', () => {
        if (activeLayer !== layer) geoLayer!.resetStyle(layer)
      })

      layer.on('click', () => {
        if (activeLayer && activeLayer !== layer) geoLayer!.resetStyle(activeLayer)
        activeLayer = layer
        ;(layer as any).setStyle({ weight: 3, color: '#1d4ed8', fillOpacity: 0.65 })
        emit('selectCommune', stat)
      })
    },
  }).addTo(map)

  // Proportional circles + commune labels
  for (const feature of (geojsonData as GeoJSON.FeatureCollection).features) {
    const stat = getStatForFeature(feature)
    if (!stat) continue

    const [lat, lng] = centroid(feature.geometry)
    const count = stat.participantCount
    const color = participationColor(count, mx)
    const r = circleRadius(count, mx)

    L.circleMarker([lat, lng], {
      radius: r,
      fillColor: color,
      fillOpacity: count > 0 ? 0.9 : 0.5,
      color: count > 0 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)',
      weight: count > 0 ? 1 : 0.5,
      interactive: false,
    }).addTo(map)

    // Nom de commune (affiché selon zoom via CSS)
    const labelIcon = L.divIcon({
      className: 'commune-label',
      html: `<span class="commune-label-text">${stat.displayName}</span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })
    const lm = L.marker([lat, lng], { icon: labelIcon, interactive: false, zIndexOffset: -200 })
    lm.addTo(map!)
    labelMarkers.push(lm)
  }
}

let leafletInstance: LeafletInstance | null = null
let pulseMarker: any = null

function showPulse(L: LeafletInstance, code: string) {
  if (!map) return
  const feature = (geojsonData as GeoJSON.FeatureCollection).features.find(
    f => f.properties?.code === code
  )
  if (!feature) return
  const [lat, lng] = centroid(feature.geometry)
  pulseMarker?.remove()
  const icon = L.divIcon({
    className: '',
    html: `<div class="peyi-pulse"></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
  pulseMarker = L.marker([lat, lng], { icon, interactive: false }).addTo(map)
  setTimeout(() => { pulseMarker?.remove(); pulseMarker = null }, 3000)
}

/** Met à jour les classes zoom pour la visibilité et la taille des labels */
function updateLabelVisibility() {
  if (!map) return
  const container = map.getContainer()
  const zoom = map.getZoom()
  container.classList.remove('labels-hidden', 'labels-sm', 'labels-lg')
  if (zoom < 9) {
    container.classList.add('labels-hidden')
  } else if (zoom <= 10) {
    container.classList.add('labels-sm')
  } else {
    container.classList.add('labels-lg')
  }
}

onMounted(async () => {
  const L = (await import('leaflet')).default
  leafletInstance = L
  await import('leaflet/dist/leaflet.css')

  if (!mapEl.value) return

  // Attend les données avant le premier render pour éviter tooltip à 0
  await communesStore.loadParticipation()

  map = L.map(mapEl.value, {
    center: [16.3, -61.4],
    zoom: 9,
    zoomControl: false,
    attributionControl: false,
    minZoom: 7,
    maxZoom: 14,
  })

  map.on('zoomend', updateLabelVisibility)
  updateLabelVisibility()

  // CartoDB Voyager No Labels
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 14,
    minZoom: 6,
  }).addTo(map)

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  renderGeoLayer(L)

  watch(
    () => communesStore.loaded,
    (isLoaded) => {
      if (isLoaded && leafletInstance) renderGeoLayer(leafletInstance)
    },
  )

  watch(
    () => communesStore.pulseCode,
    (code) => {
      if (code && leafletInstance) showPulse(leafletInstance, code)
    },
  )
})

function resetSelection() {
  if (activeLayer) {
    geoLayer?.resetStyle(activeLayer)
    activeLayer = null
  }
}

function recenterMap() {
  map?.setView([16.3, -61.4], 9)
}

onUnmounted(() => {
  map?.remove()
  map = null
})

defineExpose({ resetSelection })
</script>

<template>
  <div class="relative w-full h-full caribbean-map">
    <GlobalStatsBar />

    <div ref="mapEl" class="w-full h-full" />

    <!-- Éléments décoratifs SVG Caraïbes -->
    <!-- Dauphin — nord -->
    <div class="sea-deco" style="top: 6%; left: 15%;" title="Dauphin">
      <svg viewBox="0 0 64 64" class="w-8 h-8 opacity-60">
        <path d="M52 20c-4-2-8-1-11 2l-8 8-10-4c-3-1-7 0-9 3s-1 7 2 9l6 3-3 6c-1 3 1 6 4 6s5-2 6-5l2-5 8 4c3 1 7 0 9-3l8-10c2-3 1-7-2-9l-2-5z" fill="#1e90ff" opacity=".7"/>
      </svg>
    </div>
    <!-- Crabe — est -->
    <div class="sea-deco" style="top: 45%; right: 3%;" title="Crabe">
      <svg viewBox="0 0 64 64" class="w-8 h-8 opacity-60">
        <ellipse cx="32" cy="34" rx="14" ry="10" fill="#e05e2b" opacity=".8"/>
        <circle cx="25" cy="29" r="3" fill="#222"/>
        <circle cx="39" cy="29" r="3" fill="#222"/>
        <line x1="18" y1="34" x2="4" y2="28" stroke="#e05e2b" stroke-width="3" stroke-linecap="round"/>
        <line x1="18" y1="38" x2="5" y2="44" stroke="#e05e2b" stroke-width="3" stroke-linecap="round"/>
        <line x1="46" y1="34" x2="60" y2="28" stroke="#e05e2b" stroke-width="3" stroke-linecap="round"/>
        <line x1="46" y1="38" x2="59" y2="44" stroke="#e05e2b" stroke-width="3" stroke-linecap="round"/>
        <line x1="32" y1="44" x2="26" y2="56" stroke="#e05e2b" stroke-width="2" stroke-linecap="round"/>
        <line x1="32" y1="44" x2="38" y2="56" stroke="#e05e2b" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <!-- Phare — sud -->
    <div class="sea-deco" style="bottom: 5%; left: 42%;" title="Phare">
      <svg viewBox="0 0 64 64" class="w-8 h-8 opacity-60">
        <rect x="26" y="14" width="12" height="30" rx="2" fill="#e8c84a"/>
        <rect x="22" y="10" width="20" height="6" rx="1" fill="#e05e2b"/>
        <polygon points="32,2 40,10 24,10" fill="#e05e2b"/>
        <rect x="24" y="44" width="16" height="4" rx="1" fill="#555"/>
        <rect x="20" y="48" width="24" height="4" rx="1" fill="#555"/>
        <line x1="32" y1="2" x2="18" y2="10" stroke="#e8c84a" stroke-width="1.5" opacity=".5"/>
        <line x1="32" y1="2" x2="46" y2="10" stroke="#e8c84a" stroke-width="1.5" opacity=".5"/>
      </svg>
    </div>
    <!-- Colibri — ouest -->
    <div class="sea-deco" style="top: 30%; left: 2%;" title="Colibri">
      <svg viewBox="0 0 64 64" class="w-8 h-8 opacity-60">
        <ellipse cx="38" cy="34" rx="12" ry="7" fill="#00b894" opacity=".9"/>
        <ellipse cx="52" cy="32" rx="8" ry="4" fill="#00cec9" opacity=".7" transform="rotate(-20 52 32)"/>
        <ellipse cx="52" cy="36" rx="8" ry="4" fill="#00b894" opacity=".7" transform="rotate(20 52 36)"/>
        <circle cx="28" cy="32" r="5" fill="#6c5ce7"/>
        <line x1="23" y1="32" x2="12" y2="32" stroke="#6c5ce7" stroke-width="2" stroke-linecap="round"/>
        <circle cx="27" cy="30" r="1.5" fill="#fff"/>
      </svg>
    </div>

    <!-- Bouton recentrer (style Google Maps) -->
    <button
      class="absolute z-[1001] bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition"
      style="bottom: 88px; right: 12px; width: 40px; height: 40px;"
      title="Recentrer sur la Guadeloupe"
      @click="recenterMap"
    >
      <svg viewBox="0 0 24 24" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke-linecap="round"/>
        <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" opacity="0.2" fill="currentColor" stroke="none"/>
      </svg>
    </button>

    <!-- Légende repliable -->
    <LegendPanel />

    <OnboardingTooltip />

    <!-- Vignette -->
    <div
      class="absolute inset-0 pointer-events-none z-[500]"
      style="background: radial-gradient(ellipse 55% 65% at 52% 52%, transparent 60%, rgba(180,210,220,0.45) 100%);"
    />
  </div>
</template>

<style>
.peyi-tooltip {
  background: white;
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  padding: 8px 12px;
}
.peyi-tooltip::before { border-top-color: white !important; }
.leaflet-container { font-family: 'Inter', sans-serif; }

/* Fond mer naturel */
.caribbean-map .leaflet-container {
  background: #a8d5e8 !important;
}

/* Pulse vert après soumission */
.peyi-pulse {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.4);
  border: 2px solid #22c55e;
  animation: peyiPulse 0.8s ease-out infinite;
}
@keyframes peyiPulse {
  0%   { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* Labels communes — masqués si zoom < 9, tailles dynamiques */
.labels-hidden .commune-label { display: none !important; }

.commune-label {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.commune-label-text {
  display: block;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  color: #1a2e1a;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.8);
  font-size: 10px;
  letter-spacing: 0.01em;
}

/* Zoom 9-10 : 10px */
.labels-sm .commune-label-text {
  font-size: 10px;
  opacity: 0.85;
}

/* Zoom > 10 : 13px */
.labels-lg .commune-label-text {
  font-size: 13px;
  opacity: 1;
}

/* Éléments décoratifs SVG */
.sea-deco {
  position: absolute;
  z-index: 500;
  pointer-events: none;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.sea-deco:hover {
  transform: scale(1.3);
  opacity: 1 !important;
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
.sea-deco:nth-child(2) { animation: float 4s ease-in-out infinite; }
.sea-deco:nth-child(3) { animation: float 5s ease-in-out infinite 1s; }
.sea-deco:nth-child(4) { animation: float 6s ease-in-out infinite 0.5s; }
.sea-deco:nth-child(5) { animation: float 4.5s ease-in-out infinite 1.5s; }
</style>
