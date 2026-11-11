<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AdifViewer from './components/AdifViewer.vue'
import BrandMark from './components/BrandMark.vue'
import { cities } from './data/estaciones'

// ---------------------------------------------------------------------------
// Configuración propia de Andén
// ---------------------------------------------------------------------------
const CITIES = {
  cordoba: { key: 'cordoba', label: 'Córdoba', data: 'Córdoba', other: 'madrid' },
  madrid: { key: 'madrid', label: 'Madrid', data: 'Madrid', other: 'cordoba' },
}

// Estaciones donde paran los trenes de larga distancia de cada ciudad. Se usan
// para el filtro «solo trenes Córdoba ⇄ Madrid» (códigos sin ceros a la izquierda).
const CORRIDOR_STOPS = {
  cordoba: ['50500'],
  madrid: ['60000', '17000', '18000'],
}

const MODES = [
  { key: 'salidas', label: 'Salidas', value: 'adif-infotren-vista-departures', list: true },
  { key: 'llegadas', label: 'Llegadas', value: 'adif-infotren-vista-arrivals', list: true },
  { key: 'via', label: 'Por vía', value: 'adif-infotren-vista-platform' },
  { key: 'reloj', label: 'Reloj', value: 'adif-infotren-vista-clock' },
]

const TRAFFIC = [
  { key: 'C', label: 'Cercanías' },
  { key: 'A', label: 'Alta Velocidad' },
  { key: 'L', label: 'Larga Distancia' },
  { key: 'R', label: 'Regionales' },
]

const LANGS = [
  { key: 'ESP', label: 'Castellano' },
  { key: 'ENG', label: 'Inglés' },
]

const COLUMNS = [
  ['platform', 'Vía'],
  ['product', 'Tipo de tren'],
  ['number', 'Número'],
  ['access', 'Acceso'],
  ['stops', 'Paradas'],
  ['countdown', 'Minutos que faltan'],
  ['alerts', 'Avisos'],
]

// ---------------------------------------------------------------------------
// Estado (sincronizado con la URL para poder compartir enlaces)
// ---------------------------------------------------------------------------
const q = new URLSearchParams(window.location.search)
const isFullScreen = q.get('full') === '1'
const allStations = Object.fromEntries(
  Object.entries(CITIES).map(([k, c]) => [k, cities[c.data]]),
)

function cityOf(code) {
  return Object.keys(allStations).find((k) => allStations[k].some((s) => s.code === code))
}

const initialStation = q.get('e')
const city = ref(cityOf(initialStation) || (q.get('c') in CITIES ? q.get('c') : 'cordoba'))
const defaultStation = (key) => ({ cordoba: '50500', madrid: '60000' })[key]
const stationCode = ref(initialStation && cityOf(initialStation) ? initialStation : defaultStation(city.value))
const mode = ref(MODES.some((m) => m.key === q.get('p')) ? q.get('p') : 'salidas')
const corridor = ref(q.get('ruta') === '1')
const traffic = ref(q.get('t')?.split(',').filter(Boolean) || TRAFFIC.map((t) => t.key))
const langs = ref(q.get('l')?.split(',').filter(Boolean) || ['ESP', 'ENG'])
const hidden = ref(q.get('ocultar')?.split(',').filter(Boolean) || [])

const station = computed(() => allStations[city.value].find((s) => s.code === stationCode.value))
const otherCity = computed(() => CITIES[CITIES[city.value].other])
const currentMode = computed(() => MODES.find((m) => m.key === mode.value))

function setCity(key) {
  if (city.value === key) return
  city.value = key
  stationCode.value = defaultStation(key)
  search.value = ''
}

// Favoritas: solo en este navegador.
const FAV_KEY = 'anden:favoritas'
const favorites = ref(readFavorites())
function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]')
  } catch {
    return []
  }
}
function toggleFavorite(code) {
  favorites.value = favorites.value.includes(code)
    ? favorites.value.filter((c) => c !== code)
    : [...favorites.value, code]
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites.value))
  } catch {
    /* almacenamiento no disponible: se mantienen solo en esta visita */
  }
}
const isFavorite = computed(() => favorites.value.includes(stationCode.value))

