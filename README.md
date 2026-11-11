# Visor ADIF

Réplica del componente visor de pantallas de estaciones de ADIF de
[pantallas-estaciones.vercel.app](https://pantallas-estaciones.vercel.app).

## Cómo funciona

- `src/components/AdifViewer.vue`: el visor. Abre una conexión SignalR (WebSocket) con
  `https://info.adif.es/InfoStation`, se une al grupo `dnv3-gravita-<código>` de la estación y,
  cada vez que llega un mensaje, se lo envía con `postMessage` (`grvta.setData`) a un iframe con
  el tablero de ADIF. Muestra un cargador mientras conecta, reintenta y comprueba la conexión cada minuto.
- `public/x-1.9/`: copia del tablero de ADIF ("Infotren Vista" / Gravita), con sus CSS, JS y
  fuentes, tal y como la sirve la web original. Los pictogramas y logotipos se siguen cargando
  desde `info.adif.es`.
- `src/App.vue`: página de demo con buscador de estaciones, tipo de pantalla (salidas,
  llegadas, vía, A‑Z, reloj), tráfico, idiomas y opciones de columnas. La configuración se guarda
  en la URL, y el botón **Pantalla completa** abre `?full=1&...` con solo el visor.

### Uso del componente

```vue
<AdifViewer
  station-code="17000"
  interfaz="adif-infotren-vista-departures"
  traffic="C,A,L,R"
  languages="ESP,ENG"
  font-size="auto"
  @status="(s) => console.log(s)"
  @data="(d) => console.log(d)"
/>
```

Cada prop se pasa al tablero como parámetro de URL en kebab-case (`showPlatform` → `show-platform`).

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # compila en dist/
```

## Despliegue en Vercel

El repositorio ya incluye `vercel.json` (Vite, `npm ci`, `npm run build`, salida en `dist/`).

1. En [vercel.com/new](https://vercel.com/new), importa el repositorio `Trenes-espa-a`.
2. Deja la configuración que detecta y pulsa **Deploy**. No hacen falta variables de entorno.
3. Cada push a `main` despliega producción; cada pull request genera una URL de vista previa.

También desde la terminal: `npx vercel` (vista previa) o `npx vercel --prod`.

El tablero de `public/x-1.9/` se sirve tal cual como fichero estático, y las rutas
desconocidas vuelven a `index.html`. Los ficheros con hash y las fuentes se cachean un año.
Hace falta Node 20.19 o superior (lo pide Vite 7).

Los datos en tiempo real dependen de que ADIF acepte la conexión WebSocket desde tu origen. Si la
rechaza, el visor muestra el estado de error.

## Licencia y aviso legal

Código adaptado de [mariomnts/pantallas-estaciones](https://github.com/mariomnts/pantallas-estaciones),
publicado bajo GPL-3.0. Este proyecto mantiene esa misma licencia (ver `LICENSE`).

Proyecto **no oficial** y sin afiliación con ADIF. El tablero (`public/x-1.9`), las fuentes
AdifHauss, la marca, los logotipos y los datos son propiedad de ADIF.
