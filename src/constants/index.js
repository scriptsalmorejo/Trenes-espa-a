export { Stations, PopularStations } from './stations'

export const Interfaces = [
  { key: 'departures', value: 'adif-infotren-vista-departures', label: 'Salidas' },
  { key: 'arrivals', value: 'adif-infotren-vista-arrivals', label: 'Llegadas' },
  { key: 'platform', value: 'adif-infotren-vista-platform', label: 'Vía' },
  { key: 'alphabetical', value: 'adif-infotren-vista-alphabetical', label: 'A - Z' },
  { key: 'clock', value: 'adif-infotren-vista-clock', label: 'Reloj' },
]

export const Traffics = [
  { key: 'cercanias', value: 'C', label: 'Cercanías' },
  { key: 'av', value: 'A', label: 'Alta Velocidad' },
  { key: 'largaDistancia', value: 'L', label: 'Larga Distancia' },
  { key: 'regional', value: 'R', label: 'Regional' },
]

export const Languages = [
  { key: 'es', value: 'ESP', label: 'Español' },
  { key: 'en', value: 'ENG', label: 'English' },
  { key: 'ca', value: 'CAT', label: 'Català' },
  { key: 'eu', value: 'EUS', label: 'Euskera' },
  { key: 'gl', value: 'GAL', label: 'Galego' },
]