// Buscador dentro de la ciudad elegida.
const search = ref('')
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
// Orden fijo de las estaciones principales de cada ciudad.
const FEATURED_ORDER = {
  cordoba: ['50500', '02002', '37704', '54105', '50506'],
  madrid: ['60000', '17000', '18000', '10000', '18002', '18101', '98305'],
}
const featured = computed(() =>
  FEATURED_ORDER[city.value].map((c) => allStations[city.value].find((s) => s.code === c)).filter(Boolean),
)
const favoriteStations = computed(() =>
  allStations[city.value].filter((s) => favorites.value.includes(s.code)),
)
const listed = computed(() => {
  const term = norm(search.value.trim())
  const list = allStations[city.value]
  if (!term) return list
  return list.filter((s) => norm(s.name).includes(term) || norm(s.town).includes(term) || s.code.includes(term))
})

// ---------------------------------------------------------------------------
// Props para el visor
// ---------------------------------------------------------------------------
const viewerProps = computed(() => {
  const props = {
    stationCode: stationCode.value,
    interfaz: currentMode.value.value,
    traffic: (traffic.value.length ? traffic.value : TRAFFIC.map((t) => t.key)).join(','),
    languages: (langs.value.length ? langs.value : ['ESP']).join(','),
    fontSize: 'auto',
  }
  if (currentMode.value.list) {
    const show = (k) => !hidden.value.includes(k)
    Object.assign(props, {
      showHeader: true,
      showPlatform: show('platform'),
      showProduct: show('product'),
      showNumber: show('number'),
      showAccess: show('access'),
      countdown: show('countdown'),
      maxShowStops: show('stops') ? -1 : 0,
      showAlerts: show('alerts'),
      showAllTrains: false,
      platformFilter: '',
      subtitle: 'station-name',
      showPlatformPreview: true,
    })
    if (corridor.value) props.stopFilter = CORRIDOR_STOPS[otherCity.value.key].join(',')
  }
  return props
})

const shareQuery = computed(() => {
  const p = new URLSearchParams({ e: stationCode.value, p: mode.value })
  if (corridor.value) p.set('ruta', '1')
  if (traffic.value.length !== TRAFFIC.length) p.set('t', traffic.value.join(','))
  if (langs.value.join(',') !== 'ESP,ENG') p.set('l', langs.value.join(','))
  if (hidden.value.length) p.set('ocultar', hidden.value.join(','))
  return p.toString()
})
if (!isFullScreen) watch(shareQuery, (s) => window.history.replaceState(null, '', `?${s}`), { immediate: true })
const fullScreenUrl = computed(() => `${window.location.pathname}?full=1&${shareQuery.value}`)

