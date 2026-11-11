<script setup>
import { computed, ref, watch } from 'vue'
import AdifViewer from './components/AdifViewer.vue'
import { Interfaces, Traffics, Languages, Stations, PopularStations } from './constants'

const params = new URLSearchParams(window.location.search)
const isFullScreen = params.get('full') === '1'

const form = ref({
  stationCode: params.get('station') || '17000',
  interfaz: params.get('interfaz') || 'departures',
  traffic: params.get('traffic')?.split(',').filter(Boolean) || ['cercanias', 'av', 'largaDistancia', 'regional'],
  languages: params.get('languages')?.split(',').filter(Boolean) || ['es', 'en'],
  showHeader: params.get('header') !== '0',
  showPlatform: params.get('platform') !== '0',
  showProduct: params.get('product') !== '0',
  showNumber: params.get('number') !== '0',
  showAccess: params.get('access') !== '0',
  countdown: params.get('countdown') !== '0',
  showStops: params.get('stops') !== '0',
  showAlerts: params.get('alerts') !== '0',
})

const status = ref('connecting')
const data = ref(null)

// --- Buscador de estaciones ---
const query = ref('')
const showResults = ref(false)
const normalize = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '')
const results = computed(() => {
  const q = normalize(query.value)
  if (!q) return []
  return Stations.filter((s) => normalize(s.name).includes(q) || s.code.includes(q)).slice(0, 30)
})
const selectedStation = computed(() => Stations.find((s) => s.code === form.value.stationCode))
function hideResults() {
  setTimeout(() => (showResults.value = false), 200)
}
function selectStation(code) {
  form.value.stationCode = code
  query.value = ''
  showResults.value = false
}

// --- Props para el visor (mismo formato que espera el tablero de ADIF) ---
const viewerProps = computed(() => {
  const f = form.value
  const iface = Interfaces.find((i) => i.key === f.interfaz)
  const traffic = (f.traffic.length ? f.traffic : Traffics.map((t) => t.key))
    .map((k) => Traffics.find((t) => t.key === k)?.value)
    .filter(Boolean)
    .join(',')
  const props = {
    stationCode: f.stationCode,
    interfaz: iface?.value || f.interfaz,
    traffic,
    languages: f.languages.map((k) => Languages.find((l) => l.key === k)?.value).filter(Boolean).join(','),
    fontSize: 'auto',
  }
  if (['departures', 'arrivals', 'alphabetical'].includes(f.interfaz)) {
    Object.assign(props, {
      showHeader: f.showHeader,
      showAccess: f.showAccess,
      showPlatform: f.showPlatform,
      showProduct: f.showProduct,
      showNumber: f.showNumber,
      countdown: f.countdown,
      maxShowStops: f.showStops ? -1 : 0,
      showAllTrains: false,
      platformFilter: '',
      subtitle: 'station-name',
      showPlatformPreview: true,
      showAlerts: f.showAlerts,
    })
  }
  return props
})

// --- URL compartible / pantalla completa ---
const shareQuery = computed(() => {
  const f = form.value
  const q = new URLSearchParams({
    station: f.stationCode,
    interfaz: f.interfaz,
    traffic: f.traffic.join(','),
    languages: f.languages.join(','),
  })
  const flags = { header: 'showHeader', platform: 'showPlatform', product: 'showProduct', number: 'showNumber', access: 'showAccess', countdown: 'countdown', stops: 'showStops', alerts: 'showAlerts' }
  Object.entries(flags).forEach(([k, v]) => { if (!f[v]) q.set(k, '0') })
  return q.toString()
})
const fullScreenUrl = computed(() => `${window.location.pathname}?full=1&${shareQuery.value}`)

if (!isFullScreen) {
  watch(shareQuery, (q) => window.history.replaceState(null, '', `?${q}`))
}

const statusLabel = computed(() => ({
  connecting: 'Cargando datos',
  reconnecting: 'Reconectando',
  connected: 'Conectado',
  error: 'ADIF está bloqueando la conexión',
  disconnected: 'Desconectado',
}[status.value] || status.value))
const trainCount = computed(() => data.value?.trains?.length || 0)
const updatedAt = computed(() => {
  const t = data.value?.station_settings?.data_time
  return t ? new Date(t).toLocaleTimeString('es-ES') : ''
})

const toggles = [
  ['showHeader', 'Cabecera'],
  ['showPlatform', 'Vía'],
  ['showProduct', 'Producto'],
  ['showNumber', 'Número de tren'],
  ['showAccess', 'Accesos'],
  ['countdown', 'Cuenta atrás'],
  ['showStops', 'Paradas'],
  ['showAlerts', 'Avisos'],
]
</script>

