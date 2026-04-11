<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { Map as LMap, GeoJSON, Layer } from 'leaflet'
import type L from 'leaflet'
type LeafletInstance = typeof L
import { heatColor } from '@/data/communeStats'
import type { CommuneStat } from '@/data/communeStats'
import { useCommunesStore } from '@/stores/communes'
import geojsonData from '@/data/communes-971.json'

const communesStore = useCommunesStore()

const emit = defineEmits<{
  selectCommune: [commune: CommuneStat]
}>()

const mapEl = ref<HTMLDivElement | null>(null)
let map: LMap | null = null
let geoLayer: GeoJSON | null = null
let activeLayer: Layer | null = null

/** Centroïde simple : moyenne des coordonnées du plus grand anneau */
function centroid(geometry: GeoJSON.Geometry): [number, number] {
  let coords: number[][] = []

  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0] as number[][]
  } else if (geometry.type === 'MultiPolygon') {
    // Prendre le plus grand anneau extérieur
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

  // Remove existing layer
  geoLayer?.remove()
  activeLayer = null

  const maxCount = Math.max(
    ...Object.values(communesStore.statsByCode).map(s => s.participantCount),
    1,
  )

  geoLayer = L.geoJSON(geojsonData as GeoJSON.FeatureCollection, {
    style: (feature) => {
      const stat = getStatForFeature(feature!)
      const color = stat ? heatColor(stat.heatScore) : '#555'
      return {
        fillColor: color,
        fillOpacity: stat ? 0.38 + stat.heatScore * 0.22 : 0.2,
        color: 'rgba(255,255,255,0.55)',
        weight: 1.2,
        opacity: 1,
      }
    },
    onEachFeature: (feature, layer) => {
      const stat = getStatForFeature(feature)
      if (!stat) return

      const color = heatColor(stat.heatScore)

      layer.bindTooltip(`
        <div style="font-family:Inter,sans-serif;min-width:150px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${stat.displayName}</div>
          <div style="font-size:11px;color:#555;margin-bottom:2px;">
            👥 ${stat.participantCount} répondants
          </div>
          <div style="font-size:11px;font-weight:600;color:${color};">
            🔥 ${stat.topTopic}
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
          fillOpacity: Math.min(0.75, 0.38 + stat.heatScore * 0.22 + 0.25),
          weight: 2.5,
          color: 'rgba(255,255,255,0.9)',
        })
        ;(layer as any).bringToFront()
      })

      layer.on('mouseout', () => {
        if (activeLayer !== layer) geoLayer!.resetStyle(layer)
      })

      layer.on('click', () => {
        if (activeLayer && activeLayer !== layer) geoLayer!.resetStyle(activeLayer)
        activeLayer = layer
        ;(layer as any).setStyle({ weight: 3, color: '#ffffff', fillOpacity: 0.7 })
        emit('selectCommune', stat)
      })
    },
  }).addTo(map)

  // Proportional circles + labels
  for (const feature of (geojsonData as GeoJSON.FeatureCollection).features) {
    const stat = getStatForFeature(feature)
    if (!stat) continue

    const [lat, lng] = centroid(feature.geometry)
    const color = heatColor(stat.heatScore)
    const r = 3 + (stat.participantCount / maxCount) * 12

    L.circleMarker([lat, lng], {
      radius: r,
      fillColor: color,
      fillOpacity: 0.9,
      color: 'rgba(0,0,0,0.3)',
      weight: 1,
      interactive: false,
    }).addTo(map)

    const labelIcon = L.divIcon({
      className: '',
      html: `<div style="
        color:rgba(255,255,255,0.85);
        font-size:10px;
        font-weight:600;
        text-shadow:0 1px 3px rgba(0,0,0,0.9),0 0 6px rgba(0,0,0,0.6);
        white-space:nowrap;
        pointer-events:none;
        text-align:center;
        line-height:1.2;
      ">${stat.displayName}</div>`,
      iconAnchor: [50, -r - 2],
      iconSize: [100, 16],
    })
    L.marker([lat, lng], { icon: labelIcon, interactive: false }).addTo(map)
  }
}

let leafletInstance: LeafletInstance | null = null

onMounted(async () => {
  const L = (await import('leaflet')).default
  leafletInstance = L
  await import('leaflet/dist/leaflet.css')

  if (!mapEl.value) return

  // Start fetching real participation counts (non-blocking)
  communesStore.loadParticipation()

  map = L.map(mapEl.value, {
    center: [16.17, -61.58],
    zoom: 10,
    zoomControl: false,
    attributionControl: false,
  })

  // Tuiles CartoDB dark — le filtre CSS transforme le fond noir-bleu en turquoise Caraïbes
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 14,
    minZoom: 8,
  }).addTo(map)

  L.control.zoom({ position: 'bottomright' }).addTo(map)
  L.control.attribution({ position: 'bottomleft', prefix: '© CartoDB · IGN' }).addTo(map)

  // Initial render with static data, then re-render when Supabase counts arrive
  renderGeoLayer(L)

  watch(
    () => communesStore.loaded,
    (isLoaded) => {
      if (isLoaded && leafletInstance) renderGeoLayer(leafletInstance)
    },
  )
})

function resetSelection() {
  if (activeLayer) {
    geoLayer?.resetStyle(activeLayer)
    activeLayer = null
  }
}

onUnmounted(() => {
  map?.remove()
  map = null
})

defineExpose({ resetSelection })
</script>

<template>
  <div class="relative w-full h-full caribbean-map">
    <div ref="mapEl" class="w-full h-full" />

    <!-- Éléments décoratifs SVG Caraïbes (positionnés dans la mer) -->
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

    <!-- Légende -->
    <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 z-[1000] text-xs space-y-1.5 pointer-events-none shadow-lg border border-white/60">
      <p class="font-semibold text-gray-600 text-[10px] uppercase tracking-wider mb-2">Opinion publique</p>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-green-500 shrink-0" />
        <span class="text-gray-600">Satisfait / calme</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
        <span class="text-gray-600">Avis mitigés</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-red-500 shrink-0" />
        <span class="text-gray-600">Situation critique</span>
      </div>
      <div class="border-t border-gray-200 my-1.5" />
      <p class="text-gray-400 text-[10px]">• taille = nb répondants</p>
      <p class="text-gray-400 text-[10px]">Cliquez une commune</p>
    </div>
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

/* Fond turquoise Caraïbes */
.caribbean-map .leaflet-container {
  background: #0891b2 !important; /* cyan-600 — visible dans la mer entre les tuiles */
}
.caribbean-map .leaflet-tile-pane {
  opacity: 0.72; /* légère transparence = la mer cyan du fond transparaît */
  filter: hue-rotate(168deg) saturate(1.8) brightness(1.35);
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