const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${fullScreenUrl.value}`)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    window.open(fullScreenUrl.value, '_blank')
  }
}

// ---------------------------------------------------------------------------
// Estado de la conexión y reloj
// ---------------------------------------------------------------------------
const status = ref('connecting')
const data = ref(null)
const statusText = computed(
  () =>
    ({
      connecting: 'Conectando con Adif',
      reconnecting: 'Reconectando',
      connected: 'En directo',
      error: 'Adif no responde',
      disconnected: 'Sin conexión',
    })[status.value] || status.value,
)
const trainCount = computed(() => data.value?.trains?.length || 0)

const now = ref(new Date())
let clock = null
onMounted(() => (clock = setInterval(() => (now.value = new Date()), 1000)))
onBeforeUnmount(() => clearInterval(clock))
const time = computed(() => now.value.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))

const screen = ref(null)
function enterFullscreen() {
  if (screen.value?.requestFullscreen) screen.value.requestFullscreen().catch(() => window.open(fullScreenUrl.value, '_blank'))
  else window.open(fullScreenUrl.value, '_blank')
}
</script>

<template>
  <div v-if="isFullScreen" class="kiosk" :data-city="city">
    <AdifViewer v-bind="viewerProps" />
  </div>

  <div v-else class="app" :data-city="city">
    <header class="bar">
      <div class="brand">
        <BrandMark class="mark" />
        <div>
          <div class="wordmark">Andén</div>
          <div class="tagline">Paneles de trenes de Córdoba y Madrid</div>
        </div>
      </div>

      <nav class="cities" aria-label="Ciudad">
        <button
          v-for="c in CITIES"
          :key="c.key"
          :class="['city', c.key, { on: city === c.key }]"
          :aria-pressed="city === c.key"
          @click="setCity(c.key)"
        >
          {{ c.label }}
        </button>
      </nav>

      <div class="clock" aria-label="Hora">{{ time }}</div>
    </header>

    <main class="grid">
      <aside class="side">
        <section v-if="favoriteStations.length" class="block">
          <h2>Tus estaciones</h2>
          <div class="pills">
            <button
              v-for="s in favoriteStations"
              :key="s.code"
              :class="['pill', { on: s.code === stationCode }]"
              @click="stationCode = s.code"
            >
              ★ {{ s.name }}
            </button>
          </div>
        </section>

        <section class="block">
          <h2>Principales de {{ CITIES[city].label }}</h2>
          <div class="cards">
            <button
              v-for="s in featured"
              :key="s.code"
              :class="['card', { on: s.code === stationCode }]"
              @click="stationCode = s.code"
            >
              <span class="card-name">{{ s.name }}</span>
              <span class="card-town">{{ s.town }}</span>
            </button>
          </div>
        </section>

        <section class="block">
          <h2>Todas las estaciones <span class="count">{{ allStations[city].length }}</span></h2>
          <input v-model="search" class="search" type="search" :placeholder="`Buscar en ${CITIES[city].label}…`" />
          <ul class="list">
            <li v-for="s in listed" :key="s.code">
              <button :class="{ on: s.code === stationCode }" @click="stationCode = s.code">
                <span>{{ s.name }}</span>
                <small>{{ s.town }}</small>
              </button>
            </li>
            <li v-if="!listed.length" class="empty">Ninguna estación coincide.</li>
          </ul>
        </section>
      </aside>

      <section class="stage">
        <div class="stage-head">
          <div>
            <p class="eyebrow">
              {{ station?.town === CITIES[city].label ? `Estación de ${CITIES[city].label}` : `${station?.town} · provincia de ${CITIES[city].label}` }}
            </p>
            <h1>
              <span>{{ station?.name }}</span>
              <button
                class="fav"
                :class="{ on: isFavorite }"
                :aria-label="isFavorite ? 'Quitar de tus estaciones' : 'Guardar en tus estaciones'"
                :title="isFavorite ? 'Quitar de tus estaciones' : 'Guardar en tus estaciones'"
                @click="toggleFavorite(stationCode)"
              >
                {{ isFavorite ? '★' : '☆' }}
              </button>
            </h1>
          </div>
          <div class="live" :class="status">
            <span class="dot"></span>
            {{ statusText }}<template v-if="status === 'connected' && trainCount"> · {{ trainCount }} trenes</template>
          </div>
        </div>

        <div class="toolbar">
          <div class="tabs" role="tablist">
            <button
              v-for="m in MODES"
              :key="m.key"
              role="tab"
              :aria-selected="mode === m.key"
              :class="{ on: mode === m.key }"
              @click="mode = m.key"
            >
              {{ m.label }}
            </button>
          </div>

          <label v-if="currentMode.list" class="switch">
            <input v-model="corridor" type="checkbox" />
            <span class="track"><span class="thumb"></span></span>
            Solo trenes {{ mode === 'llegadas' ? 'desde' : 'hacia' }} {{ otherCity.label }}
          </label>
        </div>

        <p v-if="currentMode.list && corridor" class="hint">
          Solo se muestran trenes con parada en {{ otherCity.label === 'Madrid' ? 'Puerta de Atocha, Chamartín o Atocha Cercanías' : 'Córdoba Julio Anguita' }}.
          Si el panel sale vacío, no hay ninguno en las próximas horas.
        </p>

        <div ref="screen" class="screen">
          <AdifViewer v-bind="viewerProps" @status="status = $event" @data="data = $event" />
        </div>

        <div class="actions">
          <button class="btn primary" @click="enterFullscreen">Pantalla completa</button>
          <a class="btn" :href="fullScreenUrl" target="_blank" rel="noopener">Abrir en otra pestaña</a>
          <button class="btn" @click="copyLink">{{ copied ? 'Enlace copiado' : 'Copiar enlace' }}</button>
        </div>

        <details class="settings">
          <summary>Ajustes del panel</summary>
          <div class="settings-grid">
            <fieldset>
              <legend>Trenes</legend>
              <label v-for="t in TRAFFIC" :key="t.key"><input v-model="traffic" type="checkbox" :value="t.key" /> {{ t.label }}</label>
            </fieldset>
            <fieldset>
              <legend>Idiomas</legend>
              <label v-for="l in LANGS" :key="l.key"><input v-model="langs" type="checkbox" :value="l.key" /> {{ l.label }}</label>
            </fieldset>
            <fieldset v-if="currentMode.list">
              <legend>Ocultar columnas</legend>
              <label v-for="[k, label] in COLUMNS" :key="k"><input v-model="hidden" type="checkbox" :value="k" /> {{ label }}</label>
            </fieldset>
          </div>
        </details>
      </section>
    </main>

    <footer class="foot">
      Andén es un proyecto personal y no oficial, sin relación con Adif. Los horarios y el panel se cargan
      en directo desde los servidores de Adif, propietario de los datos y de su marca. El visor se basa en
      <a href="https://github.com/mariomnts/pantallas-estaciones" target="_blank" rel="noopener">pantallas-estaciones</a>
      (GPL-3.0).
    </footer>
  </div>
</template>

<style scoped>
.kiosk {
  position: fixed;
  inset: 0;
  height: 100dvh;
  overflow: hidden;
  background: var(--board-bg);
}

.app {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px clamp(16px, 3vw, 32px) 32px;
}

/* --- Barra superior --- */
.bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}
.brand { display: flex; align-items: center; gap: 12px; }
.mark { width: 44px; height: 44px; color: var(--accent); flex: none; transition: color 0.3s; }
.wordmark { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.tagline { color: var(--text-muted); font-size: 0.85rem; margin-top: 3px; }

.cities {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
}
.city {
  font: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  border: 0;
  border-radius: 999px;
  padding: 8px 20px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.25s, color 0.25s;
}
.city.on { color: var(--on-accent); }
.city.cordoba.on { background: var(--cordoba); }
.city.madrid.on { background: var(--madrid); }
.clock {
  justify-self: end;
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1.6rem;
  font-weight: 700;
}

/* --- Rejilla --- */
.grid {
  display: grid;
  grid-template-columns: minmax(260px, 320px) 1fr;
  gap: 28px;
  align-items: start;
}
.side { display: grid; gap: 24px; position: sticky; top: 16px; }
.block h2 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.count {
  background: var(--surface-2);
  color: var(--text);
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 0.7rem;
  letter-spacing: 0;
}

.pills { display: flex; flex-wrap: wrap; gap: 6px; }
.pill {
  font: inherit;
  font-size: 0.85rem;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  border-radius: 999px;
  padding: 5px 12px;
  cursor: pointer;
}
.pill.on { border-color: var(--accent); color: var(--accent); }

.cards { display: grid; gap: 8px; }
.card {
  font: inherit;
  text-align: left;
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}
.card:hover { border-color: color-mix(in srgb, var(--accent) 60%, var(--line)); }
.card.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, var(--surface));
  box-shadow: inset 4px 0 0 var(--accent);
}
.card-name { font-weight: 700; line-height: 1.25; }
.card-town { font-size: 0.8rem; color: var(--text-muted); }

.search {
  width: 100%;
  font: inherit;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
}
.search:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: 340px;
  overflow-y: auto;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.list button {
  font: inherit;
  width: 100%;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  padding: 9px 14px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}
.list li:last-child button { border-bottom: 0; }
.list button:hover { background: var(--surface-2); }
.list button.on { color: var(--accent); font-weight: 700; }
.list small { color: var(--text-muted); font-size: 0.75rem; text-align: right; }
.empty { padding: 12px 14px; color: var(--text-muted); font-size: 0.9rem; }

/* --- Escenario del panel --- */
.stage { min-width: 0; }
.stage-head { display: flex; justify-content: space-between; align-items: end; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.eyebrow { margin: 0 0 4px; color: var(--accent); font-weight: 700; font-size: 0.85rem; letter-spacing: 0.04em; text-transform: uppercase; }
h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3.4vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.05;
  display: flex;
  align-items: center;
  gap: 10px;
}
.fav {
  font-size: 1.4rem;
  line-height: 1;
  border: 0;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  flex: none;
  align-self: flex-start;
}
.fav.on { color: var(--accent); }

.live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
}
.dot { width: 8px; height: 8px; border-radius: 50%; background: #e5b33d; }
.live.connected .dot { background: #4cc38a; box-shadow: 0 0 0 4px color-mix(in srgb, #4cc38a 25%, transparent); }
.live.error .dot { background: #ef5f5f; }

.hint { margin: -4px 0 12px; font-size: 0.85rem; color: var(--text-muted); }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.tabs { display: inline-flex; gap: 4px; padding: 4px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; }
.tabs button {
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  border: 0;
  border-radius: 9px;
  padding: 7px 14px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.tabs button.on { background: var(--text); color: var(--bg); }

.switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem; user-select: none; }
.switch input { position: absolute; opacity: 0; pointer-events: none; }
.track { width: 38px; height: 22px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--line); position: relative; transition: background 0.2s; }
.thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--text-muted); transition: transform 0.2s, background 0.2s; }
.switch input:checked + .track { background: var(--accent); border-color: var(--accent); }
.switch input:checked + .track .thumb { transform: translateX(16px); background: var(--on-accent); }
.switch input:focus-visible + .track { outline: 2px solid var(--accent); outline-offset: 2px; }

.screen {
  aspect-ratio: 16 / 9;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  background: var(--board-bg);
  border: 1px solid var(--line);
  box-shadow: 0 30px 60px -30px rgba(0, 0, 0, 0.7), 0 0 0 6px var(--surface);
}
.screen:fullscreen { border-radius: 0; border: 0; box-shadow: none; }

.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.btn {
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}
.btn:hover { border-color: var(--accent); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }

.settings { margin-top: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
.settings summary { cursor: pointer; padding: 12px 16px; font-weight: 600; }
.settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; padding: 0 16px 16px; }
fieldset { border: 0; margin: 0; padding: 0; display: grid; gap: 6px; }
legend { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 6px; }
fieldset label { display: flex; gap: 8px; align-items: center; font-size: 0.9rem; cursor: pointer; }
fieldset input { accent-color: var(--accent); }

.foot { margin-top: 40px; color: var(--text-muted); font-size: 0.78rem; line-height: 1.6; max-width: 760px; }
.foot a { color: var(--text); }

@media (max-width: 960px) {
  .grid { grid-template-columns: 1fr; }
  .side { position: static; order: 2; }
  .stage { order: 1; }
  .bar { grid-template-columns: 1fr auto; }
  .cities { grid-column: 1 / -1; justify-self: start; order: 3; }
  .cards { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
}
@media (max-width: 520px) {
  .tagline { display: none; }
  .tabs { width: 100%; }
  .tabs button { flex: 1; padding: 7px 6px; }
  .screen { border-radius: 12px; }
}
</style>