<template>
  <div v-if="isFullScreen" class="fullscreen">
    <AdifViewer v-bind="viewerProps" />
  </div>

  <div v-else class="page">
    <header class="top">
      <h1>Visor ADIF</h1>
      <a class="btn" :href="fullScreenUrl" target="_blank" rel="noopener">Pantalla completa ↗</a>
    </header>

    <main class="layout">
      <section class="panel">
        <label class="field-label">Estación</label>
        <div class="finder">
          <input
            v-model="query"
            type="text"
            :placeholder="selectedStation ? selectedStation.name : 'Buscar estación…'"
            @focus="showResults = true"
            @blur="hideResults"
          />
          <ul v-if="showResults && results.length" class="results">
            <li v-for="s in results" :key="s.code" @mousedown.prevent="selectStation(s.code)">
              <div>
                <div class="r-name">{{ s.name }}</div>
                <div class="r-loc">{{ s.location.town }}, {{ s.location.province }}</div>
              </div>
              <span class="r-code">{{ s.code }}</span>
            </li>
          </ul>
        </div>
        <div class="chips">
          <button
            v-for="p in PopularStations"
            :key="p.code"
            :class="['chip', { active: form.stationCode === p.code }]"
            @click="selectStation(p.code)"
          >{{ p.title }}</button>
        </div>

        <label class="field-label">Pantalla</label>
        <div class="segmented">
          <button
            v-for="i in Interfaces"
            :key="i.key"
            :class="{ active: form.interfaz === i.key }"
            @click="form.interfaz = i.key"
          >{{ i.label }}</button>
        </div>

        <label class="field-label">Tráfico</label>
        <div class="checks">
          <label v-for="t in Traffics" :key="t.key">
            <input v-model="form.traffic" type="checkbox" :value="t.key" /> {{ t.label }}
          </label>
        </div>

        <label class="field-label">Idiomas</label>
        <div class="checks">
          <label v-for="l in Languages" :key="l.key">
            <input v-model="form.languages" type="checkbox" :value="l.key" /> {{ l.label }}
          </label>
        </div>

        <template v-if="['departures', 'arrivals', 'alphabetical'].includes(form.interfaz)">
          <label class="field-label">Mostrar</label>
          <div class="checks">
            <label v-for="[key, label] in toggles" :key="key">
              <input v-model="form[key]" type="checkbox" /> {{ label }}
            </label>
          </div>
        </template>

        <div class="info">
          <div><span class="muted">Código:</span> <code>{{ form.stationCode }}</code></div>
          <div class="status">
            <span :class="['dot', status]"></span>
            {{ statusLabel }}
            <span v-if="trainCount" class="muted">· {{ trainCount }} trenes</span>
            <span v-if="updatedAt" class="muted">· Actualizado {{ updatedAt }}</span>
          </div>
        </div>
      </section>

      <section class="preview">
        <div class="screen">
          <AdifViewer v-bind="viewerProps" @status="status = $event" @data="data = $event" />
        </div>
      </section>
    </main>

    <footer class="foot">
      Proyecto no oficial, sin afiliación con ADIF. Datos, marca y tablero propiedad de ADIF.
      Basado en <a href="https://github.com/mariomnts/pantallas-estaciones" target="_blank" rel="noopener">pantallas-estaciones</a> (GPL-3.0).
    </footer>
  </div>
</template>

<style scoped>
.fullscreen {
  position: fixed;
  inset: 0;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-blue);
}
.page { max-width: 1400px; margin: 0 auto; padding: 16px; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.top h1 { margin: 0; font-size: 1.5rem; color: var(--color-light-green); }
.btn {
  background: var(--color-dark-green); color: var(--color-dark-blue); text-decoration: none;
  padding: 8px 14px; border-radius: 8px; font-weight: 700; white-space: nowrap;
}
.layout { display: grid; grid-template-columns: 340px 1fr; gap: 16px; align-items: start; }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .preview { order: -1; } }
.panel { background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; }
.field-label { display: block; margin: 14px 0 6px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 700; }
.field-label:first-child { margin-top: 0; }
.finder { position: relative; }
.finder input {
  width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--panel-border);
  background: #334155; color: #fff; font: inherit;
}
.finder input::placeholder { color: #cbd5e1; }
.finder input:focus { outline: 2px solid var(--color-dark-green); }
.results {
  position: absolute; z-index: 10; left: 0; right: 0; margin: 4px 0 0; padding: 0; list-style: none;
  background: #334155; border: 1px solid var(--panel-border); border-radius: 8px; max-height: 260px; overflow-y: auto;
}
.results li { display: flex; justify-content: space-between; gap: 8px; padding: 8px 10px; cursor: pointer; }
.results li:hover { background: #475569; }
.r-name { font-size: 0.9rem; }
.r-loc { font-size: 0.75rem; color: var(--muted); }
.r-code { font-family: monospace; font-size: 0.75rem; color: #64748b; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip, .segmented button {
  font: inherit; font-size: 0.8rem; cursor: pointer; border: 1px solid var(--panel-border);
  background: #334155; color: #e2e8f0; border-radius: 6px; padding: 4px 8px;
}
.chip.active, .segmented button.active { background: var(--color-dark-green); color: var(--color-dark-blue); border-color: var(--color-dark-green); font-weight: 700; }
.segmented { display: flex; flex-wrap: wrap; gap: 6px; }
.checks { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.9rem; }
.checks label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.checks input { accent-color: var(--color-dark-green); }
.info { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--panel-border); font-size: 0.85rem; display: grid; gap: 6px; }
.muted { color: var(--muted); }
.status { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #fb923c; }
.dot.connected { background: #4ade80; }
.dot.error { background: #f87171; }
.screen {
  aspect-ratio: 16 / 9; width: 100%; border-radius: 10px; overflow: hidden;
  border: 6px solid #0b1220; background: var(--color-blue); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}
.foot { margin-top: 24px; font-size: 0.75rem; color: var(--muted); text-align: center; }
.foot a { color: var(--color-light-green); }
</style>
