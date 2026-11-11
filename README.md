# Andén

Paneles de salidas y llegadas en directo de las estaciones de **Córdoba** y **Madrid**.

- Cambia de ciudad con un toque. Cada ciudad tiene su color: terracota para Córdoba y rojo para Madrid.
- Las estaciones principales aparecen arriba; el resto de la provincia se busca por nombre o municipio.
- Cuatro vistas del panel: salidas, llegadas, por vía y reloj.
- **Solo trenes hacia Madrid / desde Córdoba**: filtra el panel para ver únicamente los trenes que
  paran en la otra ciudad (Córdoba Julio Anguita; Puerta de Atocha, Chamartín o Atocha Cercanías).
- Guarda tus estaciones con ☆; quedan en tu navegador.
- Pantalla completa, o un enlace con `?full=1` para dejar el panel fijo en una tele o tablet.
  Toda la configuración viaja en la URL.

## Cómo funciona

- `src/components/AdifViewer.vue` es el visor. Se conecta por WebSocket (SignalR) a
  `https://info.adif.es/InfoStation`, recibe los datos de la estación en tiempo real y se los pasa
  al panel de Adif, que se carga en un iframe desde `public/x-1.9/`.
- `src/data/estaciones.js` es la lista de estaciones de las dos provincias con su código de Adif,
  depurada a mano (sin trenes turísticos, duplicados ni códigos internos).
- `src/App.vue` es la interfaz de Andén.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # compila en dist/
```

Hace falta Node 20.19 o superior.

## Despliegue

El proyecto está conectado a Vercel (`vercel.json`): cada push a `main` publica producción y cada
pull request genera una vista previa.

## Licencia y aviso legal

Andén es un proyecto personal y **no oficial**, sin relación con Adif. Los horarios, el panel
(`public/x-1.9`), sus fuentes y la marca Adif pertenecen a Adif.

El visor está adaptado de [mariomnts/pantallas-estaciones](https://github.com/mariomnts/pantallas-estaciones),
publicado bajo GPL-3.0, así que este proyecto mantiene esa misma licencia (ver `LICENSE`).
