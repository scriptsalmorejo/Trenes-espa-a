/**
 * adif_infotren_vista.js
 * Versión 1.9
 * Copyright (c) 2024-2026 Administrador de Infraestructuras Ferroviarias
 *
 * Proyecto desarrollado por ADIF
 * Dirección de Estaciones y Proyectos Singulares
 * Dirección General de Viajeros y Desarrollo de Negovio
 *
 */

// IMPORTANTE: CAMBIO DE NOMBRE COMERCIAL DE LA APLICACIÓN
// Cambio de nombre de la aplicación Adif Gravita a Adif Infotren Vista
// Cambio de nombre de los scripts:
//        adif_gravita.js -> adif_infotren_vista.js
//        adif_gravita_interface.js -> adif_infotren_vista_interface.js
// Cambio de nombre de las clases que activan las interfaces:
//        .adif-gravita -> .adif-infotren-vista
//        .adif-gravita-departures -> .adif-infotren-vista-departures
//        .adif-gravita-arrivals -> .adif-infotren-vista-arrivals
//        .adif-gravita-platform -> .adif-infotren-vista-platform
//        .adif-gravita-clock -> .adif-infotren-vista-clock

// Actualizaciones:
// Nueva interfaz adif-infotren-vista-alphabetical
// Redefinición funciones AdVista24_Resize y AdVista24_Reload
// Representación de trenes accesibles en interfaces arrivals, departures y platform.
// Resuelve bug en filtrado de servicios (product-filter) cuando están etiquetados como restricted origin/destination
// Resuelve bug en representación de alertas que no necesitan scroll.
// Mejoras en la representación de destinos que no caben en el contenedor
// Posibilidad de incluir logotipos de estación coloreados al utilizar minúsculas en el nombre del mismo.
// En caso de empate al ordenar horas de salida o llegada, se desempata por el id del servicio. Hasta ahora se hacía por orden de aparición en el JSON.

// Funciones y variables definidas en scripts externos
/* global globalThis */
/* global getStationJSON */
/* global station */
/* global getMultimediaFolder */
/* global AdGr24_station */
/* global AdVista24_subtitulos */
/* global AdVista24_getMultimediaFolder */
/* global AdVista24_getStationJSON */
/* global AdVista24_euskera_vocablos_ergativo_no_terminado_en_ek */
/* global AdVista24_accesos_igualar_tamaño */
/* global AdVista24_frases */

// Funcionalidades que garantizan la retrocompatibilidad con versiones anteriores
if (typeof globalThis.AdVista24_getStationJSON !== "function") {
    globalThis.AdVista24_getStationJSON = getStationJSON;
    AdVista24_consoleLog(
        "El nombre de la función getStationJSON ha cambiado a AdVista24_getStationJSON. Por favor, actualiza el archivo adif_infotren_vista_interface.js"
    );
}
if (typeof globalThis.AdVista24_getMultimediaFolder !== "function") {
    globalThis.AdVista24_getMultimediaFolder = getMultimediaFolder;
    AdVista24_consoleLog(
        "El nombre de la función getMultimediaFolder ha cambiado a AdVista24_getMultimediaFolder. Por favor, actualiza el archivo adif_infotren_vista_interface.js"
    );
}

if (typeof AdVista24_station === "undefined") {
    var AdVista24_station = "";
    if (typeof AdGr24_station !== "undefined") AdVista24_station = AdGr24_station;
    else if (typeof station !== "undefined") AdVista24_station = station;
}
AdVista24_consoleLog(
    "Novedad versión 1.9: Las variables y funciones de control externo cambian su cabecera de AdGr24_ a AdVista24_. Por favor, actualiza las referencias si las usas"
);

if ($(".adif-gravita").length > 0) {
    AdVista24_consoleLog(
        "El nombre de la clase adif-gravita ha cambiado a adif-infotren-vista. Por favor actualiza la configuración de la interfaz."
    );
    $(".adif-gravita").addClass("adif-infotren-vista");
}

if ($(".adif-gravita-departures").length > 0) {
    AdVista24_consoleLog(
        "El nombre de la clase adif-gravita-departures ha cambiado a adif-infotren-vista-departures. Por favor actualiza la configuración de la interfaz."
    );
    $(".adif-gravita-departures").addClass("adif-infotren-vista-departures");
}

if ($(".adif-gravita-arrivals").length > 0) {
    AdVista24_consoleLog(
        "El nombre de la clase adif-gravita-arrivals ha cambiado a adif-infotren-vista-arrivals. Por favor actualiza la configuración de la interfaz."
    );
    $(".adif-gravita-arrivals").addClass("adif-infotren-vista-arrivals");
}

if ($(".adif-gravita-platform").length > 0) {
    AdVista24_consoleLog(
        "El nombre de la clase adif-gravita-platform ha cambiado a adif-infotren-vista-platform. Por favor actualiza la configuración de la interfaz."
    );
    $(".adif-gravita-platform").addClass("adif-infotren-vista-platform");
}

if ($(".adif-gravita-clock").length > 0) {
    AdVista24_consoleLog(
        "El nombre de la clase adif-gravita-clock ha cambiado a adif-infotren-vista-clock. Por favor actualiza la configuración de la interfaz."
    );
    $(".adif-gravita-clock").addClass("adif-infotren-vista-clock");
}

if ($(".adif-gravita-alphabetical").length > 0) {
    AdVista24_consoleLog(
        "El nombre de la clase adif-gravita-alphabetical ha cambiado a adif-infotren-vista-alphabetical. Por favor actualiza la configuración de la interfaz."
    );
    $(".adif-gravita-alphabetical").addClass("adif-infotren-vista-alphabetical");
}

// Variables globales
var AdVista24_trains_data = []; // Información de trenes a recibir en JSON
var AdVista24_station_list = []; // Lista de estaciones a recibir en JSON
var AdVista24_line_colors = []; // Lista de colores de líneas a recibir en JSON
var AdVista24_alerts = []; // Alertas a recibir en JSON

// Variables de control externo (inicializables en otros scripts)

// Controla externamente la recarga automática de la página cada 60 min
if (typeof AdVista24_autoreload === "undefined") var AdVista24_autoreload = true;
// Controla externamente el funcionamiento del script
if (typeof AdVista24_active === "undefined") var AdVista24_active = true;
// Controla externamente la publicación de log
if (typeof AdVista24_get_console_log === "undefined") var AdVista24_get_console_log = false;
// Controla externamente la visualización de la regla para posicionar composiciones
if (typeof AdVista24_show_composition_guide === "undefined") var AdVista24_show_composition_guide = false;

// Settings globales por defecto (modificables en JSON o atributos HTML)
// Tipos de tráfico que se muestran por defecto en cuenta atrás en interfaces de andén y que numestran hora teorica en interfaces de salida con cuenta atrás
var AdVista24_default_countdown_traffics = ["C"];

// Tipos de tráfico que se muestran por defecto con hora prevista en vez de hora teorica
var AdVista24_default_estimated_time_traffics = ["C"];

// Idiomas por defecto. Se mostrarán los indicados en el atributo language del HTML, o en su defecto los indicados en la entrada de datos JSON.
var AdVista24_languages = ["ESP", "ENG"];

// Nombre de la estación. Se actualiza vía JSON.
var AdVista24_station_name = "";

// Tipo de sectorización por defecto.
var AdVista24_default_sectorization_mode = "first_and_last";

// Caducidad de los datos (en segundos)
// En caso de que los datos recibidos sean más antiguos que el tiempo de expiración,
// se ignoran y se elimina la información de las interfaces. Si es 0, no aplica la caducidad.
var AdVista24_trains_data_expiration_timer = 300;

//Event handler para cuando cambia de forma la pantalla. Se recarga la página para que queden las líneas adecuadas
//y las columnas con su correcto tamaño. Asegura el funcionamiento responsive.
window.addEventListener("resize", function () {
    AdVista24_Resize();
});

/*
+===============================================================+
| Funciones obligatorias para cargar Gravita y actualizar datos |
+===============================================================+
*/

// Carga inicial de datos
$(document).ready(function () {
    document.fonts.ready.then(function () {
        comprobaryComenzar();
    });
});


function comprobaryComenzar(){
    if($('#contenedorInfotrenVista') && vars['IdEstacion'] != undefined){
        if( !$('#contenedorInfotrenVista').hasClass('adif-infotren-vista') ) generarCabecera();
    } else {
        requestAnimationFrame(comprobaryComenzar)
    }

    if(datosRecibidos != null){
        AdVista24_restartApp();
    } else {
        requestAnimationFrame(comprobaryComenzar)
    }
}

function AdVista24_consoleLog(mensaje) {
    console.log("[Infotren Vista] " + mensaje);
}

function AdVista24_restartApp() {
    if (AdVista24_get_console_log) AdVista24_consoleLog("Reseteando aplicación");
    if (AdVista24_active) {
        AdVista24_startPlatformMonitors();
        AdVista24_startListMonitors();
        AdVista24_startAlphabeticalMonitors();
        AdVista24_updateData();
    }
}

function AdVista24_startPlatformMonitors() {
    // Inicializa las pantallas adif-infotren-vista-platform calculando el numero de lineas que pueden mostrar de acuerdo a su tamaño.
    // Tambien se aprovecha esta configuración en las pantallas adif-infotren-vista-clock independientes para el tamaño del texto.
    // Tamaño de los elementos:
    // Cabecera hora/producto: 2 líneas
    // Cabecera destino: 3 líneas
    // Pie composición: 2 líneas (opcional)
    // Pie composición con info destinos: 1 línea (opcional)
    // Resto: termómetro paradas
    // Asigna el tamaño de la letra en función del alto del monitor
    // Se ejecuta al recargar el explorador

    $(".adif-infotren-vista-platform, .adif-infotren-vista-clock").each(function () {
        //Obtenemos el ancho y el alto del <div> del monitor
        let div_height = $(this).get(0).offsetHeight;
        let div_width = $(this).get(0).offsetWidth;

        $(this).attr(
            "style",
            "width: " + div_width + "px; height: " + div_height + "px; font-size: " + div_height + "px;"
        );

        //Obtenemos la relación de aspecto
        let aspect_ratio = div_width / div_height;

        //Para dibujar elementos en el monitor dividimos el monitor verticalmente en un número entero de lineas (screen-rows)
        // de acuerdo a su relación de aspecto. Tambien se guarda el valor no redondeado para dar estilo homogeneo.
        //En un monitor 16:9 que muestra un solo tren se obtienen 18 líneas
        let screen_rows_rounded = Math.ceil((2 * 16) / aspect_ratio);
        let screen_rows_unrounded = (2 * 16) / aspect_ratio;

        $(this).attr("screen-rows", screen_rows_rounded);
        $(this).attr("unrounded-screen-rows", screen_rows_unrounded);
        $(this).attr("aspect-ratio", aspect_ratio);
        $(this).attr("div-height", div_height);
        $(this).attr("div-width", div_width);

        //Borramos contenidos
        $(this).empty();
    });
}

function AdVista24_startListMonitors() {
    // Inicializa las pantallas adif-infotren-vista-arrivals y adif-infotren-vista-departures
    // Calcula el numero de lineas que pueden mostrar de acuerdo a su relación de aspecto
    // Comprueba si hay alertas activas y reserva el espacio para mostrarlas
    // Dibuja la estructura básica (cabecera, espacio de tabla y, si procede, alertas)
    // Se ejecuta al recargar el explorador

    //Los seleccionamos:
    let list_monitors = $(".adif-infotren-vista-departures, .adif-infotren-vista-arrivals");

    //Números de grupo negativos para los monitores que no los declaren
    let unasigned_group = -1;

    //Valores por defecto de group y order
    list_monitors.each(function () {
        if (typeof $(this).attr("group") === "undefined") {
            $(this).attr("group", unasigned_group);
            unasigned_group -= 1;
        }
        if (typeof $(this).attr("order") === "undefined") {
            $(this).attr("order", 1);
        }
    });

    //Ordenamos los monitores por salidas o llegadas, por grupos, y dentro de grupos, por orden
    list_monitors.sort(function (a, b) {
        let a_kind = 0;
        if ($(a).hasClass("adif-infotren-vista-departures")) {
            a_kind = 1;
        }

        let b_kind = 0;
        if ($(b).hasClass("adif-infotren-vista-departures")) {
            b_kind = 1;
        }

        let a_group = parseInt($(a).attr("group"), 10);
        let b_group = parseInt($(b).attr("group"), 10);
        let a_order = parseInt($(a).attr("order"), 10);
        let b_order = parseInt($(b).attr("order"), 10);

        if (a_kind === b_kind) {
            if (a_group === b_group) {
                return a_order - b_order;
            } else {
                return a_group - b_group;
            }
        } else {
            return a_kind - b_kind;
        }
    });

    //Para asignar los valores de primer tren y último tren a cada monitor de forma secuencial
    let train_counter = 0;

    //El contador se reinicia para cada grupo de monitores o cuando pasamos de un grupo de monitores de llegadas a otro de salidas o vicecersa.
    //Valores por defecto para detectar si ha habido algún cambio.
    let last_group = 0;
    let last_class = "departures";

    //El número de filas (num_rows) es siempre en función de las dimensiones de cada monitor
    //Se asigna a cada monitor de forma consecutiva: first-tren = train_counter + 1;  last-train = train_counter + num_rows
    //Excepto en el caso de que se haya declarado el atributo "start-train" en la cabecera del monitor.
    //En ese caso: first-tren = start-train;  last-tren = start-train + num_rows - 1;

    list_monitors.each(function () {
        //Obtenemos el ancho y el alto del <div> del monitor
        let div_height = $(this).get(0).offsetHeight;
        let div_width = $(this).get(0).offsetWidth;
        let aspect_ratio = div_width / div_height;

        $(this).attr("div-height", div_height);
        $(this).attr("div-width", div_width);
        $(this).attr("aspect-ratio", div_width / div_height);

        //Determinamos si hay que mostrar el acceso, la vía, el producto o el número de tren.
        let show_access = $(this).attr("show-access") === "true";
        let show_platform = $(this).attr("show-platform") !== "false";
        let show_product = $(this).attr("show-product") !== "false";
        let show_number = $(this).attr("show-number") !== "false";

        //Por cuestiones de diseño es necesario mantener al menos un campo de los cuatro, por lo que en caso de ocultarlos todos, se mostrará necesariamente platform.
        if (!show_access && !show_product && !show_number) show_platform = true;

        //Determinamos si la lista de trenes es completa o limitada
        let show_all_trains = $(this).attr("show-all-trains") === "true";

        //Determinamos el tamaño de fuente para los anchos de cabecera y el número de trenes a mostrar
        let font_size = 1;

        if ($(this).attr("font-size") === "auto") {
            // Tamaño de fuente automático en móviles y tablets
            if (parseInt($(this).attr("div-height")) > parseInt($(this).attr("div-width"))) {
                // Orientación vertical
                font_size = 2;
            } else {
                // Orientación horizontal
                font_size = 1;
            }
        } else if (typeof $(this).attr("font-size") !== "undefined") {
            font_size = parseInt($(this).attr("font-size"));
            if (font_size < 1) font_size = 1;
            if (font_size > 3) font_size = 3;
        }

        //Consultamos si estamos en un monitor de tipo departures o arrivals
        let monitor_class = "arrivals";
        if ($(this).hasClass("adif-infotren-vista-departures")) {
            monitor_class = "departures";
        }

        //Obtenemos si hay que reservar espacio para mostrar alertas. En caso afirmativo, el código de la primera alerta a mostrar
        let show_alerts = $(this).attr("show-alerts") !== "false";
        let first_alert = 0;

        if (show_alerts && typeof $(this).attr("active-alerts") !== "undefined") {
            show_alerts = $(this).attr("active-alerts") === "true";
            if (typeof $(this).attr("alert-list") !== "undefined") {
                first_alert = $(this).attr("alert-list").split(",")[0];
            } else {
                show_alerts = false;
            }
        } else {
            show_alerts = false;
        }

        //Borramos contenidos
        $(this).empty();

        //Obtenemos el número de filas que tendrá la tabla de trenes (sin incluir la de cabecera)
        let num_rows;
        switch (font_size) {
            case 1: // Tamaño de letra pequeño, en un monitor 16:9 se muestran 9 líneas (8 trenes con cabecera)
                num_rows = Math.round(16 / aspect_ratio) - 1;
                break;
            case 2: // Tamaño de letra normal, en un monitor 16:9 se muestran 8 líneas (7 trenes con cabecera)
                num_rows = Math.round(((16 / 9) * 8) / aspect_ratio) - 1;
                break;
            case 3: // Tamaño de letra grande, en un monitor 16:9 se muestran 7 líneas (6 trenes con cabecera)
                num_rows = Math.round(((16 / 9) * 7) / aspect_ratio) - 1;
                break;
        }

        $(this).attr("rows", num_rows);
        let header_height = 0;
        let table_height = 100;
        let alerts_height = 0;
        let train_row_height = 0;

        // Determinamos la altura relativa de cabecera, tabla y alertas
        if (show_alerts) alerts_height = (aspect_ratio / 16) * 100;
        else alerts_height = 0;

        if ($(this).attr("show-header") === "false") {
            num_rows++;
            train_row_height = 100 / num_rows;
        } else {
            header_height = 100 * (1 / (num_rows + 1));
            table_height = 100 * (num_rows / (num_rows + 1));
            train_row_height = 100 / (num_rows + 1);
        }
        train_row_height = (train_row_height * (100 - alerts_height)) / 100;

        let row_height = 100 / num_rows;

        $(this).attr("train-row-height", train_row_height);

        header_height = ((100 - alerts_height) / 100) * header_height;
        table_height = ((100 - alerts_height) / 100) * table_height;
        if (show_alerts) {
            table_height = table_height + 0.1 * header_height;
            header_height = 0.9 * header_height;
        }

        //Obtenemos los porcentajes de anchura de los elementos de la tabla
        let widths = AdVista24_getListWidths(
            font_size,
            show_access,
            show_platform,
            show_product,
            show_number,
            aspect_ratio,
            0.6 * train_row_height
        );

        $(this).attr(
            "style",
            "width: " +
                div_width +
                "px; height: " +
                div_height +
                "px; font-size: " +
                div_height +
                "px; --header-height: " +
                header_height +
                "%; --table-height: " +
                table_height +
                "%; --row-height: " +
                row_height +
                "%; --alerts-height: " +
                alerts_height +
                "%;"
        );

        // Tamaño absoluto de la fila respecto al contenedor global (en %)
        let abs_row_height = (row_height * table_height) / 100;
        if (show_alerts) abs_row_height = ((100 - alerts_height) / 100) * abs_row_height;

        $(this).attr("abs-row-height", abs_row_height);

        // Iniciamos el contador de tren si cambiamos de tipo de monitor (para empezar de nuevo por el primero)
        // También si hemos pasado de monitores de salidas a monitores de llegadas o vicecersa
        if (monitor_class !== last_class) {
            train_counter = 0;
        } else {
            if (last_group !== parseInt($(this).attr("group"), 10)) {
                train_counter = 0;
            }
        }

        //Asignamos tren inicial y tren final a cada monitor:
        if (typeof $(this).attr("start-train") !== "undefined") {
            //Si se fija el primer tren en la cabecera del monitor:
            $(this).attr("first-train", parseInt($(this).attr("start-train"), 10));
            $(this).attr("last-train", parseInt($(this).attr("start-train"), 10) + num_rows - 1);
            train_counter = parseInt($(this).attr("start-train"), 10) + num_rows - 1;
        } else {
            //Si se fija el primer tren a mostrar de forma automática
            $(this).attr("first-train", train_counter + 1);
            $(this).attr("last-train", train_counter + num_rows);
            train_counter = train_counter + num_rows;
        }

        //Subtítulo de monitor
        let subtitle = "";
        if (typeof $(this).attr("subtitle") !== "undefined") {
            let subtitle_parts = $(this).attr("subtitle").split(":");
            subtitle = $(this).attr("subtitle");

            // Si no existe en la lista de subtítulos se anula, a no ser que sea "station-name"
            if (typeof AdVista24_subtitulos[subtitle_parts[0]] === "undefined" && !subtitle === "station-name") {
                subtitle = "";
            }
        }

        //Idiomas del monitor
        let languages = AdVista24_languages;
        if (typeof $(this).attr("languages") !== "undefined") {
            languages = $(this).attr("languages").split(",");
        }

        if (!($(this).attr("show-header") === "false")) {
            $(this).append(
                AdVista24_headerHTML(monitor_class, languages, widths, show_access, show_platform, subtitle, font_size)
            );
        }

        $(this).append(AdVista24_tableHTML($(this).attr("color-parity"), show_all_trains));

        if (show_alerts) {
            $(this).append(AdVista24_alertsHTML(first_alert));
        }

        // Datos para próxima iteración
        last_group = parseInt($(this).attr("group"), 10);
        last_class = monitor_class;
    });
}

function AdVista24_startAlphabeticalMonitors() {
    // Inicializa las pantallas adif-infotren-vista-alphabetical
    // Calcula el numero de lineas que pueden mostrar de acuerdo a su relación de aspecto
    // Dibuja la estructura básica (cabecera, espacio de tabla)
    // Se ejecuta al recargar el explorador

    //Los seleccionamos:
    let alphabetical_monitors = $(".adif-infotren-vista-alphabetical");

    //Números de grupo negativos para los monitores que no los declaren
    let unasigned_group = -1;

    //Valores por defecto de group y order
    alphabetical_monitors.each(function () {
        if (typeof $(this).attr("group") === "undefined") {
            $(this).attr("group", unasigned_group);
            unasigned_group -= 1;
        }
        if (typeof $(this).attr("order") === "undefined") {
            $(this).attr("order", 1);
        }
    });

    //Ordenamos los monitores por grupos, y dentro de grupos, por orden
    alphabetical_monitors.sort(function (a, b) {
        let a_group = parseInt($(a).attr("group"), 10);
        let b_group = parseInt($(b).attr("group"), 10);
        let a_order = parseInt($(a).attr("order"), 10);
        let b_order = parseInt($(b).attr("order"), 10);

        if (a_group === b_group) {
            return a_order - b_order;
        } else {
            return a_group - b_group;
        }
    });

    //Para asignar los valores de primer tren y última estación a cada monitor de forma secuencial
    let station_counter = 0;

    //El contador se reinicia para cada grupo de monitores.
    //Valor por defecto para detectar si ha habido algún cambio.
    let last_group = 0;

    //El número de filas (num_rows) es siempre en función de las dimensiones de cada monitor
    //Se asigna a cada monitor de forma consecutiva: first-station = station_counter + 1;  last-station = station_counter + num_rows
    //Excepto en el caso de que se haya declarado el atributo "start-station" en la cabecera del monitor.
    //En ese caso: first-station = start-train;  last-station = start-station + num_rows - 1;

    alphabetical_monitors.each(function () {
        //Obtenemos el ancho y el alto del <div> del monitor
        let div_height = $(this).get(0).offsetHeight;
        let div_width = $(this).get(0).offsetWidth;

        $(this).attr("div-height", div_height);
        $(this).attr("div-width", div_width);
        $(this).attr("aspect-ratio", div_width / div_height);

        //El tamaño de la fuente es fijo en la interfaz alphabetical
        let font_size = 1;

        //Obtenemos los porcentajes de anchura de los elementos de la cabecera y de la tabla
        let widths = AdVista24_getAlphabeticalWidths(font_size);

        //Borramos contenidos
        $(this).empty();

        //Obtenemos la relación de aspecto
        let aspect_ratio = div_width / div_height;

        //Obtenemos el número de filas que tendrá la tabla de trenes (sin incluir la de cabecera)
        let num_rows;
        switch (font_size) {
            case 1: // Tamaño de letra pequeño, en un monitor 16:9 se muestran 9 líneas (8 trenes con cabecera)
                num_rows = Math.round(16 / aspect_ratio) - 1;
                break;
            case 2: // Tamaño de letra normal, en un monitor 16:9 se muestran 8 líneas (7 trenes con cabecera)
                num_rows = Math.round(((16 / 9) * 8) / aspect_ratio) - 1;
                break;
            case 3: // Tamaño de letra grande, en un monitor 16:9 se muestran 7 líneas (6 trenes con cabecera)
                num_rows = Math.round(((16 / 9) * 7) / aspect_ratio) - 1;
                break;
        }

        $(this).attr("rows", num_rows);
        let header_height = 0;
        let table_height = 100;

        if ($(this).attr("show-header") === "false") {
            num_rows++;
        } else {
            header_height = 100 * (1 / (num_rows + 1));
            table_height = 100 * (num_rows / (num_rows + 1));
        }

        let row_height = 100 / num_rows;

        $(this).attr(
            "style",
            "width: " +
                div_width +
                "px; height: " +
                div_height +
                "px; font-size: " +
                div_height +
                "px; --header-height: " +
                header_height +
                "%; --table-height: " +
                table_height +
                "%; --row-height: " +
                row_height +
                "%;"
        );

        // Tamaño absoluto de la fila respecto al contenedor global (en %)
        let abs_row_height = (row_height * table_height) / 100;

        $(this).attr("abs-row-height", abs_row_height);

        // Iniciamos el contador de estaciones si cambiamos de grupo (para volver a empezar por la primera)
        if (last_group !== parseInt($(this).attr("group"), 10)) {
            station_counter = 0;
        }

        //Asignamos estacion inicial y estacion final a cada monitor:
        if (typeof $(this).attr("start-station") !== "undefined") {
            //Si se fija el primer tren en la cabecera del monitor:
            $(this).attr("first-station", parseInt($(this).attr("start-station"), 10));
            $(this).attr("last-station", parseInt($(this).attr("start-station"), 10) + num_rows - 1);
            station_counter = parseInt($(this).attr("start-station"), 10) + num_rows - 1;
        } else {
            //Si se fija el primer tren a mostrar de forma automática
            $(this).attr("first-station", station_counter + 1);
            $(this).attr("last-station", station_counter + num_rows);
            station_counter = station_counter + num_rows;
        }

        //Logotipo de red del monitor
        let network = "";
        if (typeof $(this).attr("alphabetical-network") !== "undefined") {
            network = $(this).attr("alphabetical-network");
        }

        //Idiomas del monitor
        let languages = AdVista24_languages;
        if (typeof $(this).attr("languages") !== "undefined") {
            languages = $(this).attr("languages").split(",");
        }

        if (!($(this).attr("show-header") === "false")) {
            $(this).append(AdVista24_headerHTML("alphabetical", languages, widths, false, false, network, font_size));
        }

        $(this).append(AdVista24_alphabeticalTableHTML($(this).attr("color-parity")));

        // Datos para próxima iteración
        last_group = parseInt($(this).attr("group"), 10);
    });

    AdVista24_cssEffects();
}

async function AdVista24_updateData() {
    try {
        // Solicitamos nuevos datos de trenes
        if (AdVista24_get_console_log) AdVista24_consoleLog("Solicitando nuevos datos");
        let json_station_data = await AdVista24_getStationJSON(AdVista24_station);
        if (AdVista24_get_console_log) AdVista24_consoleLog("Nuevos datos recibidos");
        AdVista24_trains_data = $.parseJSON(json_station_data.trim());

        if (AdVista24_get_console_log)
            AdVista24_consoleLog("Fecha de emisión del JSON: " + AdVista24_trains_data.station_settings.data_time);
        if (AdVista24_get_console_log)
            AdVista24_consoleLog("Estacion de emisión del JSON: " + AdVista24_trains_data.station_settings.name);
        if (AdVista24_get_console_log)
            AdVista24_consoleLog("Número de trenes recibidos: " + Object.keys(AdVista24_trains_data.trains).length);
        if (AdVista24_get_console_log)
            AdVista24_consoleLog(
                "Número de estaciones recibidas: " + Object.keys(AdVista24_trains_data.stations).length
            );

        // AdVista24_trains_data = json_station_data;
        AdVista24_station_list = AdVista24_trains_data.stations;

        if (typeof AdVista24_trains_data.multimedia_info === "undefined") {
            if (typeof AdVista24_trains_data.line_colors !== "undefined") {
                AdVista24_line_colors = AdVista24_trains_data.line_colors;
            }
        } else if (typeof AdVista24_trains_data.multimedia_info.line_colors !== "undefined") {
            AdVista24_line_colors = AdVista24_trains_data.multimedia_info.line_colors;
        }

        if (typeof AdVista24_trains_data.multimedia_info !== "undefined") {
            if (typeof AdVista24_trains_data.multimedia_info.product_pic_filenames === "undefined")
                AdVista24_trains_data.multimedia_info.product_pic_filenames = [];
            if (typeof AdVista24_trains_data.multimedia_info.line_pic_filenames === "undefined")
                AdVista24_trains_data.multimedia_info.line_pic_filenames = [];
        } else {
            AdVista24_trains_data.multimedia_info = [];
            AdVista24_trains_data.multimedia_info.product_pic_filenames = [];
            AdVista24_trains_data.multimedia_info.line_pic_filenames = [];
        }

        // Idiomas de la estación
        if (typeof AdVista24_trains_data.station_settings.languages !== "undefined") {
            if (!AdVista24_arraysAreEqual(AdVista24_languages, AdVista24_trains_data.station_settings.languages)) {
                AdVista24_languages = AdVista24_trains_data.station_settings.languages;
            }
        }

        // Nombre de la estación
        if (typeof AdVista24_trains_data.station_settings.name !== "undefined") {
            AdVista24_station_name = AdVista24_trains_data.station_settings.name;
        }

        // Tipos de tráfico estimados y tráficos en cuenta atrás
        if (typeof AdVista24_trains_data.station_settings.estimated_time_traffics !== "undefined") {
            if (
                !AdVista24_arraysAreEqual(
                    AdVista24_default_estimated_time_traffics,
                    AdVista24_trains_data.station_settings.estimated_time_traffics
                )
            ) {
                AdVista24_default_estimated_time_traffics =
                    AdVista24_trains_data.station_settings.estimated_time_traffics;
            }
        }
        if (typeof AdVista24_trains_data.station_settings.countdown_traffics !== "undefined") {
            if (
                !AdVista24_arraysAreEqual(
                    AdVista24_default_countdown_traffics,
                    AdVista24_trains_data.station_settings.countdown_traffics
                )
            ) {
                AdVista24_default_countdown_traffics = AdVista24_trains_data.station_settings.countdown_traffics;
            }
        }

        // Modo de sectorización
        if (typeof AdVista24_trains_data.station_settings.sectorization_mode !== "undefined") {
            AdVista24_default_sectorization_mode = AdVista24_trains_data.station_settings.sectorization_mode;
        }

        // Alertas. Ordenadas por id. El id se codifica URI porque sus distintos valores se guardarán separados por comas
        AdVista24_alerts = [...(AdVista24_trains_data.station_alerts || [])];
        AdVista24_alerts = AdVista24_alerts.filter((alert) => alert.id !== undefined);
        AdVista24_alerts.forEach((alert) => {
            alert.id = encodeURIComponent(alert.id);
        });

        // Comprobamos caducidad de los datos:
        AdVista24_data_expiration_check(false);

        AdVista24_updateMonitors();
    } catch (error) {
        console.error(error.message);
        console.error(error.stack);
    }
}

function AdVista24_updateMonitors() {
    if (AdVista24_get_console_log) AdVista24_consoleLog("Actualizando monitores");

    let restart_list_monitors = false;

    // Actualización interfaces platform
    $(".adif-infotren-vista-platform").each(function () {
        let this_monitor = $(this);

        let platform_location = [];
        if (typeof this_monitor.attr("platform-location") !== "undefined") {
            if (this_monitor.attr("platform-location") !== "")
                platform_location = this_monitor.attr("platform-location").split(",");
        }

        let platform_location_forward_left = [];
        if (typeof this_monitor.attr("platform-location-forward-left") !== "undefined") {
            platform_location_forward_left = this_monitor.attr("platform-location-forward-left").split(",");
            platform_location.push(...platform_location_forward_left);
        }

        let platform_location_left = [];
        if (typeof this_monitor.attr("platform-location-left") !== "undefined") {
            platform_location_left = this_monitor.attr("platform-location-left").split(",");
            platform_location.push(...platform_location_left);
        }

        let platform_location_forward_right = [];
        if (typeof this_monitor.attr("platform-location-forward-right") !== "undefined") {
            platform_location_forward_right = this_monitor.attr("platform-location-forward-right").split(",");
            platform_location.push(...platform_location_forward_right);
        }

        let platform_location_right = [];
        if (typeof this_monitor.attr("platform-location-right") !== "undefined") {
            platform_location_right = this_monitor.attr("platform-location-right").split(",");
            platform_location.push(...platform_location_right);
        }

        let sector_location = [];
        if (typeof this_monitor.attr("sector-location") !== "undefined") {
            if (this_monitor.attr("sector-location") !== "")
                sector_location = this_monitor.attr("sector-location").split(",");
        }

        let access_location = [];
        if (typeof this_monitor.attr("access-location") !== "undefined") {
            if (this_monitor.attr("access-location") !== "")
                access_location = this_monitor.attr("access-location").split(",");
        }

        let show_platform_sign = false;
        if (typeof this_monitor.attr("show-platform-sign") !== "undefined") {
            show_platform_sign = this_monitor.attr("show-platform-sign") === "true";
        }

        let show_composition = true;
        if (typeof this_monitor.attr("show-composition") !== "undefined") {
            show_composition = this_monitor.attr("show-composition") !== "false";
        }

        let show_observation = true;
        if (typeof this_monitor.attr("show-observation") !== "undefined") {
            show_observation = this_monitor.attr("show-observation") !== "false";
        }

        let pin_position = [];
        if (typeof this_monitor.attr("pin-position") !== "undefined") {
            pin_position = this_monitor.attr("pin-position").split(",");
        }

        let pin_style = [];
        if (typeof this_monitor.attr("pin-style") !== "undefined") {
            pin_style = this_monitor.attr("pin-style").split(",");
        }

        let sectorization_mode = "";
        if (typeof this_monitor.attr("sectorization-mode") !== "undefined") {
            sectorization_mode = this_monitor.attr("sectorization-mode");
        }

        //Comprobación de datos correctos y coherencia en pin-position y pin-style
        if (pin_style.length === 0 && pin_position.length > 0) {
            //Si no se indica pin_style, se pasa solo el primer valor de pin_position con estilo "pin"
            pin_style = ["pin"];
            pin_position = pin_position.slice(0, 1);
        } else if (pin_position.length > pin_style.length) {
            //Si hay más elementos de pin_position que de pin_style, se elimina el exceso
            pin_position = pin_position.slice(0, pin_style.length);
        } else if (pin_style.length > pin_position.length) {
            //Si hay más elementos de pin_style que de pin_position, se elimina el exceso
            pin_style = pin_style.slice(0, pin_position);
        }

        let countdown_traffics = AdVista24_default_countdown_traffics;
        if (typeof $(this).attr("countdown-traffics") !== "undefined") {
            countdown_traffics = $(this).attr("countdown-traffics").split(",");
        }

        let platform_arrangement = "ascending";
        if (this_monitor.attr("platform-arrangement") === "descending") {
            platform_arrangement = "descending";
        }

        let sectors_highlight = true;
        if (this_monitor.attr("sectors-highlight") === "false") {
            sectors_highlight = false;
        }

        let estimated_time_traffics = AdVista24_default_estimated_time_traffics;
        if (typeof $(this).attr("estimated-time-traffics") !== "undefined") {
            estimated_time_traffics = $(this).attr("estimated-time-traffics").split(",");
        }

        let platform_trigger = "announced";
        if (typeof this_monitor.attr("platform-trigger") !== "undefined") {
            platform_trigger = this_monitor.attr("platform-trigger");
        }
        if (platform_trigger !== "announced" && platform_trigger !== "check-in" && platform_trigger !== "next") {
            platform_trigger = "announced";
        }

        let platform_trigger_time = 15;
        if (typeof this_monitor.attr("platform-trigger-time") !== "undefined") {
            platform_trigger_time = parseInt(this_monitor.attr("platform-trigger-time"));
        }

        let anti_burn_in = true;
        if (this_monitor.attr("anti-burn-in") !== "true") {
            anti_burn_in = false;
        }

        let show_closed_check_in = false;
        if (this_monitor.attr("show-closed-check-in") === "true") {
            show_closed_check_in = true;
        }

        let show_alighting_only = true;
        if (this_monitor.attr("show-alighting-only") !== "true") {
            show_alighting_only = false;
        }

        // Idiomas del monitor (tiene preferencia el atributo en HTML sobre los datos de JSON o valor por defecto)
        let languages = AdVista24_languages;
        if (typeof $(this).attr("languages") !== "undefined") {
            languages = $(this).attr("languages").split(",");
        }

        // Obtención de la plantilla de sustitucion
        let substitution_class = "adif-infotren-vista-clock";
        if (typeof this_monitor.attr("if-no-trains") !== "undefined") {
            substitution_class = this_monitor.attr("if-no-trains");
            if (substitution_class === "arrivals") substitution_class = "adif-infotren-vista-arrivals";
            else if (substitution_class === "departures") substitution_class = "adif-infotren-vista-departures";
            else if (substitution_class === "clock") substitution_class = "adif-infotren-vista-clock";
            else if (substitution_class === "black") substitution_class = "adif-infotren-vista-black";
            else if (substitution_class === "number") substitution_class = "adif-infotren-vista-number";
            else if (substitution_class === "collapse") substitution_class = "adif-infotren-vista-collapse";
        }

        // Configuración resumida de atributos (platform-mode)
        // Solo si no se han establecido directamente los atributos
        if (typeof this_monitor.attr("platform-mode") !== "undefined") {
            switch (this_monitor.attr("platform-mode")) {
                case "access":
                    if (typeof this_monitor.attr("show-platform-sign") === "undefined") show_platform_sign = true;
                    if (typeof this_monitor.attr("if-no-trains") === "undefined")
                        substitution_class = "adif-infotren-vista-number";
                    if (typeof this_monitor.attr("platform-trigger") === "undefined") platform_trigger = "announced";
                    if (typeof this_monitor.attr("show-closed-check-in") === "undefined") show_closed_check_in = false;
                    if (typeof this_monitor.attr("show-alighting-only") === "undefined") show_alighting_only = false;
                    break;
                case "check-in":
                    if (typeof this_monitor.attr("show-platform-sign") === "undefined") show_platform_sign = true;
                    if (typeof this_monitor.attr("if-no-trains") === "undefined")
                        substitution_class = "adif-infotren-vista-number";
                    if (typeof this_monitor.attr("platform-trigger") === "undefined") platform_trigger = "check-in";
                    if (typeof this_monitor.attr("show-closed-check-in") === "undefined") show_closed_check_in = true;
                    if (typeof this_monitor.attr("show-alighting-only") === "undefined") show_alighting_only = false;
                    break;
                case "platform":
                    if (typeof this_monitor.attr("show-platform-sign") === "undefined") show_platform_sign = false;
                    if (typeof this_monitor.attr("if-no-trains") === "undefined")
                        substitution_class = "adif-infotren-vista-clock";
                    if (typeof this_monitor.attr("platform-trigger") === "undefined") platform_trigger = "announced";
                    if (typeof this_monitor.attr("show-closed-check-in") === "undefined") show_closed_check_in = false;
                    if (typeof this_monitor.attr("show-alighting-only") === "undefined") show_alighting_only = true;
                    break;
            }
        }

        // Indicamos los tipos de paradas que se pueden visualizar en la interfaz para aplicarlas a los filtros
        let platform_monitor_stop_classes = ["intermediate", "origin", "boarding_only", "alighting_only"];
        if (!show_alighting_only) platform_monitor_stop_classes = ["intermediate", "origin", "boarding_only"];

        //Lista de trenes ordenados por vías declaradas
        let platform_trains = [...AdVista24_trains_data.trains];

        platform_trains = platform_trains.sort(AdVista24_ordenarTrenesNumeroVia(platform_location));

        //Contador de trenes a pintar en el monitor
        let total_trains = 0;
        let show_platform_side_left = false;
        let show_platform_side_right = false;

        //Contamos los trenes a pintar en total y comprobamos si va a ser necesario reservar espacio para indicar flechas laterales (platform_side)

        platform_trains.forEach(function (train) {
            if (
                AdVista24_filtroTrenes(
                    "departures",
                    train,
                    platform_monitor_stop_classes,
                    [],
                    [],
                    [],
                    [],
                    [],
                    [],
                    access_location,
                    [],
                    platform_location,
                    [],
                    [],
                    [],
                    [],
                    [],
                    sector_location
                )
            ) {
                if (announceTrain(train, platform_trigger, platform_trigger_time)) {
                    total_trains++;

                    //Determinamos si representamos platform_side
                    if (platform_location_left.some((platf) => train.platform_locations.includes(platf))) {
                        show_platform_side_left = true;
                    } else if (platform_location_right.some((platf) => train.platform_locations.includes(platf))) {
                        show_platform_side_right = true;
                    } else if (
                        platform_location_forward_left.some((platf) => train.platform_locations.includes(platf))
                    ) {
                        show_platform_side_left = true;
                    } else if (
                        platform_location_forward_right.some((platf) => train.platform_locations.includes(platf))
                    ) {
                        show_platform_side_right = true;
                    }
                }
            }
        });

        let row_index = 0;

        if (total_trains === 0) {
            //Si no hay trenes que mostrar activamos la pantalla de sustitución:
            if (AdVista24_get_console_log)
                AdVista24_consoleLog("No hay trenes a mostrar en monitor " + this_monitor.attr("id"));

            // Plantillas de sustitución anti-burn-in
            if (anti_burn_in) {
                let now_time = new Date();
                let now_hour = now_time.getHours();

                if (now_hour >= 1 && now_hour < 5) {
                    if (substitution_class === "adif-infotren-vista-number")
                        substitution_class = "adif-infotren-vista-black-number";
                    if (substitution_class === "adif-infotren-vista-clock")
                        substitution_class = "adif-infotren-vista-black-clock";
                }
            }

            // Si la clase de sustitucion no estaba previament activada, borramos contenidos y activamos
            if (!this_monitor.hasClass(substitution_class)) {
                this_monitor.empty();
                this_monitor.addClass(substitution_class);
                if (
                    substitution_class === "adif-infotren-vista-departures" ||
                    substitution_class === "adif-infotren-vista-arrivals"
                ) {
                    //Si se va a poner un monitor de lista de sustitucion hay que recalcular los parametros necesarios de los monitores de lista de la pantalla
                    //boleano para proceder a hacerlo una vez examinados todos los platform monitores
                    restart_list_monitors = true;
                }
            }
            // Eliminamos las clases que no correspondan cuando hay opciones anti-burn-in
            if (substitution_class === "adif-infotren-vista-number")
                this_monitor.removeClass("adif-infotren-vista-black-number");
            if (substitution_class === "adif-infotren-vista-black-number")
                this_monitor.removeClass("adif-infotren-vista-number");
            if (substitution_class === "adif-infotren-vista-clock")
                this_monitor.removeClass("adif-infotren-vista-black-clock");
            if (substitution_class === "adif-infotren-vista-black-clock")
                this_monitor.removeClass("adif-infotren-vista-clock");
        } else {
            //Si hay trenes que mostrar
            //Eliminamos las posibles clases de sustitucion
            this_monitor.removeClass("adif-infotren-vista-black");
            this_monitor.removeClass("adif-infotren-vista-clock");
            this_monitor.removeClass("adif-infotren-vista-arrivals");
            this_monitor.removeClass("adif-infotren-vista-departures");
            this_monitor.removeClass("adif-infotren-vista-number");
            this_monitor.removeClass("adif-infotren-vista-black-number");
            this_monitor.removeClass("adif-infotren-vista-black-clock");
            this_monitor.removeClass("adif-infotren-vista-collapse");

            //Si el número de trenes mostrados ha cambiado repintamos la pantalla de cero
            if (parseInt($(this).attr("total-trains")) !== total_trains) {
                //Borrado de contenido
                this_monitor.html("");
            }

            //Si el número de trenes a mostrar es mayor que 1, mostramos el símbolo de vía
            if (total_trains > 1) show_platform_sign = true;

            platform_trains.forEach(function (train) {
                if (
                    AdVista24_filtroTrenes(
                        "departures",
                        train,
                        platform_monitor_stop_classes,
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        access_location,
                        [],
                        platform_location,
                        [],
                        [],
                        [],
                        [],
                        [],
                        sector_location
                    )
                ) {
                    if (announceTrain(train, platform_trigger, platform_trigger_time)) {
                        //Determinamos platform_side
                        let platform_side = undefined;
                        if (platform_location_left.some((platf) => train.platform_locations.includes(platf))) {
                            platform_side = "left";
                        } else if (platform_location_right.some((platf) => train.platform_locations.includes(platf))) {
                            platform_side = "right";
                        } else if (
                            platform_location_forward_left.some((platf) => train.platform_locations.includes(platf))
                        ) {
                            platform_side = "forward-left";
                        } else if (
                            platform_location_forward_right.some((platf) => train.platform_locations.includes(platf))
                        ) {
                            platform_side = "forward-right";
                        }

                        let checked = false;
                        row_index++;

                        while (!checked) {
                            let this_row = this_monitor.find(".platform-train").slice(row_index - 1, row_index);
                            let this_train = AdVista24_platformTrainHTML(
                                train,
                                AdVista24_trains_data.station_settings.platforms,
                                total_trains,
                                this_monitor.attr("screen-rows"),
                                show_platform_sign,
                                platform_side,
                                show_platform_side_left,
                                show_platform_side_right,
                                show_composition,
                                show_observation,
                                pin_position,
                                pin_style,
                                countdown_traffics,
                                estimated_time_traffics,
                                platform_arrangement,
                                sectors_highlight,
                                show_closed_check_in,
                                languages,
                                this_monitor.attr("aspect-ratio"),
                                sectorization_mode
                            );

                            //Si no existe la fila (fila vacía), creamos el tren
                            if (typeof this_row.html() === "undefined") {
                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Creamos tren id: " +
                                            this_train.attr("train-id") +
                                            " / " +
                                            this_train.find(".train-commercial-id").attr("check-value")
                                    );
                                this_monitor.append(this_train);
                                checked = true;
                            } else {
                                // Existe ya un tren, comprobamos si es el mismo
                                if (this_row.attr("train-id") === this_train.attr("train-id")) {
                                    //Mismo tren, actualizamos los datos
                                    let full_change = false;
                                    if (AdVista24_get_console_log)
                                        AdVista24_consoleLog(
                                            "Actualizamos tren id: " +
                                                this_train.attr("train-id") +
                                                " / " +
                                                this_train.find(".train-commercial-id").attr("check-value")
                                        );
                                    //Activa reemplazo total de tren en caso de aparición/desaparición de observación
                                    if (
                                        this_row.find(".platform-info").attr("check-value") !==
                                        this_train.find(".platform-info").attr("check-value")
                                    ) {
                                        if (
                                            typeof this_row.find(".platform-info").attr("check-value") ===
                                                "undefined" ||
                                            typeof this_train.find(".platform-info").attr("check-value") === "undefined"
                                        ) {
                                            full_change = true;
                                        }
                                    }

                                    //Activa reemplazo total de tren en caso de aparición/desaparición de composición/acceso-cerrado
                                    if (
                                        this_row
                                            .find(".train-composition, .train-closed-check-in")
                                            .attr("check-value") !==
                                        this_train
                                            .find(".train-composition, .train-closed-check-in")
                                            .attr("check-value")
                                    ) {
                                        if (
                                            typeof this_row
                                                .find(".train-composition, .train-closed-check-in")
                                                .attr("check-value") === "undefined" ||
                                            typeof this_train
                                                .find(".train-composition, .train-closed-check-in")
                                                .attr("check-value") === "undefined"
                                        ) {
                                            full_change = true;
                                        }
                                    }

                                    //Activa reemplazo total de tren en caso de aparición/desaparición de plantilla de "no admite viajeros"
                                    if (
                                        this_row.hasClass("platform-train-alighting-only") !==
                                        this_train.hasClass("platform-train-alighting-only")
                                    ) {
                                        full_change = true;
                                    }

                                    if (full_change) {
                                        //Reemplazo de todo el contenido
                                        this_row.replaceWith(this_train);
                                    } else {
                                        //Actualización de otros valores de cabecera (cambia toda la cabecera)
                                        if (
                                            this_row.find(".train-direction").attr("check-value") !==
                                                this_train.find(".train-direction").attr("check-value") ||
                                            this_row.find(".train-commercial-id").attr("check-value") !==
                                                this_train.find(".train-commercial-id").attr("check-value") ||
                                            this_row.find(".train-platform").attr("check-value") !==
                                                this_train.find(".train-platform").attr("check-value") ||
                                            this_row.find(".train-accessible-sign").length !==
                                                this_train.find(".train-accessible-sign").length
                                        ) {
                                            this_row
                                                .find(".platform-header")
                                                .replaceWith(this_train.find(".platform-header"));
                                        } else {
                                            // Actualización de valores sueltos de cabecera

                                            //Actualización de train-time
                                            if (
                                                this_row.find(".train-time").attr("check-value") !==
                                                this_train.find(".train-time").attr("check-value")
                                            ) {
                                                this_row
                                                    .find(".train-time")
                                                    .replaceWith(this_train.find(".train-time"));
                                            }
                                        }

                                        // //Actualización de train-status
                                        // if (
                                        //     this_row.find(".train-status").attr("check-value") !==
                                        //     this_train.find(".train-status").attr("check-value")
                                        // ) {
                                        //     this_row
                                        //         .find(".train-status")
                                        //         .replaceWith(this_train.find(".train-status"));
                                        // }

                                        //Actualización de horizontal-journey
                                        if (
                                            this_row.find(".train-horizontal-journey").attr("check-value") !==
                                            this_train.find(".train-horizontal-journey").attr("check-value")
                                        ) {
                                            this_row
                                                .find(".train-horizontal-journey")
                                                .replaceWith(this_train.find(".train-horizontal-journey"));
                                        }
                                        //Actualización de vertical-journey
                                        if (
                                            this_row.find(".train-vertical-journey").attr("check-value") !==
                                            this_train.find(".train-vertical-journey").attr("check-value")
                                        ) {
                                            this_row
                                                .find(".train-vertical-journey")
                                                .replaceWith(this_train.find(".train-vertical-journey"));
                                        }

                                        //Actualización de platform-info
                                        if (
                                            this_row.find(".platform-info").attr("check-value") !==
                                            this_train.find(".platform-info").attr("check-value")
                                        ) {
                                            this_row
                                                .find(".platform-info")
                                                .replaceWith(this_train.find(".platform-info"));
                                        }

                                        //Actualización de composition
                                        if (
                                            this_row
                                                .find(".train-composition, .train-closed-check-in")
                                                .attr("check-value") !==
                                            this_train
                                                .find(".train-composition, .train-closed-check-in")
                                                .attr("check-value")
                                        ) {
                                            this_row
                                                .find(".train-composition, .train-closed-check-in")
                                                .replaceWith(
                                                    this_train.find(".train-composition, .train-closed-check-in")
                                                );
                                        }
                                    }

                                    checked = true;
                                } else {
                                    //No coincide el tren a pintar con el pintado.

                                    //Comprobamos si el tren pintado continua vigente en la lista
                                    let old_train_index = platform_trains.findIndex(
                                        (train) => String(train.id) === this_row.attr("train-id")
                                    );

                                    if (old_train_index === -1) {
                                        if (AdVista24_get_console_log)
                                            AdVista24_consoleLog(
                                                "Eliminamos tren id: " +
                                                    this_row.attr("train-id") +
                                                    " / " +
                                                    this_row.find(".train-commercial-id").attr("check-value")
                                            );
                                        //El tren pintado en la fila se ha borrado o desactivado. Borramos el tren y reiniciamos análisis fila
                                        this_row.remove();
                                        checked = false;
                                        continue;
                                    }

                                    //Comprobamos si el tren a pintar es nuevo (no estaba en la lista)
                                    let new_train_row = this_monitor
                                        .find(".platform-train[train-id='" + train.id + "']")
                                        .first();
                                    if (new_train_row.length === 0) {
                                        //El tren a pintar es nuevo en la lista (por creacción o reordenación)
                                        //Añadimos la nueva fila antes del elemento actual y seguimos prceso
                                        if (AdVista24_get_console_log)
                                            AdVista24_consoleLog(
                                                "Añadimos tren id: " +
                                                    this_train.attr("train-id") +
                                                    " / " +
                                                    this_train.find(".train-commercial-id").attr("check-value")
                                            );
                                        this_row.before(this_train);
                                        checked = true;

                                        continue;
                                    } else {
                                        //El tren a pintar existe en otra posición, lo movemos a la fila actual y reiniciamos análisis
                                        if (AdVista24_get_console_log)
                                            AdVista24_consoleLog(
                                                "Reordenamos tren id: " +
                                                    this_train.attr("train-id") +
                                                    " / " +
                                                    this_train.find(".train-commercial-id").attr("check-value")
                                            );
                                        checked = false;
                                        new_train_row.insertBefore(this_row);
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        $(this).attr("total-trains", total_trains);
        //Eliminar filas por enicima de capacidad
        $(this).find(".platform-train").slice(row_index).remove();

        function announceTrain(train, platform_trigger, platform_trigger_time) {
            // Indica si debe anunciarse ya el tren en teleindicadores/monitores de andén o checkín

            // Debe ser siempre el primero por el andén
            if (!train.next_on_platform) return false;

            let trigger = false;

            switch (platform_trigger) {
                case "announced":
                    // En modo anunciado, se anuncia si se ha emitido mensaje por megafonía
                    trigger = train.announced;
                    break;
                case "check-in":
                    // En modo check-in, se anuncia si ya se ha abierto el check-in o se ha anunciado
                    if (typeof train.check_in === "undefined") train.check_in = "none";
                    trigger = train.announced || train.check_in === "open" || train.check_in === "closed";
                    break;
                case "next":
                    // En modo siguiente, se anuncia el primer tren a pasar por la vía
                    trigger = true;

                    break;
            }

            // Si no se cumplen las condiciones del disparador, se mostrará el tren
            // si faltan menos minutos para la llegada que el atributo tiempo de disprador.
            if (!trigger && platform_trigger_time > 0) {
                trigger = AdVista24_minutesToArrival(train) <= platform_trigger_time;
            }

            return trigger;
        }
    });

    // Actualización interfaces departures y arrivals
    $(".adif-infotren-vista-departures, .adif-infotren-vista-arrivals").each(function () {
        //Consultamos si estamos en un monitor de tipo departures o arrivals y si estamos en modo cuenta atrás
        let monitor_class = "departures";
        let countdown_active = false;
        let countdown_traffics = [];
        if ($(this).hasClass("adif-infotren-vista-departures")) {
            if ($(this).attr("countdown") === "true") {
                countdown_active = true;
                if (typeof $(this).attr("countdown-traffics") !== "undefined") {
                    countdown_traffics = $(this).attr("countdown-traffics").split(",");
                } else {
                    countdown_traffics = AdVista24_default_countdown_traffics;
                }
            }
        } else {
            monitor_class = "arrivals";
        }

        //Determinamos si hay que mostrar el acceso, la vía, el producto o el número de tren.
        let show_access = $(this).attr("show-access") === "true";
        let show_platform = $(this).attr("show-platform") !== "false";
        let show_product = $(this).attr("show-product") !== "false";
        let show_number = $(this).attr("show-number") !== "false";

        //Determinamos si la lista de trenes es completa o limitada
        let show_all_trains = $(this).attr("show-all-trains") === "true";

        //Determinamos si deben mostrarse vías previas
        let show_platform_preview = $(this).attr("show-platform-preview") !== "false";

        //Por cuestiones de diseño es necesario mantener al menos un campo de los cuatro, por lo que en caso de ocultarlos todos, se mostrará necesariamente platform.
        if (!show_access && !show_product && !show_number) show_platform = true;

        //Determinamos el tamaño de fuente para los anchos de cabecera y el número de trenes a mostrar
        let font_size = 1;
        if ($(this).attr("font-size") === "auto") {
            // Tamaño de fuente automático en móviles y tablets
            if (parseInt($(this).attr("div-height")) > parseInt($(this).attr("div-width"))) {
                // Orientación vertical
                font_size = 3;
            } else {
                // Orientación horizontal
                font_size = 2;
            }
        } else if (typeof $(this).attr("font-size") !== "undefined") {
            font_size = parseInt($(this).attr("font-size"));
            if (font_size < 1) font_size = 1;
            if (font_size > 3) font_size = 3;
        }

        let this_monitor = $(this);

        //Filtros para monitores de salidas y llegadas
        let traffic_filter = [];
        if (typeof $(this).attr("traffic-filter") !== "undefined") {
            traffic_filter = $(this).attr("traffic-filter").split(",");
        }

        let traffic_include = [];
        if (typeof $(this).attr("traffic-include") !== "undefined") {
            traffic_include = $(this).attr("traffic-include").split(",");
        }

        let company_filter = [];
        if (typeof $(this).attr("company-filter") !== "undefined") {
            company_filter = $(this).attr("company-filter").split(",");
        }

        let company_include = [];
        if (typeof $(this).attr("company-include") !== "undefined") {
            company_include = $(this).attr("company-include").split(",");
        }

        let product_filter = [];
        if (typeof $(this).attr("product-filter") !== "undefined") {
            product_filter = $(this).attr("product-filter").split(",");
        }

        let product_include = [];
        if (typeof $(this).attr("product-include") !== "undefined") {
            product_include = $(this).attr("product-include").split(",");
        }

        let access_filter = [];
        if (typeof $(this).attr("access-filter") !== "undefined") {
            access_filter = $(this).attr("access-filter").split(",");
        }

        let access_include = [];
        if (typeof $(this).attr("access-include") !== "undefined") {
            access_include = $(this).attr("access-include").split(",");
        }

        let platform_filter = [];
        if (typeof $(this).attr("platform-filter") !== "undefined") {
            platform_filter = $(this).attr("platform-filter").split(",");
        }

        let platform_include = [];
        if (typeof $(this).attr("platform-include") !== "undefined") {
            platform_include = $(this).attr("platform-include").split(",");
        }

        let stop_filter = [];
        if (typeof $(this).attr("stop-filter") !== "undefined") {
            stop_filter = $(this).attr("stop-filter").split(",");
        }

        let stop_include = [];
        if (typeof $(this).attr("stop-include") !== "undefined") {
            stop_include = $(this).attr("stop-include").split(",");
        }

        let custom_filter = [];
        if (typeof $(this).attr("custom-filter") !== "undefined") {
            custom_filter = $(this).attr("custom-filter").split(",");
        }

        let custom_include = [];
        if (typeof $(this).attr("custom-include") !== "undefined") {
            custom_include = $(this).attr("custom-include").split(",");
        }

        let journey_scroll = "X";
        if (typeof $(this).attr("journey-scroll") !== "undefined") {
            journey_scroll = $(this).attr("journey-scroll");
        }

        let observation_scroll = "X";
        if (typeof $(this).attr("observation-scroll") !== "undefined") {
            observation_scroll = $(this).attr("observation-scroll");
        }

        let estimated_time_traffics = AdVista24_default_estimated_time_traffics;
        if (typeof $(this).attr("estimated-time-traffics") !== "undefined") {
            estimated_time_traffics = $(this).attr("estimated-time-traffics").split(",");
        }

        let max_show_stops = -1;
        if (typeof $(this).attr("max-show-stops") !== "undefined") {
            max_show_stops = ~~$(this).attr("max-show-stops");
        }

        let platform_routing = {};
        if (typeof this_monitor.attr("platform-routing") !== "undefined") {
            this_monitor
                .attr("platform-routing")
                .split(",")
                .forEach((plr) => {
                    let [plr_num, plr_route] = plr.split(":");
                    platform_routing[plr_num] = plr_route;
                });
        }

        let sectorization_mode = "";
        if (typeof this_monitor.attr("sectorization-mode") !== "undefined") {
            sectorization_mode = this_monitor.attr("sectorization-mode");
        }

        //Obtenemos si deben mostrarse alertas
        let previous_active_alerts = false;
        if (typeof $(this).attr("active-alerts") !== "undefined") {
            previous_active_alerts = $(this).attr("active-alerts") === "true";
        }

        let filtered_alerts = AdVista24_filtroAlertas(
            AdVista24_alerts,
            traffic_filter,
            traffic_include,
            company_filter,
            company_include,
            product_filter,
            product_include,
            access_filter,
            access_include,
            platform_filter,
            platform_include
        );
        let alert_list = filtered_alerts.map((alert) => alert.id).join(",");

        let active_alerts = filtered_alerts.length > 0;

        $(this).attr("active-alerts", active_alerts);
        $(this).attr("alert-list", alert_list);

        // En caso de que antes hubiera alertas y ahora no, o antes no hubiera y ahora sí, deben resetearse los monitores
        // para reajustar los espacios de la pantalla.
        if (previous_active_alerts !== active_alerts) {
            restart_list_monitors = true;
        }

        // Obtenemos el ancho de las columnas en función de los campos deseados y el resto de parámetros
        let train_row_height = $(this).attr("train-row-height");
        let widths = AdVista24_getListWidths(
            font_size,
            show_access,
            show_platform,
            show_product,
            show_number,
            $(this).attr("aspect-ratio"),
            0.6 * train_row_height
        );

        //Subtítulo de monitor
        let subtitle = "";
        if (typeof $(this).attr("subtitle") !== "undefined") {
            let subtitle_parts = $(this).attr("subtitle").split(":");
            subtitle = $(this).attr("subtitle");

            // Si no existe en la lista de subtítulos se anula, a no ser que sea "station-name"
            if (typeof AdVista24_subtitulos[subtitle_parts[0]] === "undefined" && subtitle !== "station-name") {
                subtitle = "";
            }
        }

        // Elementos cuya variación requiere regenerar la cabecera o la tabla
        let replace_header = false;
        let replace_train_table = false;

        // Idiomas del monitor (tiene preferencia el atributo en HTML sobre los datos de JSON o valor por defecto)
        let languages = AdVista24_languages;
        if (typeof $(this).attr("languages") !== "undefined") {
            languages = $(this).attr("languages").split(",");
        }

        // Regeneramos la cabecera y la tabla de trenes si han cambiados los idiomas.
        let header = $(this).find(".header");
        if (header.length > 0) {
            if (header.attr("languages") !== languages.join(",")) {
                replace_header = true;
                replace_train_table = true;
            }
        }

        // Regeneramos la cabecera si ha cambiado el nombre de la estación en el JSON y está activado el subtitulo station-name
        if (subtitle === "station-name") {
            if (header.attr("station-name") !== AdVista24_station_name) replace_header = true;
        }

        // Regeneración de la cabecera
        if (replace_header) {
            header.replaceWith(
                AdVista24_headerHTML(monitor_class, languages, widths, show_access, show_platform, subtitle, font_size)
            );
        }

        // Regeneración de la tabla de trenes (lo hacemos vaciando su contenido)
        if (replace_train_table) {
            this_monitor.find(".table div.train-row").remove();
        }

        // Ordenamos la lista de trenes segun la configuracion del monitor
        let class_stop_filter = [];
        let list_trains = [...AdVista24_trains_data.trains];
        if (monitor_class === "departures") {
            class_stop_filter = ["intermediate", "origin", "boarding_only"];
            if (countdown_active) {
                list_trains = list_trains.sort(AdVista24_ordenarTrenesCountdown(estimated_time_traffics));
            } else {
                list_trains = list_trains.sort(AdVista24_ordenarTrenesHoraSalida(estimated_time_traffics));
            }
        } else {
            class_stop_filter = ["intermediate", "destination", "alighting_only"];
            list_trains = list_trains.sort(AdVista24_ordenarTrenesHoraLlegada(estimated_time_traffics));
        }

        let first_train = ~~$(this).attr("first-train");
        let last_train = ~~$(this).attr("last-train");
        let train_index = 0;
        let row_index = 0;

        let aspect_ratio = $(this).attr("aspect-ratio");
        let abs_row_height = $(this).attr("abs-row-height");

        list_trains.forEach(function (train) {
            if (
                AdVista24_filtroTrenes(
                    monitor_class,
                    train,
                    class_stop_filter,
                    traffic_filter,
                    traffic_include,
                    company_filter,
                    company_include,
                    product_filter,
                    product_include,
                    access_filter,
                    access_include,
                    platform_filter,
                    platform_include,
                    stop_filter,
                    stop_include,
                    custom_filter,
                    custom_include,
                    []
                )
            ) {
                train_index++;

                if (train_index >= first_train && (train_index <= last_train || show_all_trains)) {
                    //Obtenemos la fila actual de la pantalla

                    row_index++;
                    let checked = false;

                    //Obtenemos si se muestran las paradas. (max_show_stops = -1 si no hay límite)
                    let show_stops = max_show_stops < 0 || max_show_stops >= row_index;

                    while (!checked) {
                        let this_row = this_monitor.find(".table div.train-row").slice(row_index - 1, row_index);
                        let this_train = AdVista24_trainHTML(
                            train,
                            languages,
                            monitor_class,
                            widths,
                            journey_scroll,
                            observation_scroll,
                            show_access,
                            show_platform,
                            show_product,
                            show_number,
                            show_stops,
                            countdown_active,
                            countdown_traffics,
                            estimated_time_traffics,
                            show_platform_preview,
                            sectorization_mode,
                            platform_routing,
                            aspect_ratio,
                            abs_row_height
                        );

                        //Si no existe la fila (fila vacía), creamos el tren
                        if (typeof this_row.html() === "undefined") {
                            if (AdVista24_get_console_log)
                                AdVista24_consoleLog(
                                    "Creamos tren id: " +
                                        this_train.attr("train-id") +
                                        " / " +
                                        this_train.find(".train-commercial-id").attr("check-value")
                                );
                            this_monitor.find(".table").append(this_train);
                            checked = true;
                        } else {
                            // Existe ya un tren, comprobamos si es el mismo
                            if (this_row.attr("train-id") === this_train.attr("train-id")) {
                                //Mismo tren, actualizamos los datos

                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Actualizamos tren id: " +
                                            this_train.attr("train-id") +
                                            " / " +
                                            this_train.find(".train-commercial-id").attr("check-value")
                                    );

                                //Actualización de time
                                if (
                                    this_row.find(".train-time").attr("check-value") !==
                                    this_train.find(".train-time").attr("check-value")
                                ) {
                                    this_row.find(".train-time").replaceWith(this_train.find(".train-time"));
                                }
                                //Actualización de status
                                if (
                                    this_row.find(".train-status").attr("check-value") !==
                                    this_train.find(".train-status").attr("check-value")
                                ) {
                                    this_row.find(".train-status").replaceWith(this_train.find(".train-status"));
                                }
                                //Actualización de direction
                                if (
                                    this_row.find(".train-direction").attr("check-value") !==
                                    this_train.find(".train-direction").attr("check-value")
                                ) {
                                    this_row.find(".train-direction").replaceWith(this_train.find(".train-direction"));
                                }

                                // Actualización de accessible-sign: si aparece o desaparece, deben sustituirse conjuntamente con train-direction
                                if (
                                    this_row.find(".train-accessible-sign").length &&
                                    !this_train.find(".train-accessible-sign").length
                                ) {
                                    // Quitar logo accesibilidad
                                    this_row.find(".train-accessible-sign").remove();
                                    this_row.find(".train-direction").replaceWith(this_train.find(".train-direction"));
                                } else if (
                                    !this_row.find(".train-accessible-sign").length &&
                                    this_train.find(".train-accessible-sign").length
                                ) {
                                    // Poner logo accessibilidad
                                    this_row.find(".train-direction").replaceWith(this_train.find(".train-direction"));
                                    this_row.find(".train-direction").after(this_train.find(".train-accessible-sign"));
                                }

                                //Actualización de horizontal-journey
                                if (
                                    this_row.find(".train-horizontal-journey").attr("check-value") !==
                                    this_train.find(".train-horizontal-journey").attr("check-value")
                                ) {
                                    this_row
                                        .find(".train-horizontal-journey")
                                        .replaceWith(this_train.find(".train-horizontal-journey"));
                                }
                                //Actualización de comercial_id
                                if (
                                    this_row.find(".train-commercial-id").attr("check-value") !==
                                    this_train.find(".train-commercial-id").attr("check-value")
                                ) {
                                    this_row
                                        .find(".train-commercial-id")
                                        .replaceWith(this_train.find(".train-commercial-id"));
                                }
                                //Actualización de acceso
                                if (
                                    this_row.find(".train-access").attr("check-value") !==
                                    this_train.find(".train-access").attr("check-value")
                                ) {
                                    this_row.find(".train-access").replaceWith(this_train.find(".train-access"));
                                }
                                //Actualización de vía/sector
                                if (
                                    this_row.find(".train-platform").attr("check-value") !==
                                    this_train.find(".train-platform").attr("check-value")
                                ) {
                                    this_row.find(".train-platform").replaceWith(this_train.find(".train-platform"));
                                }
                                //Si aparece o desaparece platform-routing, redibujamos observación y platform-routing
                                if (this_row.attr("platform-routing") !== this_train.attr("platform-routing")) {
                                    if (this_train.attr("platform-routing") === "false") {
                                        this_row.find(".train-platform-routing").remove();
                                        this_row.find(".list-margin-inf-end").remove();
                                        this_row.find(".train-info").replaceWith(this_train.find(".train-info"));
                                        this_row.append(this_train.find(".list-margin-inf-end"));
                                    } else {
                                        this_row.find(".train-info").remove();
                                        this_row.find(".list-margin-inf-end").remove();
                                        this_row.append(this_train.find(".train-info"));
                                        this_row.append(this_train.find(".train-platform-routing"));
                                    }
                                    this_row.attr("platform-routing", this_train.attr("platform-routing"));
                                } else {
                                    //Actualización de observación
                                    if (
                                        this_row.find(".train-info").attr("check-value") !==
                                        this_train.find(".train-info").attr("check-value")
                                    ) {
                                        this_row.find(".train-info").replaceWith(this_train.find(".train-info"));
                                    }
                                    // Actualización de platform-routing
                                    if (this_train.attr("platform-routing") === "true") {
                                        if (
                                            this_row.find(".train-platform-routing").attr("check-value") !==
                                            this_train.find(".train-platform-routing").attr("check-value")
                                        ) {
                                            this_row
                                                .find(".train-platform-routing")
                                                .replaceWith(this_train.find(".train-platform-routing"));
                                        }
                                    }
                                }

                                checked = true;
                            } else {
                                //No coincide el tren a pintar con el pintado.

                                //Comprobamos si el tren pintado continua vigente en la lista
                                let old_train_index = list_trains.findIndex(
                                    (train) => String(train.id) === this_row.attr("train-id")
                                );

                                if (old_train_index === -1) {
                                    //El tren pintado en la fila se ha borrado o desactivado. Borramos el tren y reiniciamos análisis fila
                                    if (AdVista24_get_console_log)
                                        AdVista24_consoleLog(
                                            "Eliminamos tren id: " +
                                                this_row.attr("train-id") +
                                                " / " +
                                                this_row.find(".train-commercial-id").attr("check-value")
                                        );
                                    this_row.remove();
                                    checked = false;
                                    continue;
                                }

                                //Comprobamos si el tren a pintar es nuevo (no estaba en la lista)
                                // Obtenemos las filas con trenes con el mismo id (teóricamente solo debe haber uno como máximo)
                                let new_train_row = this_monitor.find(
                                    ".table div.train-row[train-id='" + train.id + "']"
                                );

                                if (new_train_row.length === 0 || new_train_row.length > 1) {
                                    //Si vale 0, el tren a pintar es nuevo en la lista (por creacción o reordenación)

                                    //Si vale más de 1, implica que se han recibido datos mal elaborados con duplicidades de clave principal,
                                    //se considerará en este caso que se trata de un tren nuevo para evitar que el script reordene indefinidamente trenes con misma clave princpal.

                                    //Añadimos la nueva fila antes del elemento actual y seguimos proceso
                                    if (AdVista24_get_console_log)
                                        AdVista24_consoleLog(
                                            "Añadimos tren id: " +
                                                this_train.attr("train-id") +
                                                " / " +
                                                this_train.find(".train-commercial-id").attr("check-value")
                                        );
                                    this_row.before(this_train);
                                    checked = true;
                                    continue;
                                } else if (new_train_row.length === 1) {
                                    //El tren a pintar existe en otra posición, lo movemos a la fila actual y reiniciamos análisis.
                                    if (AdVista24_get_console_log)
                                        AdVista24_consoleLog(
                                            "Movemos tren id: " +
                                                new_train_row.attr("train-id") +
                                                " / " +
                                                new_train_row.find(".train-commercial-id").attr("check-value")
                                        );
                                    checked = false;
                                    new_train_row.insertBefore(this_row);
                                    continue;
                                }
                            }
                        }
                        checked = true;
                    }
                }
            }
        });

        //Eliminar filas por enicima de capacidad
        this_monitor.find(".table div.train-row").slice(row_index).remove();

        // Si ha aparecido o desaparecido la barra de scroll vertical que se muestra cuando no caben todos los trenes en modo show_all_trains
        // es necesario ajustar la cabecera para que cuadre el rótulo de "Acceso" y "Vía" con los elementos de la tabla
        // para eso ajustamos el ancho del margen situado a la derecha de "Vía" para que iguale a la barra de scroll

        if (show_all_trains) {
            // Ancho de la tabla de trenes

            let train_table_width = $(this).find(".train-table").width();
            let list_header_width = $(this).find(".header").width();

            let table_contraction_ratio = train_table_width / list_header_width;
            let scroll_bar_width_percent = (1 - table_contraction_ratio) * 100;

            // Ajustamos el ancho del campo de logo
            let regular_logo_width = $(this).find(".header").attr("regular-logo-width");
            let adjusted_logo_width = regular_logo_width * table_contraction_ratio;
            $(this)
                .find(".header")
                .css("--header-logo-width", adjusted_logo_width + "%");

            // El espacio sobrante del logo lo asignamos al titulo
            let free_width = regular_logo_width - adjusted_logo_width;
            let title_logo_width = $(this).find(".header").attr("regular-title-width");
            let adjusted_title_width = parseFloat(title_logo_width) + parseFloat(free_width);
            $(this)
                .find(".header")
                .css("--header-title-width", adjusted_title_width + "%");

            // Ajustamos el ancho del campo de acceso
            let regular_access_width = $(this).find(".header").attr("regular-access-width");
            let adjusted_access_width = regular_access_width * table_contraction_ratio;
            $(this)
                .find(".header")
                .css("--header-access-width", adjusted_access_width + "%");

            // Ajustamos el ancho del campo de vía
            let regular_platform_width = $(this).find(".header").attr("regular-platform-width");
            let adjusted_platform_width = regular_platform_width * table_contraction_ratio;
            $(this)
                .find(".header")
                .css("--header-platform-width", adjusted_platform_width + "%");

            // Obtenemos el ancho del campo reloj y leyenda, y el ancho de la barra con relacion al mismo.
            let header_legend_width = $(this).find(".header").attr("regular-legend-width");
            let header_legend_bar_width = scroll_bar_width_percent / (header_legend_width / 100);

            // Comprobamos si ha cambiado el espacio que ocupa la barra y actualizamos el tamaño de los textos variables de la cabecera.
            let old_bar_space_width = $(this).find(".header").css("--header-legend-bar-space-width");
            $(this)
                .find(".header")
                .css("--header-legend-bar-space-width", header_legend_bar_width + "%");
            if (old_bar_space_width !== $(this).find(".header").css("--header-legend-bar-space-width")) {
                $(this).find(".header .fitted").removeAttr("style");
                $(this).find(".header .fitted").removeClass("fitted");
            }

            // Actualizamos el ancho del margen izquierdo con lo han dejado los otros elementos
            let adjusted_space_header_width =
                100 - adjusted_access_width - adjusted_platform_width - header_legend_bar_width;
            $(this)
                .find(".header")
                .css("--header-legend-space-width", adjusted_space_header_width + "%");
        }
    });

    if (restart_list_monitors) {
        AdVista24_startListMonitors();
        AdVista24_updateData();
    }

    // Actualización interfaces alphabetical
    $(".adif-infotren-vista-alphabetical").each(function () {
        let countdown_active = false;
        let countdown_traffics = [];
        if ($(this).attr("countdown") === "true") {
            countdown_active = true;
            if (typeof $(this).attr("countdown-traffics") !== "undefined") {
                countdown_traffics = $(this).attr("countdown-traffics").split(",");
            } else {
                countdown_traffics = AdVista24_default_countdown_traffics;
            }
        }

        //Determinamos si deben mostrarse vías previas
        let show_platform_preview = $(this).attr("show-platform-preview") !== "false";

        //El tamaño de fuente es fijo en la interfaz alphabetical
        let font_size = 1;

        // Obtenemos el ancho de las columnas
        let widths = AdVista24_getAlphabeticalWidths(font_size);

        let estimated_time_traffics = AdVista24_default_estimated_time_traffics;
        if (typeof $(this).attr("estimated-time-traffics") !== "undefined") {
            estimated_time_traffics = $(this).attr("estimated-time-traffics").split(",");
        }

        let sectorization_mode = "";
        if (typeof $(this).attr("sectorization-mode") !== "undefined") {
            sectorization_mode = this_monitor.attr("sectorization-mode");
        }

        // Elementos cuya variación requiere regenerar la cabecera o la tabla
        let replace_header = false;
        let replace_train_table = false;

        //Logotipo de red del monitor
        let network = "";
        if (typeof $(this).attr("alphabetical-network") !== "undefined") {
            network = $(this).attr("alphabetical-network");
        }

        // Idiomas del monitor (tiene preferencia el atributo en HTML sobre los datos de JSON o valor por defecto)
        let languages = AdVista24_languages;
        if (typeof $(this).attr("languages") !== "undefined") {
            languages = $(this).attr("languages").split(",");
        }

        // Regeneramos la cabecera y la tabla de trenes si han cambiados los idiomas.
        let header = $(this).find(".header");
        if (header.length > 0) {
            if (header.attr("languages") !== languages.join(",")) {
                replace_header = true;
                replace_train_table = true;
            }
        }

        let this_monitor = $(this);

        // Regeneración de la cabecera
        if (replace_header) {
            header.replaceWith(
                AdVista24_headerHTML("alphabetical", languages, widths, false, false, network, font_size)
            );
        }

        // Regeneración de la tabla de trenes (lo hacemos vaciando su contenido)
        if (replace_train_table) {
            this_monitor.find(".table div.alphabetical-row").remove();
        }

        //Filtros de servicios
        let traffic_filter = [];
        if (typeof $(this).attr("traffic-filter") !== "undefined") {
            traffic_filter = $(this).attr("traffic-filter").split(",");
        }

        let traffic_include = [];
        if (typeof $(this).attr("traffic-include") !== "undefined") {
            traffic_include = $(this).attr("traffic-include").split(",");
        }

        let company_filter = [];
        if (typeof $(this).attr("company-filter") !== "undefined") {
            company_filter = $(this).attr("company-filter").split(",");
        }

        let company_include = [];
        if (typeof $(this).attr("company-include") !== "undefined") {
            company_include = $(this).attr("company-include").split(",");
        }

        let product_filter = [];
        if (typeof $(this).attr("product-filter") !== "undefined") {
            product_filter = $(this).attr("product-filter").split(",");
        }

        let product_include = [];
        if (typeof $(this).attr("product-include") !== "undefined") {
            product_include = $(this).attr("product-include").split(",");
        }

        let access_filter = [];
        if (typeof $(this).attr("access-filter") !== "undefined") {
            access_filter = $(this).attr("access-filter").split(",");
        }

        let access_include = [];
        if (typeof $(this).attr("access-include") !== "undefined") {
            access_include = $(this).attr("access-include").split(",");
        }

        let platform_filter = [];
        if (typeof $(this).attr("platform-filter") !== "undefined") {
            platform_filter = $(this).attr("platform-filter").split(",");
        }

        let platform_include = [];
        if (typeof $(this).attr("platform-include") !== "undefined") {
            platform_include = $(this).attr("platform-include").split(",");
        }

        let stop_filter = [];
        if (typeof $(this).attr("stop-filter") !== "undefined") {
            stop_filter = $(this).attr("stop-filter").split(",");
        }

        let stop_include = [];
        if (typeof $(this).attr("stop-include") !== "undefined") {
            stop_include = $(this).attr("stop-include").split(",");
        }

        let custom_filter = [];
        if (typeof $(this).attr("custom-filter") !== "undefined") {
            custom_filter = $(this).attr("custom-filter").split(",");
        }

        let custom_include = [];
        if (typeof $(this).attr("custom-include") !== "undefined") {
            custom_include = $(this).attr("custom-include").split(",");
        }

        // Filtrado de estaciones
        let alphabetical_stations = [];
        if (typeof $(this).attr("alphabetical-stations") !== "undefined") {
            alphabetical_stations = this_monitor.attr("alphabetical-stations").split(",");
        }

        // Eliminamos las estaciones que no están dadas de alta correctamente en el diccionario de estaciones del JSON
        alphabetical_stations = alphabetical_stations.filter(function (station_code) {
            return typeof AdVista24_station_list[station_code] !== "undefined";
        });

        // Filtrado de trenes
        let alphabetical_trains = [...AdVista24_trains_data.trains];
        let class_stop_filter = ["intermediate", "origin", "boarding_only"];
        alphabetical_trains = alphabetical_trains.filter((train) =>
            AdVista24_filtroTrenes(
                "departures",
                train,
                class_stop_filter,
                traffic_filter,
                traffic_include,
                company_filter,
                company_include,
                product_filter,
                product_include,
                access_filter,
                access_include,
                platform_filter,
                platform_include,
                stop_filter,
                stop_include,
                custom_filter,
                custom_include,
                []
            )
        );

        alphabetical_trains = alphabetical_trains.filter((train) => train.status !== "cancelled");

        // Obtenemos el listado de estaciones en la que al menos un tren efectúa parada
        let alphabetical_trains_stations = [];
        alphabetical_trains.forEach(function (train) {
            let journey = train.journey_stops_destination;
            journey.forEach(function (station) {
                //Por si no está dada de alta correctamente la estación en el diccionario de estaciones del JSON
                if (typeof AdVista24_station_list[station.code] !== "undefined") {
                    if (!alphabetical_trains_stations.includes(station.code))
                        alphabetical_trains_stations.push(station.code);
                }
            });
        });

        // Si no se ha indicado filtro de estaciones, se asumen todas las estaciones en la que al menos un tren efectúa parada
        if (alphabetical_stations.length === 0) alphabetical_stations = alphabetical_trains_stations;
        else {
            // Si se ha indicado un filtro de estaciones, eliminamos de la lista de estaciones aquellas en las que no efectúa parada ningun tren
            alphabetical_stations = alphabetical_stations.filter(function (alpha_station) {
                return alphabetical_trains_stations.includes(alpha_station);
            });
        }

        // Obtenemos los nombres de estaciones alternativos en monitores alfabéticos
        let alphabetical_station_names = {};
        let changed_station_names = {};
        if (typeof this_monitor.attr("alphabetical-station-names") !== "undefined") {
            this_monitor
                .attr("alphabetical-station-names")
                .split(",")
                .forEach((asn) => {
                    let [asm_code, asm_name] = asn.split(":");
                    alphabetical_station_names[asm_code] = asm_name;
                });
        }

        // Para el resto de estaciones se utiliza el primer nombre de estación utilizado en el JSIV
        alphabetical_stations.forEach(function (station_code) {
            if (typeof alphabetical_station_names[station_code] === "undefined") {
                alphabetical_station_names[station_code] = AdVista24_station_list[station_code].name[0];
                changed_station_names[station_code] = "";
            } else {
                changed_station_names[station_code] = alphabetical_station_names[station_code];
            }
        });

        // Ordenamos la lista de estaciones alfabéticamente
        alphabetical_stations.sort((a, b) =>
            alphabetical_station_names[a].localeCompare(alphabetical_station_names[b], "es", {
                ignorePunctuation: true,
            })
        );

        // Atributos de primera y ultima estacion en el monitor e indices de recorrido
        let first_station = ~~$(this).attr("first-station");
        let last_station = ~~$(this).attr("last-station");
        let station_index = 0;
        let row_index = 0;

        // Controlamos ultima letra de indice dibujada
        let actual_letter = "";
        let letter_parity = 1;

        alphabetical_stations.forEach(function (station_code) {
            station_index++;

            // Actualizamos información para índice alfabético
            let letter = AdVista24_obtienePrimeraLetraNormalizada(alphabetical_station_names[station_code]);
            if (letter === actual_letter) letter = "";
            else {
                // Nueva letra y cambio de paridad
                actual_letter = letter;
                letter_parity = 1 - letter_parity;
            }

            if (station_index >= first_station && station_index <= last_station) {
                row_index++;

                let this_row = this_monitor.find(".table div.alphabetical-row").slice(row_index - 1, row_index);

                let this_station = AdVista24_alphabeticalStationHTML(
                    station_code,
                    changed_station_names[station_code],
                    widths,
                    alphabetical_trains,
                    countdown_active,
                    countdown_traffics,
                    estimated_time_traffics,
                    show_platform_preview,
                    sectorization_mode,
                    letter,
                    letter_parity,
                    languages
                );

                //Si no existe la fila (fila vacía), creamos la estación
                if (typeof this_row.html() === "undefined") {
                    if (AdVista24_get_console_log)
                        AdVista24_consoleLog("Creamos estacion id: " + this_station.attr("station-code"));
                    this_monitor.find(".table").append(this_station);
                } else {
                    // Existe ya una estación, comprobamos si es la misma
                    if (this_row.attr("station-code") === this_station.attr("station-code")) {
                        // Misma estación, actualizamos los datos

                        // Actualizamos letra si procede
                        if (
                            this_row.find(".alphabetical-letter").attr("check-value") !==
                            this_station.find(".alphabetical-letter").attr("check-value")
                        ) {
                            this_row
                                .find(".alphabetical-letter")
                                .replaceWith(this_station.find(".alphabetical-letter"));
                            if (AdVista24_get_console_log)
                                AdVista24_consoleLog(
                                    "Actualizamos letra. Estación: " + this_station.attr("station-code")
                                );
                        }
                        // Actualizamos correspondencias si procede
                        if (
                            this_row.find(".alphabetical-station-connections").attr("check-value") !==
                            this_station.find(".alphabetical-station-connections").attr("check-value")
                        ) {
                            this_row
                                .find(".alphabetical-station-connections")
                                .replaceWith(this_station.find(".alphabetical-station-connections"));
                            if (AdVista24_get_console_log)
                                AdVista24_consoleLog(
                                    "Actualizamos correspondencias. Estación: " + this_station.attr("station-code")
                                );
                        }

                        // Comprobamos que el primer tren coincida
                        if (
                            this_row.find(".alphabetical-train-1").attr("train-id") !==
                            this_station.find(".alphabetical-train-1").attr("train-id")
                        ) {
                            // Distinto tren. Sustituimos completamente
                            this_row
                                .find(".alphabetical-train-1")
                                .replaceWith(this_station.find(".alphabetical-train-1"));
                            if (AdVista24_get_console_log)
                                AdVista24_consoleLog(
                                    "Sustituimos estación id: " + this_station.attr("station-code") + " Tren 1"
                                );
                        } else {
                            // Mismo tren. Comprobamos check-values:
                            //Actualización de train-line

                            if (
                                this_row.find(".alphabetical-train-1 .train-line").attr("check-value") !==
                                this_station.find(".alphabetical-train-1 .train-line").attr("check-value")
                            ) {
                                this_row
                                    .find(".alphabetical-train-1 .train-line")
                                    .replaceWith(this_station.find(".alphabetical-train-1 .train-line"));
                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Actualizamos linea. Estación: " + this_station.attr("station-code") + " Tren 1"
                                    );
                            }

                            //Actualización de train-time
                            if (
                                this_row.find(".alphabetical-train-1 .train-time").attr("check-value") !==
                                this_station.find(".alphabetical-train-1 .train-time").attr("check-value")
                            ) {
                                this_row
                                    .find(".alphabetical-train-1 .train-time")
                                    .replaceWith(this_station.find(".alphabetical-train-1 .train-time"));
                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Actualizamos hora. Estación: " + this_station.attr("station-code") + " Tren 1"
                                    );
                            }

                            //Actualización de train-platform
                            if (
                                this_row.find(".alphabetical-train-1 .train-platform").attr("check-value") !==
                                this_station.find(".alphabetical-train-1 .train-platform").attr("check-value")
                            ) {
                                this_row
                                    .find(".alphabetical-train-1 .train-platform")
                                    .replaceWith(this_station.find(".alphabetical-train-1 .train-platform"));
                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Actualizamos vía. Estación: " + this_station.attr("station-code") + " Tren 1"
                                    );
                            }
                        }

                        // Comprobamos que el segundo tren coincida
                        if (
                            this_row.find(".alphabetical-train-2").attr("train-id") !==
                            this_station.find(".alphabetical-train-2").attr("train-id")
                        ) {
                            // Distinto tren. Sustituimos completamente
                            this_row
                                .find(".alphabetical-train-2")
                                .replaceWith(this_station.find(".alphabetical-train-2"));
                            this_row
                                .find(".alphabetical-space-between-trains")
                                .replaceWith(this_station.find(".alphabetical-space-between-trains"));
                            if (AdVista24_get_console_log)
                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Sustituimos estación id: " + this_station.attr("station-code") + " Tren 2"
                                    );
                        } else {
                            // Mismo tren. Comprobamos check-values:
                            //Actualización de train-line
                            if (
                                this_row.find(".alphabetical-train-2 .train-line").attr("check-value") !==
                                this_station.find(".alphabetical-train-2 .train-line").attr("check-value")
                            ) {
                                this_row
                                    .find(".alphabetical-train-2 .train-line")
                                    .replaceWith(this_station.find(".alphabetical-train-2 .train-line"));
                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Actualizamos linea. Estación: " + this_station.attr("station-code") + " Tren 2"
                                    );
                            }

                            //Actualización de train-time
                            if (
                                this_row.find(".alphabetical-train-2 .train-time").attr("check-value") !==
                                this_station.find(".alphabetical-train-2 .train-time").attr("check-value")
                            ) {
                                this_row
                                    .find(".alphabetical-train-2 .train-time")
                                    .replaceWith(this_station.find(".alphabetical-train-2 .train-time"));
                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Actualizamos hora. Estación: " + this_station.attr("station-code") + " Tren 2"
                                    );
                            }

                            //Actualización de train-platform
                            if (
                                this_row.find(".alphabetical-train-2 .train-platform").attr("check-value") !==
                                this_station.find(".alphabetical-train-2 .train-platform").attr("check-value")
                            ) {
                                this_row
                                    .find(".alphabetical-train-2 .train-platform")
                                    .replaceWith(this_station.find(".alphabetical-train-2 .train-platform"));
                                if (AdVista24_get_console_log)
                                    AdVista24_consoleLog(
                                        "Actualizamos vía. Estación: " + this_station.attr("station-code") + " Tren 2"
                                    );
                            }
                        }
                    } else {
                        // Es una estación distinta. Sustituimos toda la fila
                        this_row.replaceWith(this_station);
                        if (AdVista24_get_console_log)
                            AdVista24_consoleLog(
                                "Sustituimos estación id: " + this_station.attr("station-code") + " Tren 1"
                            );
                    }
                }
            }
        });

        //Eliminar filas por enicima de capacidad
        this_monitor.find(".table div.alphabetical-row").slice(row_index).remove();
    });

    //Creación del monitor de reloj si procede
    $(".adif-infotren-vista-clock").each(function () {
        if ($(this).find(".adif-blue-clock").length === 0) {
            $(this).empty();
            let div_height = $(this).get(0).offsetHeight;
            let div_width = $(this).get(0).offsetWidth;
            let aspect_ratio = div_width / div_height;
            $(this).append(AdVista24_adifClockHTML(aspect_ratio, "clock"));
        }
    });

    //Creación del monitor de reloj en versión anti-burn-in si procede.
    $(".adif-infotren-vista-black-clock").each(function () {
        if ($(this).find(".adif-black-clock").length === 0) {
            $(this).empty();
            let div_height = $(this).get(0).offsetHeight;
            let div_width = $(this).get(0).offsetWidth;
            let aspect_ratio = div_width / div_height;
            $(this).append(AdVista24_adifClockHTML(aspect_ratio, "black-clock"));
        }
    });

    //Creación del monitor en negro si procede
    $(".adif-infotren-vista-black").each(function () {
        $(this).empty();

        let div = $("<div>");
        div.attr("style", "width: 100%; height: 100%; background-color: black;");
        div.addClass("adif-black");
        div.html("");

        $(this).append(div);
    });

    //Creación del monitor de número de vía si procede
    $(".adif-infotren-vista-number").each(function () {
        // Tren ficticio para aprovechar funciones de visualización de información de trenes
        let train = [];

        let platform_text = "";

        if (typeof $(this).attr("number-if-no-trains") === "undefined") {
            if (typeof $(this).attr("platform-location") === "undefined") {
                platform_text = "";
            } else {
                platform_text = $(this).attr("platform-location");
            }
        } else {
            platform_text = $(this).attr("number-if-no-trains");
        }

        train.platform = platform_text.replace(/,/g, "·");
        train.sectors = [];

        let current_number = $(this).find("div.adif-number");

        // Solo repinta la pantalla si ha cambiado el número o números a pintar
        if (current_number.attr("check-value") !== String(train.platform)) {
            $(this).empty();
            let div = $("<div>");
            div.attr("style", "width: 100%; height: 100%");
            div.addClass("adif-number");

            div.append(AdVista24_platformSignHTML(train, 100));

            div.attr("check-value", train.platform);

            $(this).append(div);
        }
    });

    //Creación del monitor de número de vía en versión anti-burn-in si procede
    $(".adif-infotren-vista-black-number").each(function () {
        // Tren ficticio para aprovechar funciones de visualización de información de trenes
        let train = [];

        let platform_text = "";

        if (typeof $(this).attr("number-if-no-trains") === "undefined") {
            if (typeof $(this).attr("platform-location") === "undefined") {
                platform_text = "";
            } else {
                platform_text = $(this).attr("platform-location");
            }
        } else {
            platform_text = $(this).attr("number-if-no-trains");
        }

        train.platform = platform_text.replace(/,/g, "·");
        train.sectors = [];

        let current_number = $(this).find("div.adif-black-number");

        // Solo repinta la pantalla si ha cambiado el número o números a pintar
        if (current_number.attr("check-value") !== String(train.platform)) {
            $(this).empty();
            let div = $("<div>");
            div.attr("style", "width: 100%; height: 100%; font-size: 100%;");
            div.addClass("adif-black-number");

            let num_rows = $(this).attr("screen-rows");

            let div_rows = num_rows / 2;
            if (num_rows >= 9) div_rows = 4.5;

            let div_sup = $("<div>");
            div_sup.attr(
                "style",
                "width: 100%; height: " +
                    (100 * div_rows) / num_rows +
                    "%; background-color: black; font-size: " +
                    (100 * div_rows) / num_rows +
                    "%;"
            );

            let div_sup1 = $("<div>");
            div_sup1.attr("style", "width: 33.3%; height: 100%; background-color: black;");

            let logo = $("<div>");
            logo.addClass("adif-logo");
            logo.attr("style", "width: 100%; height: 100%;");
            logo.append(AdVista24_logoHTML("black", 100));
            div_sup1.append(logo);

            let div_sup2 = $("<div>");
            div_sup2.attr("style", "width: 66.7%; height: 100%; background-color: black;");

            div_sup.append(div_sup1);
            div_sup.append(div_sup2);

            let div_cen = $("<div>");
            div_cen.attr(
                "style",
                "width: 100%; height: " + (100 * (num_rows - 2 * div_rows)) / num_rows + "%; background-color: black;"
            );

            let div_inf = $("<div>");
            div_inf.attr(
                "style",
                "width: 100%; height: " +
                    (100 * div_rows) / num_rows +
                    "%; background-color: black; font-size: " +
                    (100 * div_rows) / num_rows +
                    "%;"
            );

            let div_inf_number = $("<div>");
            div_inf_number.attr("style", "width: 95%; height: 100%; background-color: font-size: 100%;");
            div_inf_number.addClass("adif-number-black");
            div_inf_number.html(train.platform);

            let div_inf_padding = $("<div>");
            div_inf_padding.attr("style", "width: 5%; height: 100%; background-color: font-size: 100%;");

            div_inf.append(div_inf_number);
            div_inf.append(div_inf_padding);

            div.append(div_sup);
            div.append(div_cen);
            div.append(div_inf);

            div.attr("check-value", train.platform);
            $(this).append(div);
        }
    });

    // Generación de la plantilla collapse
    $(".adif-infotren-vista-collapse").each(function () {
        $(this).empty();
    });

    AdVista24_cssEffects();
    AdVista24_sizeAdjustments();

    if (AdVista24_get_console_log) AdVista24_consoleLog("Fin de actualizando monitores");
}

function AdVista24_cssEffects() {
    //Event listeners para las secuencias de animiaciones en scrolls horizontales (repetición indefinida, con reinicio de contenido)
    $(".scrollableX:not(.scrollingX)").each(function () {
        $(this).on("animationend", function () {
            if ($(this).hasClass("scrollingX-moving")) {
                $(this).removeClass("scrollingX-moving").addClass("scrollingX-fade");
            } else if ($(this).hasClass("scrollingX-fade")) {
                $(this).removeClass("scrollingX-fade").addClass("scrollingX-moving");
            }
        });
    });

    //Event listeners para las secuencias de animiaciones en scrolls verticales por saltos
    $(".scrollableS:not(.scrollingS)").each(function () {
        $(this).on("animationend", function () {
            // Si ha terminado una animación de salto de línea vertical:
            if ($(this).hasClass("scrollingS-moving") || $(this).hasClass("scrollingS-fade")) {
                // Indicamos que se ha terminado el salto eliminado la clase scrollingS-moving
                $(this).removeClass("scrollingS-moving");

                // Actualizamos las variables CSS para el siguiente salto e iniciamos una animación en la que el texto se queda fijo en --scrollS-start:
                // (animación intermedia entre dos transiciones)
                let current_line = ~~$(this).attr("current-line");
                let total_lines = ~~$(this).attr("total-lines");
                current_line++;
                if (current_line < total_lines) {
                    $(this).attr(
                        "style",
                        "--scrollS-start: " +
                            (-(current_line - 1) * 100).toString() +
                            "%; --scrollS-end: " +
                            (-current_line * 100).toString() +
                            "%;"
                    );
                    $(this).attr("current-line", current_line);
                    $(this).addClass("scrollingS-stop"); // Si la siguiente transición es otro salto
                    $(this).removeClass("scrollingS-moving");
                    $(this).removeClass("scrollingS-fade");
                } else {
                    $(this).attr(
                        "style",
                        "--scrollS-start: " + (-(current_line - 1) * 100).toString() + "%; --scrollS-end: " + "0" + "%;"
                    );
                    current_line = 0;
                    $(this).attr("current-line", current_line);
                    $(this).addClass("scrollingS-fade-stop"); // Si la siguiente transición es volver a inicio
                    $(this).removeClass("scrollingS-moving");
                    $(this).removeClass("scrollingS-fade");
                }

                // Solo si no queda ningun scroll-Y moviendose iniciamos un temporizador de 1 segundos que da la orden a todos los scrolls-Y de iniciar el
                // siguiente salto. El temporador debe durar (bastante) más que las animaciones tipo stop.
                let elements_moving = $(".scrollingS-moving");
                if (elements_moving.length === 0) {
                    setTimeout(function () {
                        let elements_moving = $(".scrollingS-moving");
                        if (elements_moving.length === 0) {
                            $(".scrollingS-stop")
                                .addClass("scrollingS")
                                .addClass("scrollingS-moving")
                                .removeClass("scrollingS-stop");
                            $(".scrollingS-fade-stop")
                                .addClass("scrollingS-fade")
                                .addClass("scrollingS-moving")
                                .removeClass("scrollingS-fade-stop");
                        }
                    }, 0);
                }
            }
        });
    });

    //Event listeners para las secuencias de animiaciones en scrolls verticales continuos
    $(".scrollableY:not(.scrollingY)").each(function () {
        $(this).on("animationend", function () {
            if ($(this).hasClass("scrollingY-moving")) {
                $(this).removeClass("scrollingY-moving").addClass("scrollingY-fade");
            } else if ($(this).hasClass("scrollingY-fade")) {
                $(this).removeClass("scrollingY-fade").addClass("scrollingY-moving");
            }
        });
    });

    //Event listeners para las secuencias de animiaciones en scroll con transición por difuminado (scroll de idiomas)
    $(".scrollableL:not(.scrollingL)").each(function () {
        $(this).on("animationend", function () {
            // Si ha terminado la animación scrollingL y el elemento está no-visible
            if ($(this).hasClass("scrollingL-fadeout")) {
                // Indicamos que se ha terminado la animación
                $(this).removeClass("scrollingL-active");

                // Solo si no queda ningun scroll-L moviendose activamos la animación de aparición y cambiamos el idioma de todos los elementos conjuntamente
                let elements_moving = $(".scrollingL-active");
                if (elements_moving.length === 0) {
                    // Datos del elemento actual
                    let total_lines = parseInt($(this).attr("total_lines"));
                    let unhidden_line = parseInt($(this).attr("unhidden_line"));

                    setTimeout(function () {
                        unhidden_line++;

                        if (unhidden_line === total_lines) {
                            unhidden_line = 0;
                        }

                        //Mostramos nueva línea y ocultamos las demás
                        $(".scrollingL p[line_number!='" + unhidden_line + "']").addClass("hidden");
                        $(".scrollingL div[line_number!='" + unhidden_line + "']").addClass("hidden");
                        $(".scrollingL").attr("unhidden_line", unhidden_line);
                        $(".scrollingL p[line_number='" + unhidden_line + "']").removeClass("hidden");
                        $(".scrollingL div[line_number='" + unhidden_line + "']").removeClass("hidden");

                        $(".scrollingL")
                            .addClass("scrollingL-fadein")
                            .addClass("scrollingL-active")
                            .removeClass("scrollingL-fadeout");
                    }, 50);
                }
            }

            // Si ha terminado la animación scrollingL-fadein se pasa automáticamente a scrollingL
            if ($(this).hasClass("scrollingL-fadein")) {
                $(this).removeClass("scrollingL-active");

                setTimeout(function () {
                    $(".scrollingL-fadein")
                        .addClass("scrollingL-fadeout")
                        .addClass("scrollingL-active")
                        .removeClass("scrollingL-fadein");
                }, 0);
            }
        });
    });

    //Event listeners para las secuencias de animiaciones en scroll por flaps (F1 y F2)
    $(".scrollableF1:not(.scrollingF1)").each(function () {
        $(this).on("animationend", function () {
            // Si ha terminado la animación scrollingF1 y el elemento está no-visible
            if ($(this).hasClass("scrollingF1-fadeout")) {
                // Indicamos que se ha terminado la animación
                $(this).removeClass("scrollingF1-active");
                AdVista24_changeUnhiddenLine($(this));
                // Solo si no queda ningun scroll-F1 moviendose activamos la animación de aparición
                let elements_moving = $(".scrollingF1-active");
                if (elements_moving.length === 0) {
                    setTimeout(function () {
                        $(".scrollingF1-fadeout")
                            .addClass("scrollingF1-fadein")
                            .addClass("scrollingF1-active")
                            .removeClass("scrollingF1-fadeout");
                    }, 0);
                }
            }
            // Si ha terminado la animación scrollingL-fadein se pasa automáticamente a scrollingL
            if ($(this).hasClass("scrollingF1-fadein")) {
                $(this).removeClass("scrollingF1-active");

                // Solo si no queda ningun scroll-F1 moviendose activamos la animación de aparición
                let elements_moving = $(".scrollingF1-active");
                if (elements_moving.length === 0) {
                    setTimeout(function () {
                        $(".scrollingF1-fadein")
                            .addClass("scrollingF1-fadeout")
                            .addClass("scrollingF1-active")
                            .removeClass("scrollingF1-fadein");
                    }, 0);
                }
            }
        });
    });

    $(".scrollableF2:not(.scrollingF2)").each(function () {
        $(this).on("animationend", function () {
            // Si ha terminado la animación scrollingF2 y el elemento está no-visible
            if ($(this).hasClass("scrollingF2-fadeout")) {
                // Indicamos que se ha terminado la animación
                $(this).removeClass("scrollingF2-active");
                AdVista24_changeUnhiddenLine($(this));
                // Solo si no queda ningun scroll-F2 moviendose activamos la animación de aparición
                let elements_moving = $(".scrollingF2-active");
                if (elements_moving.length === 0) {
                    setTimeout(function () {
                        $(".scrollingF2-fadeout")
                            .addClass("scrollingF2-fadein")
                            .addClass("scrollingF2-active")
                            .removeClass("scrollingF2-fadeout");
                    }, 0);
                }
            }
            // Si ha terminado la animación scrollingL-fadein se pasa automáticamente a scrollingL
            if ($(this).hasClass("scrollingF2-fadein")) {
                $(this).removeClass("scrollingF2-active");

                // Solo si no queda ningun scroll-F2 moviendose activamos la animación de aparición
                let elements_moving = $(".scrollingF2-active");
                if (elements_moving.length === 0) {
                    setTimeout(function () {
                        $(".scrollingF2-fadein")
                            .addClass("scrollingF2-fadeout")
                            .addClass("scrollingF2-active")
                            .removeClass("scrollingF2-fadein");
                    }, 0);
                }
            }
        });
    });

    // Sincronizado de parpadeos (blinking)
    $(".blinking-ready").each(function () {
        //La clase blinking-ready solo se usa para inicializar los eventos
        $(this).removeClass("blinking-ready");

        //Si no hay elementos parpadeando inicia el parpadeo, si no espera a sincronizar:
        let elements_blinking = $(".blinking");
        if (elements_blinking.length > 0) $(this).addClass("blinking-paused");
        else $(this).addClass("blinking");

        $(this).on("animationend", function () {
            //Cuando termine un ciclo de parpadeos .blinking cambia la clase a paused
            $(this).removeClass("blinking");
            $(this).addClass("blinking-paused");

            //Si no quedan elementos con clase blinking, reactiva sincronizadamente totos los parpadeos
            let elements_blinking = $(".blinking");

            if (elements_blinking.length === 0) {
                setTimeout(function () {
                    $(".blinking-paused").addClass("blinking").removeClass("blinking-paused");
                }, 0);
            }
        });
    });

    //Activa los scrolls horizontales indefinidos (con reinicio de línea)
    $(".scrollableX:not(.scrollingX)").each(function () {
        // Verificar si el contenido excede el ancho del contenedor.
        // Si excede del 112% del ancho se hace scroll
        // Si excede del 100% pero es menor que el 112%, se reduce sin scroll

        if ($(this).get(0).scrollWidth > 1.12 * $(this).get(0).clientWidth) {
            let ratio_width_client = $(this).get(0).scrollWidth / $(this).get(0).clientWidth;
            let container_width = $(this).attr("container-width");
            let scroll_width = -100 * (ratio_width_client - 1);
            let scroll_distance = (container_width / 100) * (ratio_width_client - 1);

            //Modificando esta constante podemos variar la velocidad de scroll horizontal
            //Dado que se considera un valor óptimo de diseño, no se expone para su en la cabecera del código.
            const scroll_speed = 4.5;
            let scroll_time = (100 * scroll_distance) / scroll_speed;

            //En los monitores de andén, utilizamos una velocidad mayor al disponer de más espacio para mostrar el texto.
            const scroll_speed_platform_observation = 8;
            if ($(this).hasClass("platform-observation")) {
                scroll_time = (100 * scroll_distance) / scroll_speed_platform_observation;
            }

            $(this).attr("style", "--scrollX-width: " + scroll_width + "%; --scrollX-time: " + scroll_time + "s;");
            $(this).addClass("scrollingX");
            $(this).addClass("scrollingX-moving");
        } else if ($(this).get(0).scrollWidth > $(this).get(0).clientWidth) {
            $(this).addClass("reducible");
        } else if ($(this).hasClass("platform-observation")) {
            // En monitores de andén, centramos la observación cuando cabe completamente en el contenedor.
            $(this).addClass("short-observation");
        }
    });

    //Activa los scrolls horizontales indefinidos (con contenidos en bucle)
    $(".scrollableI:not(.scrollingI)").each(function () {
        // Verificar si el contenido excede el ancho del contenedor.
        if ($(this).get(0).scrollWidth > $(this).get(0).clientWidth) {
            // Ancho del elemento:
            var ancho = 0;

            $(this).children().last().addClass("last_picto");

            $(this)
                .children()
                .each(function () {
                    ancho += $(this).outerWidth(true);
                });

            // Duplicamos el contenido
            $(this).append($(this).html());

            $(this).css("--scrollI-width", -ancho + "px");
            $(this).addClass("scrollingI");
        }
    });

    AdVista24_alertsEffects();

    //Activa los scrolls verticales por líneas (steps)
    $(".scrollableS:not(.scrollingS)").each(function () {
        // Verificar si el contenido excede el alto del contenedor. Si cabe no se hace scroll.
        if ($(this).get(0).scrollHeight > $(this).get(0).clientHeight) {
            let total_lines = Math.round($(this).get(0).scrollHeight / $(this).get(0).clientHeight);
            $(this).attr("total-lines", total_lines);
            $(this).attr("style", "--scrollS-start: " + "0" + "%; --scrollS-end: " + "-100" + "%;");
            $(this).addClass("scrollingS");

            //Esta clase indica que se está ejecutando un salto de scroll y se elimina cuando termina el salto.
            $(this).addClass("scrollingS-moving");
        }
    });

    //Activa los scrolls verticales
    $(".scrollableY:not(.scrollingY)").each(function () {
        // Verificar si el contenido excede el alto del contenedor. Si cabe no se hace scroll.
        // El tiempo de scroll tiene que venir ya indicado previamente en el CSS in-line --scrollY-time
        if ($(this).get(0).scrollHeight > $(this).get(0).clientHeight) {
            let total_scroll = -100 * ($(this).get(0).scrollHeight / $(this).get(0).clientHeight - 1);

            $(this).css("--scrollY-height", total_scroll + "%");
            $(this).addClass("scrollingY");
            $(this).addClass("scrollingY-moving");
        }
    });

    //Activa los scrolls con transición por difuminado  (scroll de idiomas)
    //Solo hay un elemento visible a la vez que va rotando y en la transición hay difuminado
    //Cada elemento (hijo) debe estar enumerado en una secuencia con el atributo line_number = 0, 1, 2, ... N-1
    //El elemento padre debe tener un atributo con el numero total de hijos total_lines (N) y el numero de linea visible unhidden_line
    //Al inicio el elemento visible es el primero (0)
    $(".scrollableL:not(.scrollingL)").each(function () {
        //Verificamos que el numero de elementos es mayor que 1
        if ($(this).attr("total_lines") > 1) {
            //Inicia el proceso (solo si no tiene elementos unfitted -pendientes de aplicar formato-)
            let unfitted = $(this).find(".unfitted");

            if (unfitted.length === 0) {
                $(this).addClass("scrollingL");
                $(this).addClass("scrollingL-fadeout");
                //Esta clase sirve para sincronizar todos los procesos a la vez, solo hace el siguiente paso hasta que no se haya quitado esta clase a todos los elementos
                $(this).addClass("scrollingL-active");
            }
        }
    });

    //Activa los scrolls por flaps (F1 y F2)
    //Solo hay un elemento visible a la vez que va rotando y en la transición el elmento gira verticalmente
    //Cada elemento (hijo) debe estar enumerado en una secuencia con el atributo line_number = 0, 1, 2, ... N-1
    //El elemento padre debe tener un atributo con el numero total de hijos total_lines (N) y el numero de linea visible unhidden_line
    //Al inicio el elemento visible es el primero (0)
    $(".scrollableF1:not(.scrollingF1)").each(function () {
        //Verificamos que el numero de elementos es mayor que 1
        if ($(this).attr("total_lines") > 1) {
            //Inicia el proceso
            $(this).addClass("scrollingF1");
            $(this).addClass("scrollingF1-fadeout");
            //Esta clase sirve para sincronizar todos los procesos a la vez, solo hace el siguiente paso hasta que no se haya quitado esta clase a todos los elementos
            $(this).addClass("scrollingF1-active");
        }
    });
    $(".scrollableF2:not(.scrollingF2)").each(function () {
        //Verificamos que el numero de elementos es mayor que 1
        if ($(this).attr("total_lines") > 1) {
            //Inicia el proceso
            $(this).addClass("scrollingF2");
            $(this).addClass("scrollingF2-fadeout");
            //Esta clase sirve para sincronizar todos los procesos a la vez, solo hace el siguiente paso hasta que no se haya quitado esta clase a todos los elementos
            $(this).addClass("scrollingF2-active");
        }
    });
}

// Funciones que forman parte de AdVista24_cssEffects pero que pueden ejecutarse de forma independiente
function AdVista24_alertsEffects() {
    //Event listeners para las secuencias de animiaciones en scrolls horizontales para alertas
    $(".scrollableXA:not(.scrollingXA)").each(function () {
        $(this).on("animationend", function () {
            if ($(this).hasClass("scrollingXA-fadein")) {
                $(this).removeClass("scrollingXA-fadein").addClass("scrollingXA-moving");
                $(this).closest(".alert").find(".alert-header-text").removeClass("scrollingXA-fadein");
            } else if ($(this).hasClass("scrollingXA-moving")) {
                $(this).removeClass("scrollingXA-moving").addClass("scrollingXA-hold");
            } else if ($(this).hasClass("scrollingXA-hold")) {
                $(this).removeClass("scrollingXA-hold").addClass("scrollingXA-fadeout");
                $(this).closest(".alert").find(".alert-header-text").addClass("scrollingXA-fadeout-header");
            } else if ($(this).hasClass("scrollingXA-fadeout")) {
                // CAMBIO DE IDIOMA
                let index = parseInt($(this).closest(".alert").attr("present-language"));
                let langs = $(this).closest(".alert").attr("languages").split(",");
                if (index < langs.length) {
                    let lang = langs[index];
                    let header = $(this)
                        .closest(".alert")
                        .attr("data-header-" + lang);
                    let description = $(this)
                        .closest(".alert")
                        .attr("data-description-" + lang);
                    index++;
                    $(this).closest(".alert").attr("present-language", index);
                    $(this).closest(".alert").find(".alert-header-text").text(header);
                    $(this).closest(".alert").find(".alert-header").attr("font-size", 100);
                    $(this).closest(".alert").find(".alert-header-text").css("font-size", "100%");
                    $(this).closest(".alert").find(".alert-header").attr("fit-attempts", 0);
                    $(this).closest(".alert").find(".alert-header").removeClass("fitted");
                    $(this).text(description);
                    $(this).closest(".alert").attr("present-language", index);
                    $(this).removeClass("scrollingXA-fadeout").removeClass("scrollingXA");
                    $(this).closest(".alert").find(".alert-header-text").removeClass("scrollingXA-fadeout-header");
                    $(this).closest(".alert").find(".alert-header-text").removeClass("scrollingXA");
                    $(this).off("animationend");
                    // Recurrente, pero no vuelve a este punto en la iteración al carecer $(this) de clase .scrollingXA-fadeout
                    AdVista24_alertsEffects();
                } else {
                    // Cambio de alerta
                    let alert_list = $(this).closest(".adif-infotren-vista").attr("alert-list").split(",");
                    let alert_id = $(this).closest(".alert").attr("alert-id");
                    let alert_index = alert_list.indexOf(alert_id);
                    let next_alert_index = 0;
                    if (alert_index >= 0 && alert_index < alert_list.length - 1) {
                        next_alert_index = alert_index + 1;
                    }
                    if (!alert_list || !alert_id) {
                        // Si algo sale mal, se repinta el monitor indicando que no hay alertas
                        $(this).closest(".adif-infotren-vista").attr("active-alerts", false);
                        AdVista24_startListMonitors();
                    } else {
                        // Reemplazo por la siguiente alerta de la lista circular
                        $(this)
                            .closest(".alert")
                            .replaceWith(
                                AdVista24_alertContentHTML(
                                    AdVista24_alerts.find((alert) => alert.id === alert_list[next_alert_index])
                                )
                            );
                    }
                    AdVista24_alertsEffects();
                }
            }
        });
    });

    //Activa los scrolls horizontales de un solo pase (alertas)
    $(".scrollableXA:not(.scrollingXA)").each(function () {
        // Verificar si el contenido excede el ancho del contenedor.
        // Si excede del 112% del ancho se hace scroll
        // Si excede del 100% pero es menor que el 112%, se reduce sin scroll

        if ($(this).get(0).scrollWidth > 1.12 * $(this).get(0).clientWidth) {
            let ratio_width_client = $(this).get(0).scrollWidth / $(this).get(0).clientWidth;
            let container_width = $(this).attr("container-width");
            let scroll_width = -100 * (ratio_width_client - 1);
            let scroll_distance = (container_width / 100) * (ratio_width_client - 1);

            //Modificando esta constante podemos variar la velocidad de scroll horizontal
            //Dado que se considera un valor óptimo de diseño, no se expone para su en la cabecera del código.
            const scroll_speed = 12;
            let scroll_time = (100 * scroll_distance) / scroll_speed;

            $(this).css({
                "--scrollXA-width": scroll_width + "%",
                "--scrollXA-time": scroll_time + "s",
                "--scrollXA-hold": "3s",
            });

            $(this).addClass("scrollingXA");
            $(this).closest(".alert").find(".alert-header-text").addClass("scrollingXA");
            $(this).addClass("scrollingXA-fadein");
            $(this).closest(".alert").find(".alert-header-text").addClass("scrollingXA-fadein");
        } else {
            $(this).css({
                "--scrollXA-width": "0%",
                "--scrollXA-time": "2s",
                "--scrollXA-hold": "3s",
            });
            $(this).addClass("scrollingXA");
            $(this).closest(".alert").find(".alert-header-text").addClass("scrollingXA");
            $(this).addClass("scrollingXA-fadein");
            $(this).closest(".alert").find(".alert-header-text").addClass("scrollingXA-fadein");
            $(this).addClass("scrollingXA-notmoving");
            if ($(this).get(0).scrollWidth > $(this).get(0).clientWidth) {
                $(this).addClass("reducible");
            }
        }
    });
}

function AdVista24_sizeAdjustments() {
    // Funciones de ajuste de elementos y textos al tamaño disponible, incluyendo la reducción a abreviaturas
    // Se ejecuta cada 100 ms debido a la latencia en la carga de imagenes y fuentes

    //Alinear hora estimada con hora teórica
    $(".train-row").each(function () {
        let train_time = $(this).find(".train-time p");
        let train_box = $(this).find(".train-time");
        let train_status_divs = $(this).find(".train-status div:not(.fitted)");

        train_status_divs.each(function () {
            let font_size = 100;
            let padding_top = 0;

            //Ajuste de tamaño cuando la observacion Cancelado/Demorado ocupa más espacio que la hora.
            if ($(this).width() > train_time.width()) {
                // Relación entre lo que ocupa la hora y la columna de la hora
                let alpha_original = train_time.width() / train_box.width();
                let alpha = alpha_original;

                while ($(this).width() > alpha * train_box.width() && font_size > 0) {
                    font_size--;
                    $(this).attr("style", "font-size: " + font_size + "%;");
                    // Si la fuente debe reducirse a menos del 80% para que encaje el mensaje, se permite sobrepasar el espacio que ocupa la hora
                    // hasta un máximo del 90% de espacio de la columna
                    if (font_size < 80) {
                        alpha = alpha_original + (80 - font_size) / 80;
                        if (alpha > 0.9) alpha = 0.9;
                    }
                }

                // Calculo del padding_top para alinear el mensaje con texto paradas/observaciones
                // Asume que con font_size = 100, el tamaño de la fuente es el 80% de la altura del <div> de acuerdo al CSS
                let box_ratio = $(this).height() / $(this).width();
                padding_top = ((100 - font_size) / 100 / 2) * 80 * box_ratio;
            }

            $(this).removeClass("unfitted").addClass("fitted");
            if ($(this).attr("line_number") > 0) $(this).addClass("hidden");

            let status_padding_left = (train_box.width() - $(this).width()) / 2;
            if (font_size === 100) status_padding_left = (train_box.width() - train_time.width()) / 2;

            let width = train_box.width() - status_padding_left;

            // Estilos inline de padding (left o right seún el caso) para alinear hora teorica y estimada, tamaño de fuente, width
            $(this).attr(
                "style",
                "--delay-padding: " +
                    status_padding_left +
                    "px; font-size: " +
                    font_size +
                    "%; width: " +
                    width +
                    " px; padding-top: " +
                    padding_top +
                    "%;"
            );
        });
    });

    //Alinear reloj con ancho de la hora en relojes en orientación vertical
    $(".adif-vertical-clock.adif-blue-clock").each(function () {
        let clock_text_width = $(this).find(".adif-clock-time .clock p").width();
        let clock_width = $(this).find(".adif-clock-time .clock").width();
        if (clock_text_width > 0) {
            $(this)
                .find(".logo img")
                .css("width", (clock_text_width / clock_width) * 100 + "%");
        }
    });

    //Obtiene la abreviatura que mejor encaja en los destinos/orígenes que no caben
    $(".train-direction-iteration").each(function () {
        if ($(this).children().get(0).scrollWidth > $(this).get(0).clientWidth && !$(this).hasClass("hidden")) {
            //Obtenemos el train-id
            let train_id = $(this).parent().parent().attr("train-id");
            if (typeof train_id === "undefined") {
                train_id = $(this).parent().parent().parent().attr("train-id");
            }

            //Obtenemos los datos del tren
            let train_data = AdVista24_trains_data.trains.filter(function (train) {
                return String(train.id) === train_id;
            });

            //Obtenemos la estación a modificar
            let direction_number = $(this).attr("direction_number");

            let station_data = "";
            let monitor_class = "departures";
            if ($(this).parent().hasClass("destination-station")) {
                station_data = train_data[0].destinations[direction_number];
            } else {
                station_data = train_data[0].origins[direction_number];
                monitor_class = "arrivals";
            }

            //Obtenemos el número de abreviaturas disponibles para el destino/origen
            let abbrev_total = 0;
            abbrev_total = AdVista24_station_list[station_data["code"]].name.length;

            //Empezando por la abreviatura actual vamos probando todas hasta encontrar una que cabe o dejar la más corta a las malas (quedaría cortada)
            let abbrev_actual = 0;
            if (typeof $(this).attr("abbrev") !== "undefined") abbrev_actual = $(this).attr("abbrev");
            while (
                $(this).children().get(0).scrollWidth > $(this).get(0).clientWidth &&
                abbrev_actual < abbrev_total - 1
            ) {
                abbrev_actual++;
                $(this).html(
                    AdVista24_stationHTML(
                        station_data,
                        monitor_class,
                        abbrev_actual,
                        $(this).find(".station-combo").hasClass("station-combo-show-line"),
                        $(this).find(".station-combo").hasClass("station-combo-show-picto")
                    )
                );
            }

            $(this).attr("abbrev", abbrev_actual);

            if ($(this).children().get(0).scrollWidth > $(this).get(0).clientWidth) {
                // $(this).children(".station-combo").addClass("reducible");
                $(this).children(".station-combo").addClass("narrowable");
            }
        }
    });

    //Obtiene la abreviatura que mejor encaja en los monitores alfabéticos
    $(".alphabetical-station-name").each(function () {
        if ($(this).children().get(0).scrollWidth > $(this).get(0).clientWidth && !$(this).hasClass("hidden")) {
            // Obtenemos el station code
            let station = [];
            station.code = $(this).parent().parent().attr("station-code");

            //Obtenemos el número de abreviaturas disponibles para el destino/origen
            let abbrev_total = 0;
            abbrev_total = AdVista24_station_list[station.code].name.length;

            //Empezando por la abreviatura actual vamos probando todas hasta encontrar una que cabe o tiene 30 caracteres o menos
            let abbrev_actual = 0;
            if (typeof $(this).attr("abbrev") !== "undefined") abbrev_actual = $(this).attr("abbrev");
            while (
                $(this).children().get(0).scrollWidth > $(this).get(0).clientWidth &&
                abbrev_actual < abbrev_total - 1 &&
                $(this).find(".station-combo .station-name-literal").text().length > 30
            ) {
                abbrev_actual++;
                $(this).html(AdVista24_stationHTML(station, "alphabetical", abbrev_actual, false, true, $(this).attr("alternate-name") || ""));
            }

            $(this).attr("abbrev", abbrev_actual);

            if ($(this).children().get(0).scrollWidth > $(this).get(0).clientWidth) {
                $(this).children(".station-combo").addClass("narrowable");
            }
        }
    });

    //Reduce el tamaño del texto en los campos reducibles (como los números de vía)
    $(".reducible:not(.fitted)").each(function () {
        let restore_hidden = false;
        if ($(this).hasClass("hidden")) {
            $(this).removeClass("hidden");
            restore_hidden = true;
        }

        let font_size = 100;

        if ($(this).hasClass("station-combo") && typeof $(this).attr("font-size") !== "undefined") {
            //Como los station-combo a veces cargan la imagen con algo de retraso, se empieza a reducir a partir del font-size actual;
            font_size = $(this).attr("font-size");
        }

        // En las columnas de acceso si el texto está incluido en array AdVista24_accesos_igualar_tamaño
        // la operación se hace con el texto alterantivo indicado y se deshace después
        let original_text = $(this).html();
        if ($(this).hasClass("access-tag") && $(this).closest(".access-header").length === 0) {
            if (typeof AdVista24_accesos_igualar_tamaño === "object") {
                if (typeof AdVista24_accesos_igualar_tamaño[original_text] !== "undefined") {
                    $(this).html(AdVista24_accesos_igualar_tamaño[original_text]);
                }
            }
        }

        while ($(this).get(0).scrollWidth > $(this).get(0).clientWidth && font_size > 0) {
            font_size--;
            if ($(this).hasClass("alert-header")) {
                // Se reduce <div> hijo en la cabecera de alertas para no alterar las pastillas de línea
                $(this)
                    .find(".alert-header-text")
                    .css("font-size", font_size + "%");
            } else {
                // Caso general
                $(this).css("font-size", font_size + "%");
            }
        }

        $(this).attr("font-size", font_size);

        // En los accesos, se revierte el nombre original una vez igualado:
        if ($(this).hasClass("access-tag") && $(this).closest(".access-header").length === 0) {
            $(this).html(original_text);
        }

        // En platform-sign-number-box establecemos un tamaño máximo para monitores verticales
        if ($(this).hasClass("train-platform-tag") && !$(this).hasClass("platform-sign-number-text-size-adjusted")) {
            if ($(this).parents(".platform-sign-number-box").length > 0) {
                let ps_box = $(this).closest(".platform-sign-number-box");
                let div_height = ps_box.get(0).offsetHeight;
                let div_width = ps_box.get(0).offsetWidth;

                let max_font_size = (div_width / div_height) * 100;
                if (font_size > max_font_size) {
                    $(this).css("font-size", max_font_size + "%");
                    $(this).addClass("platform-sign-number-text-size-adjusted");
                }
            }
        }

        if (restore_hidden) {
            $(this).addClass("hidden");
        }

        let attempts = parseInt($(this).attr("fit-attempts"), 10) || 0;

        if (attempts > 4) {
            $(this).addClass("fitted");
        } else {
            attempts++;
            $(this).attr("fit-attempts", attempts);
        }
    });

    //Estrecha los textos textos en los campos reducibles (como los destinos en monitores alfanuméricos)
    $(".narrowable:not(.fitted)").each(function () {
        let restore_hidden = false;
        if ($(this).hasClass("hidden")) {
            $(this).removeClass("hidden");
            restore_hidden = true;
        }

        let scaleX = $(this).find(".station-name-literal").css("--scaleX") || 1;

        let suma = $(this).find(".station-name-literal")[0].getBoundingClientRect().width / scaleX;

        if ($(this).find(".line")[0]) suma += $(this).find(".line")[0].getBoundingClientRect().width;
        if ($(this).find(".picto")[0])
            suma +=
                $(this).find(".station-combo-margin")[0].getBoundingClientRect().width +
                $(this).find(".picto")[0].getBoundingClientRect().width;

        while (suma > $(this).get(0).clientWidth && scaleX > 0.6) {
            scaleX = (scaleX - 0.01).toFixed(2);

            // Soluciona problemas de renderizado al hacer scaleX
            if ($(this).find(".station-combo-margin")[0])
                $(this).find(".station-combo-margin").css("min-width", "0.2em");

            $(this).find(".station-name-literal").css("--scaleX", scaleX);
            $(this)
                .find(".station-name-literal")
                .css("width", scaleX * 100 + "%");
            suma = $(this).find(".station-name-literal")[0].getBoundingClientRect().width / scaleX;
            if ($(this).find(".line")[0]) suma += $(this).find(".line")[0].getBoundingClientRect().width;
            if ($(this).find(".picto")[0])
                suma +=
                    $(this).find(".station-combo-margin")[0].getBoundingClientRect().width +
                    $(this).find(".picto")[0].getBoundingClientRect().width;
        }

        if (suma > $(this).get(0).clientWidth) {
            let font_size = 100;

            if ($(this).hasClass("station-combo") && typeof $(this).attr("font-size") !== "undefined") {
                //Como los station-combo a veces cargan la imagen con algo de retraso, se empieza a reducir a partir del font-size actual;
                font_size = $(this).attr("font-size");
            }

            while (suma > $(this).get(0).clientWidth && font_size > 0) {
                font_size--;
                $(this).css("font-size", font_size + "%");
                suma = $(this).find(".station-name-literal")[0].getBoundingClientRect().width / scaleX;
                if ($(this).find(".picto")[0])
                    suma +=
                        $(this).find(".station-combo-margin")[0].getBoundingClientRect().width +
                        $(this).find(".picto")[0].getBoundingClientRect().width;
            }

            $(this).attr("font-size", font_size);
        }

        if (restore_hidden) {
            $(this).addClass("hidden");
        }

        let attempts = parseInt($(this).attr("fit-attempts"), 10) || 0;

        if (attempts > 4) {
            $(this).addClass("fitted");
        } else {
            attempts++;
            $(this).attr("fit-attempts", attempts);
        }
    });

    //Reduce el tamaño del texto en los subtítulos si no caben
    //Hay que ir con cuidado que estos campos no tengan definidos estilos inline
    $(".title-text-language:not(.fitted)").each(function () {
        let restore_hidden = false;
        if ($(this).hasClass("hidden")) {
            $(this).removeClass("hidden");
            restore_hidden = true;
        }

        let font_size = 100;

        while ($(this).get(0).scrollWidth > $(this).get(0).clientWidth && font_size > 0) {
            font_size--;
            let padding_top = 1 - (font_size / 100) ** 0.5;
            $(this)
                .find("span")
                .attr("style", "font-size: " + font_size + "%; padding-top: " + padding_top + "em;");
        }
        if (restore_hidden) {
            $(this).addClass("hidden");
        }
        $(this).addClass("fitted");
    });

    $(".reducible-vertical").each(function () {
        let font_size = 100;

        while ($(this).get(0).scrollHeight > $(this).get(0).clientHeight && font_size > 0) {
            font_size--;
            $(this).attr("style", "font-size: " + font_size + "%;");
        }
        while ($(this).get(0).scrollWidth > $(this).get(0).clientWidth && font_size > 0) {
            font_size--;
            $(this).attr("style", "font-size: " + font_size + "%;");
        }
    });

    //Reducimos el texto de los numeros de coche que no caben (se hace por grupos, por uniformidad visual por lo que se cambia el tamaño de fuente del padre)
    $("text.coach").each(function () {
        let bbox = this.getBBox();
        let coach_font_size = 48;
        while (bbox.width > 1.0 * $(this).attr("coach-lenght") && coach_font_size > 0) {
            coach_font_size = coach_font_size - 1;

            $(this).attr("style", "font-size: " + coach_font_size + "px;");
            bbox = this.getBBox();
            let g = $(this).parent();
            let coaches = g.find("text");
            coaches.each(function () {
                $(this).attr("style", "font-size: " + coach_font_size + "px;");
            });
        }
    });

    //Ajuste del rectangulo que tapa la distancia entre posición y tren
    $(".distance-rectangle:not(.adjusted)").each(function () {
        let fill_color = $(this).parent().closest(".platform-train").css("background-color");

        let bbox = this.getBBox();
        let rectangle = $(this).find("rect");

        rectangle.attr("fill", fill_color);
        rectangle.attr("width", bbox.width + 10);
        rectangle.attr("x", bbox.x - 5);

        $(this).addClass("adjusted");
    });
}

function AdVista24_changeUnhiddenLine(object) {
    // Datos del elemento actual
    let total_lines = parseInt(object.attr("total_lines"));
    let old_unhidden_line = parseInt(object.attr("unhidden_line"));

    // Rotamos el elemento visible

    let unhidden_line = old_unhidden_line + 1;

    if (unhidden_line === total_lines) {
        unhidden_line = 0;
    }

    object
        .find("p[line_number='" + unhidden_line + "'],div[line_number='" + unhidden_line + "']")
        .removeClass("hidden")
        .removeClass("opaque");
    object
        .find("p[line_number='" + old_unhidden_line + "'],div[line_number='" + old_unhidden_line + "']")
        .addClass("hidden");
    object.attr("unhidden_line", unhidden_line);
}

function AdVista24_getListWidths(
    font_size,
    show_access,
    show_platform,
    show_product,
    show_number,
    aspect_ratio,
    train_commercial_id_relative_height
) {
    // Obtiene los anchos de los campos de un monitor tipo salidas/llegadas

    let widths = [];

    // Valores para el caso estándar multiplicados por un factor si la letra es más grande
    let factor = 1;
    switch (font_size) {
        case 1:
            // Caso estándar, letra tamaño medio, monitor de 9 líneas en horiziontal (incl. cabecera)telei
            factor = 1; // =9/9
            break;
        case 2:
            // Letra tamaño grande, monitor de 8 líneas en horizontal (incl. cabecera)
            factor = 9 / 8;
            break;
        case 3:
            // Letra tamaño grande, monitor de 7 líneas en horizontal (incl. cabecera)
            factor = 9 / 7;
            break;
    }

    widths["time"] = (11.5 - 0.33 * font_size) * factor;

    widths["commercial_id"] = ((((265 / 80) * 0.85) / 0.58) * train_commercial_id_relative_height) / aspect_ratio;

    if (show_product && !show_number) widths["commercial_id"] = (63 / 100) * widths["commercial_id"] * factor;
    else if (!show_product && show_number) widths["commercial_id"] = (37 / 100) * widths["commercial_id"] * factor;
    else if (!show_product && !show_number) widths["commercial_id"] = 0;

    widths["access"] = 6.5 * factor;
    widths["platform"] = 7.5 * factor;

    if (!show_access) {
        widths["access"] = 0;
        widths["platform"] = (11 - font_size) * factor;
    }

    if (!show_platform) widths["platform"] = 0;

    widths["margin"] = 0.5; //margen entre .journey e .info y entre .station y .type

    widths["accessible_sign"] = 5;

    widths["station"] =
        100 - (widths["time"] + widths["margin"] + widths["commercial_id"] + widths["access"] + widths["platform"]);

    widths["station_with_accessible_sign"] = widths["station"] - widths["accessible_sign"];

    widths["header-text"] = 100 - (widths["access"] + widths["platform"]);
    widths["journey"] = widths["station"];
    widths["info"] = widths["commercial_id"] + widths["access"] + widths["platform"] - 2 * widths["margin"];

    widths["routing"] = widths["platform"];
    widths["info_with_routing"] = widths["info"] - widths["routing"] + widths["margin"];

    widths["clock"] = 17 * factor;
    widths["logo"] = widths["time"];
    widths["title"] = 100 - (widths["clock"] + widths["logo"]);

    // widths para el header de platform y access
    widths["access-header"] = widths["access"] / (widths["clock"] / 100);
    widths["platform-header"] = widths["platform"] / (widths["clock"] / 100);
    widths["legend-space-header"] = 100 - widths["access-header"] - widths["platform-header"];

    return widths;
}

function AdVista24_getAlphabeticalWidths() {
    // Obtiene los anchos de los campos de un monitor tipo salidas/llegadas

    let widths = [];

    widths["letter"] = 2.5;
    widths["name-margin"] = 1;
    widths["name"] = 45.5;
    widths["trains"] = 50;

    widths["train"] = 48.9;
    widths["train-margin"] = 1;
    widths["train-border"] = 100 - 2 * widths["train-margin"] - 2 * widths["train"];

    widths["train-line"] = 30;
    widths["train-time"] = 40;
    widths["train-platform"] = 30;

    let abs_train_line_width = (widths["train-line"] / 100) * widths["train"];
    let abs_train_time_width = (widths["train-time"] / 100) * widths["train"];
    let abs_train_platform_width = (widths["train-platform"] / 100) * widths["train"];

    widths["logo"] = 11.2;

    widths["clock"] =
        (widths["trains"] *
            (2 * abs_train_line_width +
                2 * abs_train_time_width +
                2 * abs_train_platform_width +
                2 * widths["train-margin"] +
                widths["train-border"])) /
        100;

    widths["network"] = 10;

    widths["network-margin"] = 1;

    widths["title"] = 100 - (widths["clock"] + widths["logo"] + widths["network"] + widths["network-margin"]);

    // widths para el header de platform y access
    widths["line-header"] =
        (abs_train_line_width /
            (2 * abs_train_line_width +
                2 * abs_train_time_width +
                2 * abs_train_platform_width +
                2 * widths["train-margin"] +
                widths["train-border"])) *
        100;
    widths["time-header"] =
        (abs_train_time_width /
            (2 * abs_train_line_width +
                2 * abs_train_time_width +
                2 * abs_train_platform_width +
                2 * widths["train-margin"] +
                widths["train-border"])) *
        100;
    widths["platform-header"] =
        (abs_train_line_width /
            (2 * abs_train_line_width +
                2 * abs_train_time_width +
                2 * abs_train_platform_width +
                2 * widths["train-margin"] +
                widths["train-border"])) *
        100;

    widths["legend-space-header"] = widths["time-header"];
    widths["between-trains-space-header"] = 2 * widths["train-margin"] + widths["train-border"];

    return widths;
}

function AdVista24_getPlatformWidths(
    show_platform_sign,
    show_platform_side_left,
    show_platform_side_right,
    show_accessible_sign,
    aspect_ratio,
    train_commercial_id_relative_height
) {
    // Obtiene los anchos de los campos de un monitor tipo vía
    let widths = [];

    widths["sign"] = 20;
    widths["platform-sides"] = 0;
    if (show_platform_side_left) widths["platform-sides"] = widths["platform-sides"] + 5;
    if (show_platform_side_right) widths["platform-sides"] = widths["platform-sides"] + 5;

    widths["margin"] = 1.5;

    widths["commercial_id"] = ((((265 / 80) * 0.85) / 0.58) * train_commercial_id_relative_height) / aspect_ratio;

    widths["accessible_sign"] = 0;
    widths["accessible_margin"] = 0;
    if (show_accessible_sign) {
        widths["accessible_sign"] = ((1 / 0.85) * train_commercial_id_relative_height) / aspect_ratio;
        widths["accessible_margin"] = 1;
    }

    // factor de ajuste cuando se muestra el platform-sign
    let platform_sign_factor = 1;
    if (show_platform_sign) platform_sign_factor = 100 / (100 - widths["sign"]);

    // factor de ajuste cuando se muestran las franjas laterales de orientación de vía (el ancho para el tren es 90% en vez de 100%)
    let platform_side_factor = 1;
    platform_side_factor = 100 / (100 - widths["platform-sides"]);

    widths["margin"] = Math.round(widths["margin"] * platform_sign_factor * platform_side_factor * 100) / 100;
    widths["accessible_margin"] =
        Math.round(widths["accessible_margin"] * platform_sign_factor * platform_side_factor * 100) / 100;
    widths["accessible_sign"] =
        Math.round(widths["accessible_sign"] * platform_sign_factor * platform_side_factor * 100) / 100;
    widths["commercial_id"] =
        Math.round(widths["commercial_id"] * platform_sign_factor * platform_side_factor * 100) / 100;

    widths["time"] =
        100 - (widths["margin"] + widths["accessible_margin"] + widths["commercial_id"] + widths["accessible_sign"]);

    widths["station"] = 100 - 2 * widths["margin"];

    if (show_platform_sign) {
        widths["header"] = 100 - widths["sign"];
    } else {
        widths["header"] = 100;
    }

    widths["stop-time"] = 13 * platform_side_factor;
    widths["stop-circle"] = 5.8 * platform_side_factor;
    widths["stop-time-margin"] = 1.2 * platform_side_factor;
    widths["stop-name-margin"] = 1.2 * platform_side_factor;
    widths["stop-name"] =
        100 - widths["stop-time"] - widths["stop-circle"] - widths["stop-time-margin"] - widths["stop-name-margin"];

    return widths;
}

function AdVista24_headerHTML(monitor_class, languages, widths, show_access, show_platform, subtitle, font_size) {
    // Obtiene código HTML <div> clase header

    // subtitle contiene el código de subtítulo para monitores arrivals y departures
    // subtitle contiene el nombre de imagen (carpeta connections) para poner en cabecera en monitores alphabetical

    let el = $("<div>");
    el.addClass("header");

    el.attr("regular-logo-width", widths["logo"]);
    el.css("--header-logo-width", widths["logo"] + "%");
    el.append(AdVista24_headerLogoHTML(monitor_class));

    if (monitor_class === "alphabetical") {
        if (subtitle !== "") {
            el.append(AdVista24_networkHTML(subtitle, widths["network"]));
            el.append(AdVista24_marginHTML(widths["network-margin"], "network-margin"));
        } else {
            el.append(AdVista24_marginHTML(widths["network"] + widths["network-margin"], "network-margin"));
        }
        subtitle = "";
    }

    el.attr("regular-title-width", widths["title"]);
    el.css("--header-title-width", widths["title"] + "%");
    el.append(AdVista24_titleHTML(monitor_class, languages, subtitle, font_size));

    el.attr("regular-legend-width", widths["clock"]);
    el.css("--header-legend-width", widths["clock"] + "%");

    el.attr("regular-legend-space-width", widths["legend-space-header"]);
    el.css("--header-legend-space-width", widths["legend-space-header"] + "%");

    if (monitor_class !== "alphabetical") {
        el.attr("regular-access-width", widths["access-header"]);
        el.css("--header-access-width", widths["access-header"] + "%");
    } else {
        el.attr("regular-legend-space-between-trains", widths["between-trains-space-header"]);
        el.css("--header-legend-space-between-trains", widths["between-trains-space-header"] + "%");

        el.attr("regular-line-width", widths["line-header"]);
        el.css("--header-line-width", widths["line-header"] + "%");

        el.attr("regular-time-width", widths["time-header"]);
        el.css("--header-time-width", widths["time-header"] + "%");
    }

    el.attr("regular-platform-width", widths["platform-header"]);
    el.css("--header-platform-width", widths["platform-header"] + "%");

    el.css("--header-legend-bar-space-width", "0%");

    if (monitor_class !== "alphabetical") {
        el.append(AdVista24_headerClockLegendHTML(languages, show_access, show_platform));
    } else {
        el.append(AdVista24_headerLegendAlphabeticalHTML(languages));
    }

    el.attr("languages", languages.join(","));
    if (AdVista24_station_name !== "") el.attr("station-name", AdVista24_station_name);

    return el;
}

function AdVista24_versionHTML() {
    let version_div = $("<div>");
    version_div.attr("style", "position: absolute; top: 0; left: 0; width: 2vw; height: 2vw; font-size: 2vw;");
    version_div.addClass("version");
    version_div.html("v1.9");
    return version_div;
}

function AdVista24_headerLogoHTML(monitor_class) {
    // Obtiene código HTML <div> clase header-logo
    // El ancho corresponde a la variable --header-logo-width del elemento padre .header (modificable dinámicamente)

    let el = $("<div>");
    el.addClass("header-logo");

    if (monitor_class === "departures" || monitor_class === "arrivals") {
        let img = $("<img>");
        img.addClass("svg_en_img");
        img.attr("src", AdVista24_getMultimediaFolder("svg") + "adifsumma.svg");
        if (monitor_class === "departures" || monitor_class === "alphabetical") {
            img.addClass("color-gravita-azul-primario");
        } else if (monitor_class === "arrivals") {
            img.addClass("color-gravita-blanco");
        }
        el.append(img);
        el.append(AdVista24_versionHTML());
    } else {
        let logo = $("<div>");
        logo.css("height", "52%");
        logo.css("width", "100%");
        let img = $("<img>");
        img.addClass("svg_en_img");
        img.attr("src", AdVista24_getMultimediaFolder("svg") + "adifsumma.svg");
        img.addClass("color-gravita-azul-primario");
        logo.append(img);
        el.append(logo);
        el.append(AdVista24_clockHTML(100));
        el.append(AdVista24_marginHTML(100, "alphabetical-header-margin-under-clock", 5));
    }

    return el;
}

function AdVista24_logoHTML(monitor_class, width) {
    // Obtiene código HTML <div> clase logo
    let el = $("<div>");
    el.addClass("logo");
    el.attr("style", "width: " + width + "%;");
    let img = $("<img>");
    img.addClass("svg_en_img");
    img.attr("src", AdVista24_getMultimediaFolder("svg") + "adifsumma.svg");
    if (monitor_class === "departures") {
        img.addClass("color-gravita-azul-primario");
    } else if (monitor_class === "arrivals") {
        img.addClass("color-gravita-blanco");
    } else if (monitor_class === "clock") {
        img.addClass("color-gravita-blanco");
    } else if (monitor_class === "black") {
        img.addClass("color-gravita-gris");
    }
    el.append(img);
    return el;
}

function AdVista24_titleHTML(monitor_class, languages, subtitle, font_size) {
    // Obtiene código HTML <div> clase title
    let el = $("<div>");
    el.addClass("title");
    el.append(AdVista24_titleTextHTML(monitor_class, languages, subtitle, font_size));
    el.append(AdVista24_marginHTML(100, "title-text-margin"));
    return el;
}

function AdVista24_titleTextHTML(monitor_class, languages, subtitle, font_size) {
    // Obtiene código HTML <div> clase title-text
    let el = $("<div>");
    el.addClass("title-text");
    el.addClass("scrollableL");
    let i = 0;

    //Obtención de referencia y variable del subtítulo (ej. OPERADOR:Renfe -> REFERENCIA:variable)
    let subtitle_parts = subtitle.split(":");
    let subtitle_reference = subtitle_parts[0];
    let subtitle_variable = "";
    if (subtitle_parts.length > 1) {
        subtitle_variable = subtitle_parts[1];
    }

    // Caso especial tipo de subtítulo station-name: se crean los subtítulos a partir de frase y nombre de estación.
    if (subtitle_reference === "station-name") {
        if (AdVista24_station_name !== "") {
            AdVista24_subtitulos[subtitle_reference] = [];
            languages.forEach(function (language) {
                let max_size = Number(48 - font_size * 7);
                if (AdVista24_station_name.length > max_size) {
                    // Si el nombre de estación es largo, no usamos el salto de línea habiutal y partimos en dos líneas la frase completa
                    AdVista24_subtitulos[subtitle_reference][language] = AdVista24_partir_texto_en_2_lineas(
                        AdVista24_frases["Estación de"][language]
                            .replace("<br>", "")
                            .replace("$", "$" + AdVista24_station_name + "%")
                    )
                        .replace("$", "<b>")
                        .replace("%", "</b>");
                } else {
                    // Si no, dejamos el nombre de la estación en la misma línea
                    AdVista24_subtitulos[subtitle_reference][language] = AdVista24_frases["Estación de"][
                        language
                    ].replace("$", "<b>" + AdVista24_station_name + "</b>");
                }
            });
        } else {
            // Si no hay nombre de la estación, se omite el subtítulo
            subtitle_reference = "";
        }
    }

    languages.forEach(function (language) {
        let p = $("<div>");
        p.attr("line_number", i);
        p.addClass("title-text-language");
        let subtitle_text = "";
        if (subtitle_reference === "station-name") p.addClass("title-text-language-station-name");
        if (subtitle_reference !== "") {
            subtitle_text = AdVista24_subtitulos[subtitle_reference][language].replace("$", subtitle_variable);

            // Transformaciones ortográficas especiales
            // Euskera: Caso ergativo terminado en vocal
            if (typeof AdVista24_euskera_vocablos_ergativo_no_terminado_en_ek !== "undefined") {
                if (language === "EUS" && AdVista24_subtitulos[subtitle_reference][language].includes("$k")) {
                    let vocales = "aeiouáéíóúAEIOUÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜ";
                    if (
                        !vocales.includes(subtitle_variable.slice(-1)) &&
                        !AdVista24_euskera_vocablos_ergativo_no_terminado_en_ek.includes(subtitle_variable)
                    ) {
                        subtitle_text = AdVista24_subtitulos[subtitle_reference][language].replace(
                            "$",
                            subtitle_variable + "e"
                        );
                    }
                }
            }
        }
        if (monitor_class === "departures") {
            if (subtitle_reference === "") p.html(AdVista24_frases["Salidas"][language]);
            else if (AdVista24_subtitulos[subtitle_reference][language].includes("<br>")) {
                p.html(
                    AdVista24_frases["Salidas"][language] +
                        "&nbsp;<span style='font-size: 60%;'>" +
                        subtitle_text +
                        "</span>"
                );
                p.addClass("title-text-language-2-lines");
            } else {
                p.html(AdVista24_frases["Salidas"][language] + "&nbsp;<span>" + subtitle_text + "</span>");
            }
        } else if (monitor_class === "alphabetical") {
            p.html(AdVista24_frases["Trenes más rápidos a su destino"][language]);
        } else {
            if (subtitle_reference === "") p.html(AdVista24_frases["Llegadas"][language]);
            else if (AdVista24_subtitulos[subtitle_reference][language].includes("<br>")) {
                p.html(
                    AdVista24_frases["Llegadas"][language] +
                        "&nbsp;<span style='font-size: 60%;'>" +
                        subtitle_text +
                        "</span>"
                );
                p.addClass("title-text-language-2-lines");
            } else {
                p.html(AdVista24_frases["Llegadas"][language] + "&nbsp;<span>" + subtitle_text + "</span>");
            }
        }
        if (i > 0) p.addClass("hidden");
        i++;
        el.append(p);
    });

    el.attr("total_lines", languages.length);
    el.attr("unhidden_line", 0);
    return el;
}

function AdVista24_clockHTML(width) {
    // Obtiene código HTML <div> clase clock
    let el = $("<div>");
    el.addClass("clock");
    el.addClass("monospace");
    el.attr("style", "width: " + width + "%;");
    let p = $("<p>");
    el.append(p);
    return el;
}

function AdVista24_headerClockLegendHTML(languages, show_access, show_platform) {
    // Obtiene código HTML del <div> de la tabla de trenes para monitores llegadas/salidas
    let el = $("<div>");
    el.addClass("header-legend");

    if (!show_access && !show_platform) el.append(AdVista24_marginHTML(100, "no-legend-margin-sup"));
    el.append(AdVista24_clockHTML(94));
    el.append(AdVista24_marginHTML(6, "clock-lateral-margin", 66));
    if (!show_access && !show_platform) el.append(AdVista24_marginHTML(100, "no-legend-margin-inf"));

    if (show_access || show_platform) {
        let space_header = $("<div>");
        space_header.addClass("legend-margin");
        el.append(space_header);

        if (show_access) {
            let headeraccess = $("<div>");
            headeraccess.addClass("access-header");

            headeraccess.addClass("scrollableL");
            headeraccess.append(AdVista24_marginHTML(2.5, "header-margin"));
            headeraccess.attr("total_lines", languages.length);
            headeraccess.attr("unhidden_line", 0);

            let i = 0;
            languages.forEach(function (language) {
                let accesstag = $("<p>");
                accesstag.addClass("access-tag");
                accesstag.html(AdVista24_frases["Acceso"][language]);
                accesstag.addClass("reducible");
                accesstag.attr("line_number", i);
                if (i > 0) accesstag.addClass("hidden");
                i++;
                headeraccess.append(accesstag);
            });

            headeraccess.append(AdVista24_marginHTML(2.5, "header-margin"));
            el.append(headeraccess);
        }

        if (show_platform) {
            let headerplatform = $("<div>");
            headerplatform.addClass("platform-header");

            headerplatform.addClass("scrollableL");
            headerplatform.append(AdVista24_marginHTML(2.5, "header-margin"));
            headerplatform.attr("total_lines", languages.length);
            headerplatform.attr("unhidden_line", 0);

            let i = 0;
            languages.forEach(function (language) {
                let platformtag = $("<p>");
                platformtag.addClass("platform-tag");
                platformtag.html(AdVista24_frases["Vía"][language]);
                platformtag.addClass("reducible");
                platformtag.attr("line_number", i);
                if (i > 0) platformtag.addClass("hidden");
                i++;
                headerplatform.append(platformtag);
            });

            headerplatform.append(AdVista24_marginHTML(2.5, "header-margin"));

            el.append(headerplatform);
        }

        let bar_space = $("<div>");
        bar_space.addClass("legend-bar-space");
        el.append(bar_space);
    }

    return el;
}

function AdVista24_networkHTML(network, width) {
    // Obtiene código HTML <div> clase logo
    let el = $("<div>");
    el.addClass("network-logo");
    el.attr("style", "width: " + width + "%;");
    let img = $("<img>");
    img.addClass("svg_en_img");
    img.attr("src", AdVista24_getMultimediaFolder("connections") + network + ".svg");
    el.append(img);
    return el;
}

function AdVista24_headerLegendAlphabeticalHTML(languages) {
    let el = $("<div>");
    el.addClass("header-legend");

    let firstTrain = $("<div>");
    firstTrain.addClass("first-second-train");

    firstTrain.addClass("scrollableL");
    firstTrain.append(AdVista24_marginHTML(2.5, "header-margin"));
    firstTrain.attr("total_lines", languages.length);
    firstTrain.attr("unhidden_line", 0);

    let i = 0;
    languages.forEach(function (language) {
        let firstTrainTag = $("<p>");
        firstTrainTag.addClass("first-second-train-tag");
        firstTrainTag.html(AdVista24_frases["Primer tren"][language]);
        // firstTrainTag.addClass("reducible");
        firstTrainTag.attr("line_number", i);
        if (i > 0) firstTrainTag.addClass("hidden");
        i++;
        firstTrain.append(firstTrainTag);
    });

    firstTrain.append(AdVista24_marginHTML(2.5, "header-margin"));
    el.append(firstTrain);

    let secondTrain = $("<div>");
    secondTrain.addClass("first-second-train");

    secondTrain.addClass("scrollableL");
    secondTrain.append(AdVista24_marginHTML(2.5, "header-margin"));
    secondTrain.attr("total_lines", languages.length);
    secondTrain.attr("unhidden_line", 0);

    i = 0;
    languages.forEach(function (language) {
        let secondTrainTag = $("<p>");
        secondTrainTag.addClass("first-second-train-tag");
        secondTrainTag.html(AdVista24_frases["Segundo tren"][language]);
        // secondTrainTag.addClass("reducible");
        secondTrainTag.attr("line_number", i);
        if (i > 0) secondTrainTag.addClass("hidden");
        i++;
        secondTrain.append(secondTrainTag);
    });

    secondTrain.append(AdVista24_marginHTML(2.5, "header-margin"));
    el.append(secondTrain);

    let headerline = $("<div>");
    headerline.addClass("line-header");

    headerline.addClass("scrollableL");
    headerline.append(AdVista24_marginHTML(2.5, "header-margin"));
    headerline.attr("total_lines", languages.length);
    headerline.attr("unhidden_line", 0);

    i = 0;
    languages.forEach(function (language) {
        let linetag = $("<p>");
        linetag.addClass("line-tag");
        linetag.html(AdVista24_frases["Línea"][language]);
        linetag.addClass("reducible");
        linetag.attr("line_number", i);
        if (i > 0) linetag.addClass("hidden");
        i++;
        headerline.append(linetag);
    });

    headerline.append(AdVista24_marginHTML(2.5, "header-margin"));
    el.append(headerline);

    let headertime = $("<div>");
    headertime.addClass("time-header");

    headertime.addClass("scrollableL");
    headertime.append(AdVista24_marginHTML(2.5, "header-margin"));
    headertime.attr("total_lines", languages.length);
    headertime.attr("unhidden_line", 0);

    i = 0;
    languages.forEach(function (language) {
        let platformtag = $("<p>");
        platformtag.addClass("time-tag");
        platformtag.html(AdVista24_frases["Hora"][language]);
        platformtag.addClass("reducible");
        platformtag.attr("line_number", i);
        if (i > 0) platformtag.addClass("hidden");
        i++;
        headertime.append(platformtag);
    });

    headertime.append(AdVista24_marginHTML(2.5, "header-margin"));
    el.append(headertime);

    let headerplatform = $("<div>");
    headerplatform.addClass("platform-header");

    headerplatform.addClass("scrollableL");
    headerplatform.append(AdVista24_marginHTML(2.5, "header-margin"));
    headerplatform.attr("total_lines", languages.length);
    headerplatform.attr("unhidden_line", 0);

    i = 0;
    languages.forEach(function (language) {
        let platformtag = $("<p>");
        platformtag.addClass("platform-tag");
        platformtag.html(AdVista24_frases["Vía"][language]);
        platformtag.addClass("reducible");
        platformtag.attr("line_number", i);
        if (i > 0) platformtag.addClass("hidden");
        i++;
        headerplatform.append(platformtag);
    });

    headerplatform.append(AdVista24_marginHTML(2.5, "header-margin"));
    el.append(headerplatform);

    let space_between_platforms_legend = $("<div>");
    space_between_platforms_legend.addClass("legend-space-between-trains");
    el.append(space_between_platforms_legend);

    el.append(headerline.clone());
    el.append(headertime.clone());
    el.append(headerplatform.clone());

    let bar_space = $("<div>");
    bar_space.addClass("legend-bar-space");
    el.append(bar_space);

    return el;
}

function AdVista24_tableHTML(color_parity, show_all_trains) {
    // Obtiene código HTML del <div> tipo train-table

    // En monitores de salidas, si color_parity = "even" el primer tren sale con azul oscuro, si  table_colors = "odd" sale con azul claro.
    // En monitores de salidas, si color_parity = "even" el primer tren sale con verde claro, si  table_colors = "odd" sale con verde oscuro.
    let el = $("<div>");

    el.addClass("table");
    el.addClass("train-table");
    if (show_all_trains) {
        el.addClass("train-table-all-trains");
    }
    if (color_parity === "inverse") {
        el.attr("colors", "inverse");
    } else {
        el.attr("colors", "normal");
    }
    return el;
}

function AdVista24_alphabeticalTableHTML(color_parity) {
    // Obtiene código HTML del <div> tipo alphabetical-table

    // En monitores de salidas, si color_parity = "even" el primer tren sale con azul oscuro, si  table_colors = "odd" sale con azul claro.
    // En monitores de salidas, si color_parity = "even" el primer tren sale con verde claro, si  table_colors = "odd" sale con verde oscuro.
    let el = $("<div>");

    el.addClass("table");
    el.addClass("alphabetical-table");
    if (color_parity === "inverse") {
        el.attr("colors", "inverse");
    } else {
        el.attr("colors", "normal");
    }
    return el;
}

function AdVista24_trainHTML(
    train,
    languages,
    monitor_class,
    widths,
    journey_scroll,
    observation_scroll,
    show_access,
    show_platform,
    show_product,
    show_number,
    show_stops,
    countdown_active,
    countdown_traffics,
    estimated_time_traffics,
    show_platform_preview,
    sectorization_mode,
    platform_routing,
    aspect_ratio,
    abs_row_height
) {
    // Obtiene código HTML de elemento clase .train-row

    let el = $("<div>");
    el.attr("train-id", train.id);
    el.addClass("train-row");

    // if (train.status === "cancelled") el.attr("style","background-color: #521625;");    //Añadimos la información complementaria del tren
    train = AdVista24_trainInfoComplement(train);

    el.append(
        AdVista24_trainTimeHTML(
            train,
            monitor_class,
            widths["time"],
            countdown_active,
            countdown_traffics,
            estimated_time_traffics
        )
    );

    if (train.accessible_sign === true && train.status !== "cancelled") {
        el.append(AdVista24_trainDirectionHTML(train, monitor_class, widths["station_with_accessible_sign"], 0));
        el.append(AdVista24_trainAccessibleSignHTML(widths["accessible_sign"]));
    } else {
        el.append(AdVista24_trainDirectionHTML(train, monitor_class, widths["station"], 0));
    }

    el.append(AdVista24_marginHTML(widths["margin"], "list-margin-sup"));

    if (show_product || show_number)
        el.append(
            AdVista24_trainCommercialIdHTML(train, monitor_class, widths["commercial_id"], show_product, show_number)
        );

    if (show_access) el.append(AdVista24_trainAccessHTML(train, monitor_class, widths["access"]));
    if (show_platform)
        el.append(
            AdVista24_trainPlatformHTML(
                train,
                monitor_class,
                widths["platform"],
                show_platform_preview,
                sectorization_mode
            )
        );

    el.append(
        AdVista24_trainStatusHTML(
            train,
            languages,
            monitor_class,
            widths["time"],
            countdown_active,
            countdown_traffics,
            estimated_time_traffics
        )
    );
    el.append(
        AdVista24_trainHorizontalJourneyHTML(train, monitor_class, widths["journey"], journey_scroll, show_stops)
    );
    el.append(AdVista24_marginHTML(widths["margin"], "list-margin-inf"));
    el.append(AdVista24_marginHTML(widths["margin"], "list-margin-inf"));

    // Añadimos la observación. El ancho es más pequeño si hay que añadir información de platform-routing
    let visible_platform = "";
    if (train.platform === "") {
        if (typeof train.platform_preview !== "undefined") visible_platform = train.platform_preview;
    } else {
        visible_platform = train.platform;
    }
    if (visible_platform in platform_routing && train.status !== "cancelled") {
        // Con platform-routing
        el.append(
            AdVista24_trainInfoHTML(train, widths["info_with_routing"], observation_scroll, monitor_class, languages)
        );
        el.append(
            AdVista24_trainPlatformRoutingHTML(
                widths["routing"],
                monitor_class,
                platform_routing[visible_platform],
                aspect_ratio,
                abs_row_height
            )
        );
        el.attr("platform-routing", "true");
    } else {
        // Sin platform-routing
        el.append(AdVista24_trainInfoHTML(train, widths["info"], observation_scroll, monitor_class, languages));
        el.append(AdVista24_marginHTML(widths["margin"], "list-margin-inf-end"));
        el.attr("platform-routing", "false");
    }
    return el;
}

function AdVista24_trainTimeHTML(
    train,
    monitor_class,
    width,
    countdown_active,
    countdown_traffics,
    estimated_time_traffics
) {
    // Obtiene el elemento clase .train-time
    let el = $("<div>");

    let check_value = "";

    el.addClass("train-time");

    el.attr("style", "width: " + width + "%;");

    let ps = $("<p>");

    switch (monitor_class) {
        case "departures":
            if (countdown_active && AdVista24_isInCountdownMode(train)) {
                // Muestra cuenta atrás
                ps.html(train.countdown + " min");
                check_value = check_value + train.countdown + " min";
                el.append(ps);
                el.addClass("monospace");
                if (train.delay_out > 5 && !countdown_traffics.includes(train.traffic_type)) {
                    //Cuenta atrás con color de retraso
                    el.addClass("countdown-delayed");
                }
                if (
                    parseInt(train.countdown) === 0 ||
                    (Boolean(train.immediate_out) === true && !countdown_traffics.includes(train.traffic_type))
                ) {
                    //Cuenta atrás parpadeando
                    check_value = check_value + "$";
                    el.addClass("blinking-ready");
                }
            } else {
                // Resto de casos, muestra salida teórica (o salida prevista si el tráfico está en estimated-time-traffics)
                if (estimated_time_traffics.includes(train.traffic_type)) {
                    ps.html(AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out));
                    check_value = check_value + AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out);
                } else {
                    ps.html(AdVista24_isoToHoraMinutos(train.departure_time, 0));
                    check_value = check_value + AdVista24_isoToHoraMinutos(train.departure_time, 0);
                }
                el.append(ps);
                el.addClass("monospace");
                if (Boolean(train.immediate_out) === true) {
                    check_value = check_value + "$";
                    el.addClass("blinking-ready");
                }
            }

            break;

        case "arrivals":
            if (estimated_time_traffics.includes(train.traffic_type)) {
                ps.html(AdVista24_isoToHoraMinutos(train.arrival_time, train.delay_in));
                check_value = check_value + AdVista24_isoToHoraMinutos(train.arrival_time, train.delay_in);
            } else {
                ps.html(AdVista24_isoToHoraMinutos(train.arrival_time, 0));
                check_value = check_value + AdVista24_isoToHoraMinutos(train.arrival_time, 0);
            }
            el.append(ps);
            el.addClass("monospace");
            if (Boolean(train.immediate_in) === true) {
                check_value = check_value + "$";
                el.addClass("blinking-ready");
            }
            break;
    }
    if (train.status === "cancelled") {
        el.addClass("cancelled");
        el.removeClass("blinking-ready");
        check_value = check_value + "#CANCELLED#";
    }
    if (train.status === "delayed") {
        el.removeClass("blinking-ready");
    }
    el.attr("check-value", check_value);
    return el;
}

function AdVista24_platformTimeHTML(train, width, countdown_traffics, estimated_time_traffics) {
    // Obtiene el elemento clase .train-time
    let el = $("<div>");

    let check_value = "";

    el.addClass("train-time");

    el.attr("style", "width: " + width + "%;");

    let ps = $("<p>");

    //En función de si el tráfico está en countdown-traffics
    if (countdown_traffics.includes(train.traffic_type) && AdVista24_isInCountdownMode(train)) {
        //Se muestra cuenta atrás
        ps.html(train.countdown + " min");
        check_value = check_value + train.countdown + " min";
        el.append(ps);
        el.addClass("monospace");
        if (parseInt(train.countdown) === 0) {
            //Cuenta atrás parpadeando
            check_value = check_value + "$";
            el.addClass("blinking-ready");
        }
    } else {
        if (estimated_time_traffics.includes(train.traffic_type)) {
            // Se muestra hora prevista
            ps.html(AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out));
            check_value = check_value + AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out);
            el.append(ps);
            el.addClass("monospace");
            if (Boolean(train.immediate_out) === true) {
                check_value = check_value + "$";
                el.addClass("blinking-ready");
            }
        } else {
            // Se muestra hora teorica (más prevista si va retrasado)
            if (train.delay_out > 5) {
                ps.html(
                    AdVista24_isoToHoraMinutos(train.departure_time, 0) +
                        " <span>" +
                        AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out) +
                        "</span>"
                );
                check_value = check_value + AdVista24_isoToHoraMinutos(train.departure_time, 0);
                check_value = check_value + "R" + AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out);
            } else {
                ps.html(AdVista24_isoToHoraMinutos(train.departure_time, 0));
                check_value = check_value + AdVista24_isoToHoraMinutos(train.departure_time, 0);
            }
            el.append(ps);
            el.addClass("monospace");
            if (Boolean(train.immediate_out) === true) {
                check_value = check_value + "$";
                el.addClass("blinking-ready");
            }
        }
    }

    el.attr("check-value", check_value);
    return el;
}

function AdVista24_trainDirectionHTML(train, monitor_class, width, abbreviation) {
    // Obtiene el elemento clase .train-direction
    let el = $("<div>");
    let check_value = "";
    el.addClass("train-direction");
    el.addClass("scrollableF1");

    el.attr("style", "width: " + width + "%;");

    switch (monitor_class) {
        case "departures":
            el.addClass("destination-station");
            for (let i = 0; i < train.destinations.length; i++) {
                let d = $("<div style='width: 100%; height: 100%; font-size: 100%;'>");
                d.attr("direction_number", i);
                d.append(AdVista24_stationHTML(train.destinations[i], "departures", abbreviation, true, true));
                if (typeof train.destinations[i].line !== "undefined") {
                    check_value = check_value + "[" + train.destinations[i].line + "]";
                    if (typeof train.destinations[i].line_pic_filename !== "undefined")
                        check_value = check_value + "[(" + train.destinations[i].line_pic_filename + ")]";
                    else if (
                        typeof AdVista24_trains_data.multimedia_info.line_pic_filenames[train.destinations[i].line] !==
                        "undefined"
                    )
                        check_value =
                            check_value +
                            "[(" +
                            AdVista24_trains_data.multimedia_info.line_pic_filenames[train.destinations[i].line] +
                            ")]";
                }

                if (typeof AdVista24_station_list[train.destinations[i].code] !== "undefined") {
                    if (typeof AdVista24_station_list[train.destinations[i].code].picto !== "undefined")
                        check_value =
                            check_value + "(" + AdVista24_station_list[train.destinations[i].code].picto + ")";
                }
                check_value = check_value + train.destinations[i].code + "$";
                if (typeof AdVista24_trains_data.multimedia_info.multimedia_version !== "undefined")
                    check_value = check_value + "v=" + AdVista24_trains_data.multimedia_info.multimedia_version + "$";

                d.attr("line_number", i);
                d.attr("abbrev", 0);
                d.addClass("train-direction-iteration");
                if (i > 0) {
                    d.addClass("opaque");
                    d.addClass("hidden");
                }
                el.append(d);
            }

            el.attr("total_lines", train.destinations.length);
            el.attr("unhidden_line", 0);
            break;
        case "arrivals":
            for (let i = train.origins.length - 1; i >= 0; i--) {
                let d = $("<div style='width: 100%; height: 100%; font-size: 100%;'>");
                d.attr("direction_number", i);
                d.append(AdVista24_stationHTML(train.origins[i], "arrivals", abbreviation, true, true));
                if (typeof train.origins[i].line !== "undefined") {
                    check_value = check_value + "[" + train.origins[i].line + "]";
                    if (typeof train.origins[i].line_pic_filename !== "undefined")
                        check_value = check_value + "[(" + train.origins[i].line_pic_filename + ")]";
                    else if (
                        typeof AdVista24_trains_data.multimedia_info.line_pic_filenames[train.origins[i].line] !==
                        "undefined"
                    )
                        check_value =
                            check_value +
                            "[(" +
                            AdVista24_trains_data.multimedia_info.line_pic_filenames[train.origins[i].line] +
                            ")]";
                }

                if (typeof AdVista24_station_list[train.origins[i].code].picto !== "undefined")
                    check_value = check_value + "(" + AdVista24_station_list[train.origins[i].code].picto + ")";
                check_value = check_value + train.origins[i].code + "$";
                if (typeof AdVista24_trains_data.multimedia_info.multimedia_version !== "undefined")
                    check_value = check_value + "v=" + AdVista24_trains_data.multimedia_info.multimedia_version + "$";

                d.attr("line_number", train.origins.length - 1 - i);
                d.attr("abbrev", 0);
                d.addClass("train-direction-iteration");
                if (i > 0) {
                    d.addClass("opaque");
                    d.addClass("hidden");
                }
                el.append(d);
            }

            el.attr("total_lines", train.origins.length);
            el.attr("unhidden_line", 0);
            break;
    }

    if (train.status === "cancelled") {
        el.addClass("cancelled");
        check_value = check_value + "#CANCELLED#";
    }
    el.attr("check-value", check_value);

    return el;
}

function AdVista24_trainAlphabeticalDirectionHTML(train, width, abbreviation) {
    // Obtiene el elemento clase .train-direction
    let el = $("<div>");
    let check_value = "";
    el.addClass("train-alphabetical-direction");
    el.addClass("scrollableF1");

    el.attr("style", "width: " + width + "%;");

    el.addClass("destination-station");
    for (let i = 0; i < train.destinations.length; i++) {
        let d = $("<div style='width: 100%; height: 100%; font-size: 100%;'>");
        d.attr("direction_number", i);
        d.append(AdVista24_stationHTML(train.destinations[i], "departures", abbreviation, false, false));

        d.attr("line_number", i);
        d.attr("abbrev", 0);
        d.addClass("train-direction-iteration");
        if (i > 0) {
            d.addClass("opaque");
            d.addClass("hidden");
        }
        el.append(d);
    }

    el.attr("total_lines", train.destinations.length);
    el.attr("unhidden_line", 0);
    el.attr("check-value", check_value);

    return el;
}

function AdVista24_trainCommercialIdHTML(train, monitor_class, width, show_product, show_number) {
    // Obtiene el elemento clase .train-commercial-id

    // Reordenación de los números de tren y tipos de forma que:
    // En cada tipo de tren solo haya un máximo de 2 números de tren, creando nuevos tipos de tren iguales para cubir el resto de números
    // Si hay diferentes números de tren para el mismo tipo de tren se agrupan si se puede.

    // Copia de números comerciales:
    let commercial_ids = [...train.commercial_id];

    // Eliminamos las identidades comemrciales que no procedan por restricción origen/destino
    // Por si no existiera ninguna identidad comercial compatible, se preservará la primera declarada
    for (let j = commercial_ids.length - 1; j >= 0; j--) {
        if (typeof commercial_ids[j].restricted !== "undefined" && commercial_ids.length > 1) {
            if (monitor_class === "departures" && commercial_ids[j].restricted === "destination") {
                commercial_ids.splice(j, 1);
            }
            if (monitor_class === "arrivals" && commercial_ids[j].restricted === "origin") {
                commercial_ids.splice(j, 1);
            }
        }
    }

    // Si no ha quedado ningun elemento en vigor después de las eliminaciones anteriores

    //Sobre cada elemento, miramos si hay otros números de tren para el mismo tipo y los fusionamos
    let i = 0;
    while (i < commercial_ids.length) {
        let j = i + 1;
        while (j < commercial_ids.length) {
            if (
                commercial_ids[i].product === commercial_ids[j].product &&
                commercial_ids[i].show_pic === commercial_ids[j].show_pic
            ) {
                commercial_ids[i].numbers.push(...commercial_ids[j].numbers);
                commercial_ids.splice(j, 1);
            } else {
                j++;
            }
        }
        i++;
    }

    //Eliminamos tipos de tren repetidos y ordenamos en ascendente
    for (let i = 0; i < commercial_ids.length; i++) {
        if (commercial_ids[i].numbers.length > 1) {
            commercial_ids[i].numbers = [...new Set(commercial_ids[i].numbers)];
            commercial_ids[i].numbers.sort();
        }
    }

    //Creamos elementos extras si el tipo de tren tiene más de 2 números,
    let commercial_ids_reordered = [];

    commercial_ids.forEach(function (comid) {
        if (comid.numbers.length > 2) {
            let i = 0;
            while (i < comid.numbers.length) {
                let comid_copia = { ...comid };
                comid_copia.numbers = comid_copia.numbers.slice(i, i + 2);
                commercial_ids_reordered.push(comid_copia);

                i = i + 2;
            }
        } else {
            commercial_ids_reordered.push(comid);
        }
    });

    // Anchos reltivos para el producto y el número
    let product_width = 58;
    let number_width = 38;
    let margin_width = 2;

    // Si algun elemento no se muestra:
    if (show_product) {
        if (!show_number) {
            product_width = 96;
            number_width = 0;
            margin_width = 4;
        }
    } else {
        if (show_number) {
            product_width = 0;
            number_width = 96;
            margin_width = 4;
        } else {
            product_width = 0;
            number_width = 0;
            margin_width = 0;
        }
    }

    let el = $("<div>");
    let check_value = "@";

    el.addClass("train-commercial-id");
    el.attr("style", "width: " + width + "%;");
    el.addClass("scrollableF2");

    i = 0;
    commercial_ids_reordered.forEach(function (com_id) {
        let d = $("<div>");
        d.addClass("train-commercial-id-iteration");
        d.attr("line_number", i);

        if (show_product) {
            d.append(AdVista24_trainProductHTML(com_id, product_width));
            d.append(AdVista24_marginHTML(margin_width, "train-commercial-id-margin"));
        }

        d.append(AdVista24_trainNumberHTML(train, com_id, number_width));
        d.append(AdVista24_marginHTML(margin_width, "train-commercial-id-margin"));

        if (com_id.show_pic) check_value = check_value + com_id.pic_filename + "$";
        else check_value = check_value + com_id.product + "$";
        if (typeof AdVista24_trains_data.multimedia_info.multimedia_version !== "undefined")
            check_value = check_value + "v=" + AdVista24_trains_data.multimedia_info.multimedia_version + "$";
        if (com_id.show_pic) check_value = check_value + "$";
        check_value = check_value + com_id.numbers[0] + "%";
        if (typeof com_id.numbers[1] !== "undefined") check_value + com_id.numbers[1] + "%";
        i++;

        el.append(d);
    });

    if (train.status === "cancelled") check_value = check_value + "#CANCELLED#";

    el.attr("total_lines", commercial_ids_reordered.length);
    el.attr("unhidden_line", 0);
    el.attr("check-value", check_value);
    return el;
}

function AdVista24_trainProductHTML(commercial_id, width) {
    // Obtiene el elemento clase .train-type
    let el = $("<div>");
    el.addClass("train-product");
    el.attr("style", "width: " + width + "%;");
    if (typeof commercial_id.show_pic === "undefined") commercial_id.show_pic = true;
    if (typeof commercial_id.pic_filename === "undefined") {
        if (typeof AdVista24_trains_data.multimedia_info.product_pic_filenames[commercial_id.product] !== "undefined")
            commercial_id.pic_filename =
                AdVista24_trains_data.multimedia_info.product_pic_filenames[commercial_id.product];
        else commercial_id.pic_filename = commercial_id.product;
    }

    if (!AdVista24_verifyTrainProductImageExtension(commercial_id.pic_filename))
        commercial_id.pic_filename = commercial_id.pic_filename + ".png";

    if (commercial_id.show_pic) {
        let img1 = $("<img>");
        if (commercial_id.pic_filename.endsWith(".svg")) img1.addClass("svg_en_img");
        let pic_filename = commercial_id.pic_filename;
        if (typeof AdVista24_trains_data.multimedia_info.multimedia_version !== "undefined")
            pic_filename = pic_filename + "?v=" + AdVista24_trains_data.multimedia_info.multimedia_version;
        img1.attr("src", AdVista24_getMultimediaFolder("trains") + pic_filename);
        el.append(img1);
    } else {
        el.append(AdVista24_marginHTML(3, "train-product-margin"));
        let p = $("<div>");
        p.addClass("reducible-vertical");
        p.addClass("train-product-tag");
        p.html("<p>" + commercial_id.product + "</p>");
        el.append(p);
        el.append(AdVista24_marginHTML(3, "train-product-margin"));
    }
    return el;
}

function AdVista24_verifyTrainProductImageExtension(pic_filename) {
    return pic_filename.endsWith(".png") || pic_filename.endsWith(".svg");
}

function AdVista24_trainNumberHTML(train, commercial_id, width) {
    // Obtiene el elemento clase .train-number
    let el = $("<div>");
    el.addClass("train-number");
    el.addClass("monospace");

    if (train.status === "cancelled") el.addClass("cancelled");

    el.attr("style", "width: " + width + "%;");
    let ps = $("<div>");
    ps.addClass("train-number-tag");
    ps.addClass("reducible");
    el.append(ps);
    if (typeof commercial_id.numbers[1] !== "undefined") {
        ps.html("<p>" + commercial_id.numbers[0] + "<br>" + commercial_id.numbers[1] + "</p>");
    } else {
        ps.html("<p>" + commercial_id.numbers[0] + "</p>");
    }
    return el;
}

function AdVista24_trainAccessibleSignHTML(width) {
    let el = $("<div>");
    el.addClass("train-accessible-sign");
    el.attr("style", "width: " + width + "%;");

    let img = $("<img>");
    img.addClass("svg_en_img");
    let pic_filename = "accessible_sign.svg";
    if (typeof AdVista24_trains_data.multimedia_info.multimedia_version !== "undefined")
        pic_filename = pic_filename + "?v=" + AdVista24_trains_data.multimedia_info.multimedia_version;
    img.attr("src", AdVista24_getMultimediaFolder("svg") + pic_filename);
    el.append(img);
    return el;
}

function AdVista24_trainAccessHTML(train, monitor_class, width) {
    // Obtiene el elemento clase .train-access
    let el = $("<div>");
    let check_value = "";

    el.addClass("train-access");
    el.attr("style", "width: " + width + "%;");
    let ps = $("<div>");
    ps.addClass("access-tag");
    ps.addClass("reducible");

    // Si el tren está cancelado, no mostramos nada.
    if (train.status === "cancelled") {
        ps.html("");
        check_value = "CANCELLED";
        el.append(ps);
        el.attr("check-value", check_value);
        return el;
    }

    let show_access_opening_time = false;
    if (monitor_class === "departures") {
        // Comprobamos si hay que mostrar los accesos o la hora prevista de apertura

        let opening_margin = 0;
        if (typeof train.departures_access_opening_margin !== "undefined") {
            opening_margin = parseInt(train.departures_access_opening_margin);
            if (opening_margin > 0 && opening_margin <= AdVista24_minutesToDeparture(train))
                show_access_opening_time = true;
        }

        if (show_access_opening_time) {
            // Mostramos hora prevista de apertura de acceso
            let opening_time = AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out - opening_margin);
            ps.addClass("access-time-departures");
            ps.addClass("monospace");
            let img2 = $("<img>");
            img2.addClass("picto");
            img2.addClass("svg_en_img");
            img2.attr("src", AdVista24_getMultimediaFolder("svg") + "clock.svg");
            img2.addClass("color-gravita-verde-primario");
            ps.append(img2);
            ps.html(ps.html() + opening_time);
            check_value = "H" + opening_time;
        } else {
            // Mostramos los accesos
            if (Array.isArray(train.departures_access)) {
                // Eliminamos los textos después del carácter "_" y eliminamos duplicados o valores vacíos
                let access_list_texts = train.departures_access.map((item) => item.toString().split("_")[0]);
                let access_list_texts_unique = [...new Set(access_list_texts)];
                access_list_texts_unique = access_list_texts_unique.filter((acc) => acc !== "");
                ps.html(ps.html() + access_list_texts_unique.join("·"));
                check_value = access_list_texts_unique.join("·");
            } else {
                ps.html("");
                check_value = "";
            }
        }
    } else {
        // Monitor de llegadas

        // Comprobamos si hay que mostrar los accesos o la hora prevista de apertura

        let opening_margin = 0;
        if (typeof train.arrivals_access_opening_margin !== "undefined") {
            opening_margin = parseInt(train.arrivals_access_opening_margin);
            if (opening_margin > 0 && opening_margin <= AdVista24_minutesToArrival(train))
                show_access_opening_time = true;
        }

        if (show_access_opening_time) {
            // Mostramos hora prevista de apertura de acceso
            let opening_time = AdVista24_isoToHoraMinutos(train.departure_time, -opening_margin + train.delay_in);
            ps.addClass("access-time-arrivals");
            ps.addClass("monospace");
            let img2 = $("<img>");
            img2.addClass("picto");
            img2.addClass("svg_en_img");
            img2.attr("src", AdVista24_getMultimediaFolder("svg") + "clock.svg");
            img2.addClass("color-gravita-azul-electrico");
            ps.append(img2);
            ps.html(ps.html() + opening_time);
            check_value = "H" + opening_time;
        } else {
            // Mostramos los accesos
            if (Array.isArray(train.arrivals_access)) {
                // Eliminamos los textos después del carácter "_" y eliminamos duplicados o valores vacíos
                let access_list_texts = train.arrivals_access.map((item) => item.toString().split("_")[0]);
                let access_list_texts_unique = [...new Set(access_list_texts)];
                access_list_texts_unique = access_list_texts_unique.filter((acc) => acc !== "");
                ps.html(access_list_texts_unique.join("·"));
                check_value = access_list_texts_unique.join("·");
            } else {
                ps.html("");
                check_value = "";
            }
        }
    }

    el.append(ps);
    el.attr("check-value", check_value);
    return el;
}

function AdVista24_trainPlatformHTML(train, monitor_class, width, show_platform_preview, sectorization_mode) {
    // Obtiene el elemento clase .train-platform, .train-platform-preview o .train-platform-arrival-preview
    let check_value = "";

    let el = $("<div>");
    el.addClass("train-platform");
    el.attr("style", "width: " + width + "%;");

    let ps = $("<div>");
    ps.addClass("train-platform-tag");
    ps.addClass("reducible");

    // Si el tren está cancelado, no mostramos nada.
    if (train.status === "cancelled") {
        ps.html("");
        check_value = "CANCELLED";
        el.attr("check-value", check_value);
        return el;
    }

    // Generamos las cadenas que contienen los sectores
    let train_sectors_string = "";
    let train_sectors_string_in = "";

    // Si el valor del modo de sectorización no es uno de los admitidos, asume el valor por defefecto
    const sectorization_mode_options = ["all", "first_and_last", "middle", "middle_up", "none"];
    if (!sectorization_mode_options.includes(sectorization_mode)) {
        if (typeof AdVista24_trains_data.station_settings.platforms[train.platform] !== "undefined") {
            if (
                typeof AdVista24_trains_data.station_settings.platforms[train.platform].sectorization_mode !==
                "undefined"
            ) {
                sectorization_mode =
                    AdVista24_trains_data.station_settings.platforms[train.platform].sectorization_mode;
            }
        }
        if (!sectorization_mode_options.includes(sectorization_mode)) {
            sectorization_mode = AdVista24_default_sectorization_mode;
        }
    }

    switch (sectorization_mode) {
        case "all":
            // Se muestran todos los sectores
            if (typeof train.sectors_in !== "undefined") {
                train.sectors_in.forEach(function (sector) {
                    train_sectors_string_in = train_sectors_string_in + sector;
                });
            }
            if (typeof train.sectors !== "undefined") {
                train.sectors.forEach(function (sector) {
                    train_sectors_string = train_sectors_string + sector;
                });
            }
            break;

        case "first_and_last":
            // Se muestra solo el primero y el último sector
            if (typeof train.sectors_in !== "undefined") {
                if (train.sectors_in.length > 1) {
                    train_sectors_string_in = train.sectors_in[0] + train.sectors_in[train.sectors_in.length - 1];
                } else if (train.sectors_in.length > 0) {
                    train_sectors_string_in = train.sectors_in[0];
                }
            }
            if (typeof train.sectors !== "undefined") {
                if (train.sectors.length > 1) {
                    train_sectors_string = train.sectors[0] + train.sectors[train.sectors.length - 1];
                } else if (train.sectors.length > 0) {
                    train_sectors_string = train.sectors[0];
                }
            }
            break;

        case "middle":
            // Se muestra el sector central (redondeo inferior)
            if (typeof train.sectors_in !== "undefined") {
                if (train.sectors_in.length > 0)
                    train_sectors_string_in = train.sectors_in[Math.floor((train.sectors_in.length - 1) / 2)];
            }
            if (typeof train.sectors !== "undefined") {
                if (train.sectors.length > 0)
                    train_sectors_string = train.sectors[Math.floor((train.sectors.length - 1) / 2)];
            }
            break;

        case "middle_up":
            // Se muestra el sector central (redondeo superior)
            if (typeof train.sectors_in !== "undefined") {
                if (train.sectors_in.length > 1)
                    train_sectors_string_in = train.sectors_in[Math.ceil((train.sectors_in.length - 1) / 2)];
                else if (train.sectors_in.length > 0) train_sectors_string_in = train.sectors_in[0];
            }
            if (typeof train.sectors !== "undefined") {
                if (train.sectors.length > 1)
                    train_sectors_string = train.sectors[Math.ceil((train.sectors.length - 1) / 2)];
                else if (train.sectors.length > 0) train_sectors_string = train.sectors[0];
            }
            break;

        case "none":
            // Se ocultan los sectores
            break;
    }

    if (typeof train.platform_in === "undefined" || monitor_class === "departures" || monitor_class === "platform") {
        // Monitores de salidas, de andén, o de llegada sin vía específica de llegada definida.
        if (train.platform === "") {
            // Mostramos via previa de salida
            if (typeof train.platform_preview !== "undefined" && show_platform_preview) {
                // No se muestra el texto de vía previa a partir del caracter "_". El texto oculto sigue vigente para filtrar.
                let platform_preview_text = train.platform_preview.split("_")[0];
                ps.html("<p>" + platform_preview_text + "</p>");
                ps.addClass("preview");
                el.addClass("train-platform-preview");
                check_value = "PVW$" + platform_preview_text;
            } else {
                ps.html("");
            }
        } else {
            // Mostramos vía confirmada de salida
            if (train.platform !== "BUS" || monitor_class === "platform") {
                ps.html("<p>" + train.platform + train_sectors_string + "</p>");

                check_value = train.platform + train_sectors_string;
            } else {
                // Vía "BUS"
                let img = $("<img>");
                img.addClass("picto");
                img.addClass("svg_en_img");
                img.attr("src", AdVista24_getMultimediaFolder("svg") + "bus" + ".svg");
                if (monitor_class === "arrivals") {
                    img.addClass("color-gravita-azul-primario");
                } else {
                    img.addClass("color-gravita-blanco");
                }
                check_value = "BUS";
                ps.removeClass("reducible");
                ps.append(img);
            }
        }
    } else {
        // Monitores de llegadas con vía específica de llegada definida.
        if (train.platform_in === "") {
            // Mostramos vía previa de llegada
            if (typeof train.platform_preview_in !== "undefined" && show_platform_preview) {
                // No se muestra el texto de vía previa a partir del caracter "_". El texto oculto sigue vigente para filtrar.
                let platform_preview_text = train.platform_preview_in.split("_")[0];
                ps.html("<p>" + platform_preview_text + "</p>");
                ps.addClass("preview");
                el.addClass("train-platform-preview");
                check_value = "PVW$" + platform_preview_text;
            } else {
                ps.html("");
            }
        } else {
            // Mostramos vías confirmada de llegada
            if (train.platform_in !== "BUS") {
                ps.html("<p>" + train.platform_in + train_sectors_string_in + "</p>");

                check_value = train.platform_in + train_sectors_string_in;
            } else {
                // Vía "BUS" de llegada
                let img = $("<img>");
                img.addClass("picto");
                img.addClass("svg_en_img");
                img.attr("src", AdVista24_getMultimediaFolder("svg") + "bus" + ".svg");
                img.addClass("color-gravita-azul-primario");
                check_value = "BUS";
                ps.removeClass("reducible");
                ps.append(img);
            }
        }
    }

    el.attr("check-value", check_value);
    el.append(ps);
    return el;
}

function AdVista24_trainStatusHTML(
    train,
    languages,
    monitor_class,
    width,
    countdown_active,
    countdown_traffics,
    estimated_time_traffics
) {
    // Obtiene el elemento clase .train-status
    let el = $("<div>");
    let check_value = "";

    el.addClass("monospace");
    el.addClass("train-status");
    el.attr("style", "width: " + width + "%;");
    if (train.status === "delayed") {
        let i = 0;
        languages.forEach(function (language) {
            let p = $("<div>");
            p.html(AdVista24_frases["Demorado"][language]);
            check_value = check_value + "#" + AdVista24_frases["Demorado"][language];
            p.addClass("status-tag");
            p.addClass("unfitted");
            p.attr("line_number", i);
            i++;

            el.append(p);
        });
        el.addClass("scrollableL");
        el.attr("total_lines", languages.length);
        el.attr("unhidden_line", 0);
        el.attr("check-value", check_value);
        return el;
    }

    if (train.status === "cancelled") {
        let i = 0;
        languages.forEach(function (language) {
            let p = $("<div>");
            p.html(AdVista24_frases["Cancelado"][language]);
            check_value = check_value + "#" + AdVista24_frases["Cancelado"][language];
            p.addClass("status-tag");
            p.addClass("unfitted");
            el.addClass("cancelled");
            p.attr("line_number", i);
            i++;

            el.append(p);
        });
        el.addClass("scrollableL");
        el.attr("total_lines", languages.length);
        el.attr("unhidden_line", 0);
        el.attr("check-value", check_value);
        return el;
    }

    let p = $("<div>");
    switch (monitor_class) {
        case "departures":
            if (countdown_active && AdVista24_isInCountdownMode(train)) {
                // En hora sale el tren en cuenta atrás
                if (countdown_traffics.includes(train.traffic_type)) {
                    // No requiere hora teórica
                    p.html("");
                } else {
                    // Requiere hora teórica
                    el.addClass("teorical");
                    p.html(AdVista24_isoToHoraMinutos(train.departure_time, 0));
                    check_value = check_value + "#T#" + AdVista24_isoToHoraMinutos(train.departure_time, 0);
                    if (
                        parseInt(train.countdown) === 0 ||
                        (Boolean(train.immediate_out) === true && !countdown_traffics.includes(train.traffic_type))
                    ) {
                        el.addClass("blinking-ready");
                        check_value = check_value + "$";
                    }
                }
            } else {
                if (estimated_time_traffics.includes(train.traffic_type)) {
                    // En hora sale la hora prevista, no ponemos nada.
                    p.html("");
                } else if (train.delay_out >= 5) {
                    // En hora sale la hora teórica, ponemos la prevista si prodcede
                    p.html(AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out));
                    check_value =
                        check_value + "#R#" + AdVista24_isoToHoraMinutos(train.departure_time, train.delay_out);
                    if (Boolean(train.immediate_out) === true) {
                        el.addClass("blinking-ready");
                        check_value = check_value + "$";
                    }
                } else {
                    p.html("");
                }
            }
            break;

        case "arrivals":
            el.attr("style", "width: " + width + "%;");
            if (estimated_time_traffics.includes(train.traffic_type)) {
                // En hora sale la hora prevista, no ponemos nada.
                p.html("");
            } else if (train.delay_in >= 5) {
                // En hora sale la hora teórica, ponemos la prevista si procede
                p.html(AdVista24_isoToHoraMinutos(train.arrival_time, train.delay_in));
                check_value = check_value + "#R#" + AdVista24_isoToHoraMinutos(train.arrival_time, train.delay_in);
                if (Boolean(train.immediate_in) === true) {
                    el.addClass("blinking-ready");
                    check_value = check_value + "$";
                }
            } else {
                p.html("");
            }
            break;
    }

    el.append(p);
    el.attr("check-value", check_value);
    return el;
}

function AdVista24_trainHorizontalJourneyHTML(train, monitor_class, width, journey_scroll, show_stops) {
    // Obtiene el elemento clase .train-horizontal-journey

    // Selecciona paradas de llegada o de salida
    let journey = [];
    let has_intermediate_stops = false;
    switch (monitor_class) {
        case "departures":
            journey = train.journey_stops_destination;
            has_intermediate_stops = train.has_intermediate_destination_stops;
            break;
        case "arrivals":
            journey = train.journey_stops_origin;
            has_intermediate_stops = train.has_intermediate_origin_stops;
            break;
    }

    let el = $("<div>");
    let check_value = "";

    el.addClass("train-horizontal-journey");
    el.attr("style", "width: " + width + "%;");

    if (train.status === "cancelled") {
        check_value = check_value + "#CANCELLED#";
        el.html("");
        el.attr("check-value", check_value);
        return el;
    }

    if (!show_stops) {
        check_value = check_value + "#NOT SHOW STOPS#";
        el.html("");
        el.attr("check-value", check_value);
        return el;
    }

    let div = $("<div>");
    let initialized = false;
    switch (journey_scroll) {
        case "S": //scroll vertical por bloques 1 línea (steps)
            div.addClass("scrollableS");
            div.addClass("scroll-by-blocks");
            div.attr("current-line", 1);
            if (has_intermediate_stops) {
                journey.forEach(function (station) {
                    if (!station.declared_as_destination) {
                        if (initialized) {
                            div.append("<div>&nbsp;·&nbsp;</div>");
                        }
                        div.append(AdVista24_stationHTML(station, monitor_class, 0, false, true));
                        if (typeof AdVista24_station_list[station.code].picto !== "undefined")
                            check_value = check_value + "(" + AdVista24_station_list[station.code].picto + ")";
                        check_value = check_value + station.code + "%" + station.branch + "$";
                        initialized = true;
                    }
                });
            }
            el.append(div);
            break;
        case "P": //scroll vertical por estaciones 1 línea
            div.addClass("scrollableS");
            div.addClass("scroll-by-stations");
            div.attr("current-line", 1);
            if (has_intermediate_stops) {
                journey.forEach(function (station) {
                    if (!station.declared_as_destination) {
                        div.append(AdVista24_stationHTML(station, monitor_class, 0, false, true));
                        if (typeof AdVista24_station_list[station.code].picto !== "undefined")
                            check_value = check_value + "(" + AdVista24_station_list[station.code].picto + ")";
                        check_value = check_value + station.code + "%" + station.branch + "$";
                    }
                });
            }
            el.append(div);
            break;
        default: //scroll horizontal 1 línea ("X")
            div.addClass("scrollableX");
            div.attr("container-width", width);
            if (has_intermediate_stops) {
                journey.forEach(function (station) {
                    if (!station.declared_as_destination) {
                        if (initialized) {
                            div.append("<div>&nbsp;·&nbsp;</div>");
                        }
                        div.append(AdVista24_stationHTML(station, monitor_class, 0, false, true));
                        if (typeof AdVista24_station_list[station.code] !== "undefined") {
                            if (typeof AdVista24_station_list[station.code].picto !== "undefined")
                                check_value = check_value + "(" + AdVista24_station_list[station.code].picto + ")";
                        }
                        check_value = check_value + station.code + "%" + station.branch + "$";
                        initialized = true;
                    }
                });
            }
            el.append(div);
            break;
    }

    el.attr("check-value", check_value);
    return el;
}

function AdVista24_trainLineHTML(train, width) {
    // Obtiene el elemento clase .train-line
    let el = $("<div>");
    let check_value = "";

    el.addClass("train-line");
    el.attr("style", "width: " + width + "%;");
    let station = train.destinations[0];

    if (typeof station.line !== "undefined") {
        if (typeof station.line_pic_filename === "undefined") {
            if (typeof AdVista24_trains_data.multimedia_info.line_pic_filenames[station.line] !== "undefined")
                station.line_pic_filename = AdVista24_trains_data.multimedia_info.line_pic_filenames[station.line];
            else station.line_pic_filename = station.line;
        }

        if (!station.line_pic_filename.endsWith(".svg")) station.line_pic_filename = station.line_pic_filename + ".svg";
        let img1 = $("<img>");
        img1.addClass("line");
        img1.addClass("svg_en_img");
        let line_pic_filename = station.line_pic_filename;
        if (typeof AdVista24_trains_data.multimedia_info.multimedia_version !== "undefined")
            line_pic_filename = line_pic_filename + "?v=" + AdVista24_trains_data.multimedia_info.multimedia_version;
        check_value = line_pic_filename;
        img1.attr("src", AdVista24_getMultimediaFolder("lines") + line_pic_filename);
        el.append(img1);
    }
    el.attr("check-value", check_value);
    return el;
}

function AdVista24_marginHTML(width, class_name, height = -1) {
    // Obtiene un elemento vacío para margen con el ancho (en unidades %) y la clase indicada

    let el = $("<div>");
    el.addClass(class_name);
    if (height === -1) el.attr("style", "width: " + width + "%;");
    else el.attr("style", "width: " + width + "%; height: " + height + "%;");
    return el;
}

function AdVista24_marginHTMLem(width, class_name) {
    // Obtiene un elemento vacío para margen con el ancho (en unidades em) y la clase indicada

    let el = $("<div>");
    el.addClass(class_name);
    // el.css("min-width",width + "em;")
    // el.css("height","100%");
    el.attr("style", "min-width: " + width + "em;");
    el.css("height", "100%");

    return el;
}

function AdVista24_trainInfoHTML(train, width, observation_scroll, monitor_class, languages) {
    // Obtiene el elemento clase .train-info
    let el = $("<div>");
    let check_value = "";
    el.addClass("train-info");
    el.attr("style", "width: " + width + "%;");

    if (train.status === "cancelled") {
        el.addClass("train-info-cancelled");
        check_value = check_value + "#CANCELLED#";
    }
    let div = $("<div>");

    // Si el acceso check-in está cerrado, se muestra esta indicación en vez de la observacíon.
    if (monitor_class === "departures" && typeof train.check_in !== "undefined") {
        check_value = check_value + "#AC#";
        if (train.check_in === "closed") {
            let i = 0;
            languages.forEach(function (language) {
                let tag = $("<p>");
                tag.addClass("train-info-closed-check-in-tag");
                tag.html(AdVista24_frases["Acceso cerrado"][language]);
                check_value = check_value + AdVista24_frases["Acceso cerrado"][language] + "#";
                tag.addClass("reducible");
                tag.attr("line_number", i);
                if (i > 0) tag.addClass("hidden");
                div.append(tag);
                i++;
            });

            el.addClass("train-info-closed-check-in");
            el.addClass("scrollableL");
            el.attr("check-value", check_value);
            el.attr("total_lines", languages.length);
            el.attr("unhidden_line", 0);
            el.append(div);
            return el;
        }
    }

    // Si no hay check-in o está abierto, se muestra información normal.

    switch (observation_scroll) {
        case "S":
            div.addClass("scrollableS");
            div.attr("current-line", 1);
            break;
        default: // case "X"
            div.addClass("scrollableX");
            div.attr("container-width", width);
            break;
    }

    if (typeof train.observation === "undefined") train.observation = "";

    div.html(train.observation.trim());
    check_value = check_value + train.observation.trim();

    el.attr("check-value", check_value);
    el.append(div);
    return el;
}

function AdVista24_trainPlatformRoutingHTML(width, monitor_class, route, aspect_ratio, abs_row_height) {
    // Obtiene el elemento clase .train-platform-routing
    let el = $("<div>");
    el.addClass("train-platform-routing");
    el.attr("style", "width: " + width + "%;");

    let svg = AdVista24_trainRoutingSVG(route, 100, (100 * abs_row_height * 0.4) / aspect_ratio / width, monitor_class);

    el.attr("check-value", route);
    el.append(svg);
    return el;
}

function AdVista24_trainRoutingSVG(route, vbw, vbh, monitor_class) {
    // Obtiene los elementos SVG de la indicación de distancia y posición de composición alejada.

    let svg = "<svg width='100%' height='100%' style='font-size: 100%;' viewBox='0 0 " + vbw + " " + vbh + "'>";
    svg += "<style>";
    let train_routing_color = "#FFCE6C";
    let train_routing_filter_class = "color-gravita-ocre";
    if (monitor_class !== "departures") {
        train_routing_color = "#521625";
        train_routing_filter_class = "color-gravita-granate";
    }
    svg += ".distance { font-size: 15px; fill: " + train_routing_color + "; }";
    svg += "</style>";

    // Encaminamiento hacia la derecha (Right)
    if (route[0] === "R") {
        // Línea
        svg += '<polyline class="moving-strokes-little" points="';
        svg += vbw * 0.25 + "," + vbh * 0.7 + "," + vbw * 0.75 + "," + vbh * 0.7 + " ";

        svg +=
            '" stroke="' +
            train_routing_color +
            '" stroke-width="' +
            0.03 * vbw +
            '" fill="transparent" stroke-dasharray="10 10" stroke-dashoffset="0" />';

        // Flecha
        svg += '<polyline points="';
        svg += vbw * 0.8 + "," + vbh * 0.4 + "," + vbw * 0.9 + "," + vbh * 0.7 + "," + vbw * 0.8 + "," + vbh * 1 + " ";
        svg += '" stroke="' + train_routing_color + '" stroke-width="' + 0.03 * vbw + '" fill="transparent"  />';
        svg += '<polyline points="';
        svg += vbw * 0.75 + "," + vbh * 0.7 + "," + vbw * 0.9 + "," + vbh * 0.7 + " ";
        svg += '" stroke="' + train_routing_color + '" stroke-width="' + 0.03 * vbw + '" fill="transparent"  />';

        // Texto
        svg +=
            "<text x='" +
            vbw * 0.5 +
            "' y='" +
            vbh * 0.5 +
            "' class='distance' text-anchor='middle'>" +
            route.slice(1) +
            "</text>";

        // Picto andando
        let picto_height = Math.min(vbh, 0.25 * vbw);
        let picto_y = (vbh - picto_height) / 2;
        let picto_x = Math.max(0, vbw * 0.25 - picto_height);
        svg +=
            "<image class='not-bouncing " +
            train_routing_filter_class +
            "' href='" +
            AdVista24_getMultimediaFolder("svg") +
            "walking_right.svg?v=2' x ='" +
            picto_x +
            "' y = '" +
            picto_y +
            "' height='" +
            picto_height +
            "' />";
    }

    // Encaminamiento hacia la izquierda (Left)
    if (route[0] === "L") {
        // Línea
        svg += '<polyline class="moving-strokes-reversed-little" points="';
        svg += vbw * 0.25 + "," + vbh * 0.7 + "," + vbw * 0.75 + "," + vbh * 0.7 + " ";

        svg +=
            '" stroke="' +
            train_routing_color +
            '" stroke-width="' +
            0.03 * vbw +
            '" fill="transparent" stroke-dasharray="10 10" stroke-dashoffset="0" />';

        // Flecha
        svg += '<polyline points="';
        svg += vbw * 0.2 + "," + vbh * 0.4 + "," + vbw * 0.1 + "," + vbh * 0.7 + "," + vbw * 0.2 + "," + vbh * 1 + " ";
        svg += '" stroke="' + train_routing_color + '" stroke-width="' + 0.03 * vbw + '" fill="transparent"  />';
        svg += '<polyline points="';
        svg += vbw * 0.25 + "," + vbh * 0.7 + "," + vbw * 0.1 + "," + vbh * 0.7 + " ";
        svg += '" stroke="' + train_routing_color + '" stroke-width="' + 0.03 * vbw + '" fill="transparent"  />';

        // Texto
        svg +=
            "<text x='" +
            vbw * 0.5 +
            "' y='" +
            vbh * 0.5 +
            "' class='distance' text-anchor='middle'>" +
            route.slice(1) +
            "</text>";

        // Picto andando
        let picto_height = Math.min(vbh, 0.25 * vbw);
        let picto_y = (vbh - picto_height) / 2;
        svg +=
            "<image class='not-bouncing " +
            train_routing_filter_class +
            "' href='" +
            AdVista24_getMultimediaFolder("svg") +
            "walking_left.svg?v=2' x ='" +
            vbw * 0.75 +
            "' y = '" +
            picto_y +
            "' height='" +
            picto_height +
            "' />";
    }

    svg += "</svg>";
    return svg;
}

function AdVista24_stationHTML(station, monitor_class, abbreviation, show_line, show_picto, station_name = "") {
    // Obtiene un elemento de clase .station-combo (línea, nombre de estación abreviada e icono)
    // El campo station_name solo se usa en monitores alphabetical, sirve para fijar un nombre alternativo

    //Por si no está dada de alta correctamente la estación en el diccionario
    if (typeof AdVista24_station_list[station.code] === "undefined") {
        AdVista24_station_list[station.code] = [];
        AdVista24_station_list[station.code].name = [station.code];
    } else if (typeof AdVista24_station_list[station.code].name === "undefined") {
        AdVista24_station_list[station.code].name = [station.code];
    }

    //Obtiene el código HTML del nombre de una estación, agregando los iconos asociados a la misma si procede
    let div = $("<div>");
    div.addClass("station-combo");

    if (show_line) {
        div.addClass("station-combo-show-line");
        if (typeof station.line !== "undefined") {
            if (typeof station.line_pic_filename === "undefined") {
                if (typeof AdVista24_trains_data.multimedia_info.line_pic_filenames[station.line] !== "undefined")
                    station.line_pic_filename = AdVista24_trains_data.multimedia_info.line_pic_filenames[station.line];
                else station.line_pic_filename = station.line;
            }

            if (!station.line_pic_filename.endsWith(".svg"))
                station.line_pic_filename = station.line_pic_filename + ".svg";
            let img1 = $("<img>");
            img1.addClass("line");
            img1.addClass("svg_en_img");
            let line_pic_filename = station.line_pic_filename;
            if (typeof AdVista24_trains_data.multimedia_info.multimedia_version !== "undefined")
                line_pic_filename =
                    line_pic_filename + "?v=" + AdVista24_trains_data.multimedia_info.multimedia_version;
            img1.attr("src", AdVista24_getMultimediaFolder("lines") + line_pic_filename);
            div.append(img1);
        }
    }

    let p = $("<div>");

    if (typeof AdVista24_station_list[station.code] !== "undefined") {
        let name_div = $("<div>");
        name_div.addClass("station-name-literal");
        name_div.css("--scaleX", "1");
        if (station_name === "") {
            name_div.text(AdVista24_station_list[station.code].name[abbreviation]);
        } else {
            name_div.text(station_name);
        }

        p.append(name_div);

        if (show_picto && typeof AdVista24_station_list[station.code].picto !== "undefined") {
            div.addClass("station-combo-show-picto");
            p.append(AdVista24_marginHTMLem(0.3, "station-combo-margin"));
            let img2 = $("<img>");
            img2.addClass("picto");
            img2.addClass("svg_en_img");
            img2.attr(
                "src",
                AdVista24_getMultimediaFolder("station_pictos") + AdVista24_station_list[station.code].picto + ".svg"
            );
            if (
                AdVista24_station_list[station.code].picto === AdVista24_station_list[station.code].picto.toUpperCase()
            ) {
                // Se aplica filtrado de color para que aparezca con el mismo color de la letra si el nombre del archivo
                // está completamente en mayúsculas. Se requiere que el SVG sea completamente de color negro.
                switch (monitor_class) {
                    case "departures":
                    case "platform":
                    case "alphabetical":
                        img2.addClass("color-gravita-blanco");
                        break;
                    case "arrivals":
                        img2.addClass("color-gravita-azul-primario");
                        break;
                }
            }

            p.append(img2);
        }
    } else {
        p.html(station.code);
    }

    if (monitor_class === "platform") {
        div.addClass("reducible");
    }

    div.append(p);

    return div;
}

function AdVista24_alertsHTML(alert_id) {
    // Obtiene código HTML <div> clase alerts

    let el = $("<div>");
    el.addClass("alerts");

    el.append(AdVista24_alertContentHTML(AdVista24_alerts.find((alert) => alert.id === alert_id)));

    return el;
}

function AdVista24_alertContentHTML(alert) {
    // Obtiene código HTML <div> clase alert

    let el = $("<div>");
    el.addClass("alert");

    let langs = Object.keys(alert.message);

    el.attr("alert-id", alert.id);
    el.attr("present-language", 1);
    el.attr("languages", Object.keys(alert.message));

    Object.keys(alert.message).forEach(function (lang) {
        el.attr("data-header-" + lang, alert.message[lang].header);
        el.attr("data-description-" + lang, alert.message[lang].description);
    });

    switch (alert.level.toLowerCase()) {
        case "info":
            el.addClass("info-alert");
            break;
        case "works":
            el.addClass("works-alert");
            break;
        case "severe":
            el.addClass("severe-alert");
            break;
        case "warning":
        default:
            el.addClass("warning-alert");
            break;
    }

    let picto = $("<div>");

    picto.attr("style", "height: 100%; width: 8%;");
    picto.addClass("alert-picto");

    let img = $("<img>");
    switch (alert.level.toLowerCase()) {
        case "info":
            img.attr("src", AdVista24_getMultimediaFolder("svg") + "information.svg");
            img.addClass("color-gravita-azul-primario");
            break;
        case "works":
            img.attr("src", AdVista24_getMultimediaFolder("svg") + "works.svg");
            img.addClass("color-gravita-azul-primario");
            break;
        case "severe":
            img.attr("src", AdVista24_getMultimediaFolder("svg") + "disruption.svg");
            break;
        case "warning":
        default:
            img.attr("src", AdVista24_getMultimediaFolder("svg") + "disruption.svg");
            break;
    }

    img.css("height", "80%");

    picto.append(img);
    el.append(picto);

    let alert_info = $("<div>");
    alert_info.attr("style", "height: 100%; width: 91%; font-size: 100%;");

    let alert_header = $("<div>");
    alert_header.attr("style", "height: 50%; width: 100%; font-size: 45%;");
    alert_header.addClass("alert-header");
    alert_header.addClass("reducible");

    if (alert.lines && alert.lines.length > 0) {
        alert.lines.forEach(function (line) {
            let line_img = $("<img>");

            line_img.attr("src", AdVista24_getMultimediaFolder("lines") + line + ".svg");

            line_img.addClass("alert-line-img");

            alert_header.append(line_img);
        });
    }

    let alert_header_text_container = $("<div>");
    alert_header_text_container.addClass("alert-header-text");
    alert_header_text_container.addClass("scrollableXA-header");
    alert_header_text_container.text(alert.message[langs[0]].header);
    alert_header.append(alert_header_text_container);

    let alert_description_container = $("<div>");
    alert_description_container.attr(
        "style",
        "height: 50%; width: 100%; font-size: 45%; white-space: nowrap; overflow: hidden;"
    );

    let alert_text = $("<div>");

    alert_text.attr("style", "height: 100%; width: 100%; font-size: 100%;");
    alert_text.attr("container-width", "90");
    alert_text.addClass("scrollableXA");
    alert_text.addClass("alert-description-text");
    alert_text.text(alert.message[langs[0]].description);

    alert_description_container.append(alert_text);
    alert_info.append(alert_header);
    alert_info.append(alert_description_container);

    el.append(alert_info);

    el.append(AdVista24_marginHTML(1, "alert-right-margin"));

    return el;
}

function AdVista24_alphabeticalStationHTML(
    station_code,
    changed_station_name,
    widths,
    trains,
    countdown_active,
    countdown_traffics,
    estimated_time_traffics,
    show_platform_preview,
    sectorization_mode,
    letter,
    letter_parity,
    languages
) {
    // Obtiene código HTML de elemento clase .alphabetical-row
    let el = $("<div>");
    el.attr("station-code", station_code);
    el.addClass("alphabetical-row");

    // Filtrado de trenes que pasan por la estación
    trains = trains.filter(function (train) {
        return train.journey_stops_destination.some((stop) => stop.code === station_code);
    });

    let station = [];
    station.code = station_code;

    let letter_index = $("<div>");
    letter_index.addClass("alphabetical-letter");
    if (letter_parity === 0) letter_index.addClass("alphabetical-letter-even");
    else letter_index.addClass("alphabetical-letter-odd");
    letter_index.css("width", widths["letter"] + "%");
    letter_index.text(letter);
    letter_index.attr("check-value", letter + letter_parity);
    el.append(letter_index);

    el.append(AdVista24_marginHTML(widths["name-margin"], "alphabetical-margin"));

    let as = $("<div>");
    as.addClass("alphabetical-station");
    as.css("width", widths["name"] + "%");

    let s = $("<div>");
    s.addClass("alphabetical-station-name");
    s.attr("alternate-name", changed_station_name);
    s.append(AdVista24_stationHTML(station, "alphabetical", 0, false, true, changed_station_name));

    as.append(s);

    let check_value = "";
    let c = $("<div>");
    c.addClass("alphabetical-station-connections");

    c.addClass("scrollableI");

    if (typeof AdVista24_station_list[station_code] !== "undefined") {
        if (Array.isArray(AdVista24_station_list[station_code].connections)) {
            AdVista24_station_list[station_code].connections.forEach(function (st_conn) {
                if (typeof st_conn.network !== "undefined") {
                    if (Array.isArray(st_conn.lines)) {
                        if (st_conn.lines.length > 0) {
                            c.append(AdVista24_connectionPictoHTML(st_conn.network, false));
                            check_value = check_value + "N:" + st_conn.network + "$";
                            st_conn.lines.forEach(function (st_conn_line, index, lines) {
                                c.append(AdVista24_connectionPictoHTML(st_conn_line, index === lines.length - 1));
                                check_value = check_value + "L:" + st_conn_line + "$";
                            });
                        } else {
                            c.append(AdVista24_connectionPictoHTML(st_conn.network, true));
                            check_value = check_value + "N:" + st_conn.network + "$";
                        }
                    } else {
                        c.append(AdVista24_connectionPictoHTML(st_conn.network, true));
                        check_value = check_value + "N:" + st_conn.network + "$";
                    }
                }
            });
        }
    }

    c.attr("check-value", check_value);

    as.append(c);

    el.append(as);

    el.append(AdVista24_marginHTML(widths["name-margin"], "alphabetical-margin"));

    el.append(
        AdVista24_alphabeticalStationTrainsHTML(
            station_code,
            widths,
            trains,
            countdown_active,
            countdown_traffics,
            estimated_time_traffics,
            show_platform_preview,
            sectorization_mode,
            languages
        )
    );

    return el;

    function AdVista24_connectionPictoHTML(file, expand_padding) {
        let img = $("<img>");
        if (expand_padding) img.addClass("last_picto");
        else img.addClass("picto");
        img.addClass("svg_en_img");
        img.attr("src", AdVista24_getMultimediaFolder("connections") + file + ".svg");
        c.append(img);
    }
}

function AdVista24_alphabeticalStationTrainsHTML(
    station_code,
    widths,
    trains,
    countdown_active,
    countdown_traffics,
    estimated_time_traffics,
    show_platform_preview,
    sectorization_mode,
    languages
) {
    // Obtiene código HTML de elemento clase .alphabetical-trains
    let el = $("<div>");
    el.addClass("alphabetical-trains");
    el.css("width", widths["trains"] + "%");

    // Ordenamos los trenes por hora de llegada a la estación.
    trains.sort(AdVista24_ordenarTrenesHoraLlegadaEstacion(station_code));

    // Comprobamos si el primer tren circula mañana o si es el último tren del día

    // Obtenemos la hora actual:
    let now_time = new Date();
    let now_hour = now_time.getHours();

    // Obtenemos la hora de salida del primer tren
    let t1_time = new Date(trains[0].departure_time);
    let t1_hour = t1_time.getHours();

    // Primer tren mañana si sale después de las 4 AM y estamos entre las 12 PM y las 1 AM
    let first_tomorrow =
        (now_time.getDate() < t1_time.getDate() && t1_hour >= 4) ||
        (now_time.getDate() === t1_time.getDate() && now_hour < 2 && t1_hour >= 4);

    let last_today = false;
    if (trains.length === 1) {
        last_today = !first_tomorrow;
    } else {
        // Obtenemos la hora de salida del segundo tren
        let t2_time = new Date(trains[1].departure_time);
        let t2_hour = t2_time.getHours();
        last_today =
            (t1_time.getDate() !== t2_time.getDate() && t1_hour >= 4) ||
            (t1_time.getDate() === t2_time.getDate() && t1_hour < 2 && t2_hour >= 4);
    }

    // PRIMER TREN:
    // Primer tren
    let t1 = $("<div>");
    t1.addClass("alphabetical-train");
    t1.addClass("alphabetical-train-1");
    t1.css("width", widths["train"] + "%");

    if (!first_tomorrow) {
        let t1ur = $("<div>");
        t1.attr("train-id", trains[0].id);
        t1ur.addClass("alphabetical-train-upper-row");

        t1ur.append(AdVista24_trainLineHTML(trains[0], widths["train-line"]));
        t1ur.append(
            AdVista24_trainTimeHTML(
                trains[0],
                "departures",
                widths["train-time"],
                countdown_active,
                countdown_traffics,
                estimated_time_traffics
            )
        );
        t1ur.append(
            AdVista24_trainPlatformHTML(
                trains[0],
                "departures",
                widths["train-platform"],
                show_platform_preview,
                sectorization_mode
            )
        );

        t1.append(t1ur);

        let t1lr = $("<div>");
        t1lr.addClass("alphabetical-train-lower-row");
        t1lr.append(AdVista24_trainAlphabeticalDirectionHTML(trains[0], 100, 0));

        t1.append(t1lr);
    } else {
        t1.append(AdVista24_alphabeticalFirstTomorrowHTML(languages));
        t1.attr("train-id", "$$FIRST-TOMORROW");
    }
    el.append(t1);
    el.append(AdVista24_marginHTML(widths["train-margin"], "alphabetical-train-margin"));

    let tb = $("<div>");
    tb.addClass("alphabetical-space-between-trains");

    tb.css("width", widths["train-border"] + "%");
    tb.css("height", "100%");

    let tb1 = $("<div>");

    tb1.css("width", "100%");
    tb1.css("height", "15%");
    tb.append(tb1);

    let tb2 = $("<div>");
    if (trains.length > 1 && !first_tomorrow && !last_today) tb2.addClass("alphabetical-train-border");
    tb2.css("width", "100%");
    tb2.css("height", "70%");
    tb.append(tb2);

    let tb3 = $("<div>");
    tb3.css("width", "100%");
    tb3.css("height", "15%");
    tb.append(tb3);

    el.append(tb);

    el.append(AdVista24_marginHTML(widths["train-margin"], "alphabetical-train-margin"));

    // Segundo tren
    let t2 = $("<div>");
    t2.addClass("alphabetical-train");
    t2.addClass("alphabetical-train-2");
    t2.css("width", widths["train"] + "%");

    if ((trains.length > 1 && !last_today) || first_tomorrow) {
        let j = 1;
        if (first_tomorrow) j = 0;
        t2.attr("train-id", trains[j].id);
        let t2ur = $("<div>");
        t2ur.addClass("alphabetical-train-upper-row");
        t2ur.append(AdVista24_trainLineHTML(trains[j], widths["train-line"]));
        t2ur.append(
            AdVista24_trainTimeHTML(
                trains[j],
                "departures",
                widths["train-time"],
                countdown_active,
                countdown_traffics,
                estimated_time_traffics
            )
        );
        t2ur.append(
            AdVista24_trainPlatformHTML(
                trains[j],
                "departures",
                widths["train-platform"],
                show_platform_preview,
                sectorization_mode
            )
        );
        t2.append(t2ur);
        let t2lr = $("<div>");
        t2lr.addClass("alphabetical-train-lower-row");
        t2lr.append(AdVista24_trainAlphabeticalDirectionHTML(trains[j], 100, 0));

        t2.append(t2lr);
    } else if (last_today) {
        t2.append(AdVista24_alphabeticalLastTodayHTML(languages));
        t2.attr("train-id", "$$LAST-TODAY");
    }
    el.append(t2);

    return el;
}

function AdVista24_platformTrainHTML(
    train,
    platforms,
    total_trains,
    screen_rows_rounded,
    show_platform_sign,
    platform_side,
    show_platform_side_left,
    show_platform_side_right,
    show_composition,
    show_observation,
    pin_position,
    pin_style,
    countdown_traffics,
    estimated_time_traffics,
    platform_arrangement,
    sectors_highlight,
    show_closed_check_in,
    languages,
    aspect_ratio,
    sectorization_mode
) {
    // Obtiene el elemento clase .platform-train
    // total_trains: número total de trenes en pantalla
    // screen_rows_rounded: número entero total de líneas en pantalla (según relación de aspecto), monitor 16:9 genera 18 líneas

    //Añadimos la información complementaria del tren
    train = AdVista24_trainInfoComplement(train);

    //Dimensiones del <div> relativa y absoluta
    let train_height = 100 / total_trains;

    // Número de lineas dedicadas al tren y altura relativa de cada línea dentro del tren)
    let train_screen_rows = screen_rows_rounded / total_trains;

    // Si la altura disponible es demasiado pequeña, se mostrarán las paradas en scroll horizontal como en los monitores de salidas
    let show_horizontal_journey = false;

    // Comprobamos si se deben mostrar picos por encima o por debajo del tren
    let down_pictos =
        pin_style.includes("stairs_up_left") ||
        pin_style.includes("stairs_up_right") ||
        pin_style.includes("lift_up") ||
        pin_style.includes("accessible_lift_up");
    let up_pictos =
        pin_style.includes("stairs_down_left") ||
        pin_style.includes("stairs_down_right") ||
        pin_style.includes("lift_down") ||
        pin_style.includes("accessible_lift_down") ||
        pin_style.includes("pin");

    // Modo de dibujo de composición expandido si hay pictos arriba y abajo
    let composition_expanded = down_pictos && up_pictos;

    // Modo de dibujo con los sectores abajo si solo hay pictos abajo
    let down_sectors = down_pictos && !up_pictos;

    // Obtenemos si es un tren que no admite viajeros
    let is_alighting_only = train.class_stop === "alighting_only";

    // Obtenemos si hay que dibujar observacion
    if (typeof train.observation === "undefined") train.observation = "";
    if (show_observation) show_observation = train.observation.trim() !== "";

    // No realizamos el dibujo de la composición si no está dada de alta la topología de vía
    // Retrocompatibilidad en JSIV con antiguos nombres de parámetros station/platform end/start
    if (typeof platforms[train.platform] === "undefined") {
        show_composition = false;
    } else if (
        typeof platforms[train.platform].platform_start === "undefined" ||
        typeof platforms[train.platform].platform_end === "undefined"
    ) {
        if (
            typeof platforms[train.platform].station_start === "undefined" ||
            typeof platforms[train.platform].station_end === "undefined"
        )
            show_composition = false;
        else {
            platforms[train.platform].platform_start = platforms[train.platform].station_start;
            platforms[train.platform].platform_end = platforms[train.platform].station_end;
        }
    }

    // Autocalculamos la longitud del tren si no se ha incluído en JSIV
    if (show_composition && typeof train.composition !== "undefined" && typeof train.train_length === "undefined") {
        let train_length = 0;
        train.composition.forEach(function (unit) {
            unit.forEach(function (coach) {
                if (typeof coach.length !== "undefined") train_length += parseInt(coach.length);
            });
        });
        train.train_length = train_length;
    }

    // Si no hay composición declarada, o su longitud es 0, no se dibuja:
    if (
        typeof train.composition === "undefined" ||
        parseInt(train.train_length) === 0 ||
        parseInt(train.composition.length) === 0
    )
        show_composition = false;

    // No se informa del acceso cerrado (en el lugar de la composición) si no se recibe el control de acceso como "closed"
    if (typeof train.check_in === "undefined") {
        show_closed_check_in = false;
    } else {
        if (train.check_in !== "closed") show_closed_check_in = false;
    }

    // Definimos el numero de líneas de pantalla para cada elemento de la composicion
    // en funcion del numero de lineas totales disponibles para el tren
    let header_screen_rows = train_screen_rows;
    let composition_screen_rows = 0;
    let observation_screen_rows = 0;

    if (train_screen_rows >= 9) {
        header_screen_rows = 4.5;
        composition_screen_rows = 0;
        if (show_composition || show_closed_check_in) {
            composition_screen_rows = 2;
            if (composition_expanded) composition_screen_rows = 3;
            else if (down_sectors) composition_screen_rows = 2.2;
        }
        if (show_observation) observation_screen_rows = 1;
        else observation_screen_rows = 0;
    } else if (train_screen_rows >= 7) {
        header_screen_rows = train_screen_rows / 2;
        observation_screen_rows = 0;
        if (composition_expanded) header_screen_rows = (train_screen_rows - 1) / 2;
        else if (down_sectors) header_screen_rows = (train_screen_rows - 0.2) / 2;

        if (show_composition || show_closed_check_in) {
            composition_screen_rows = 2;
            if (composition_expanded) composition_screen_rows = 3;
            else if (down_sectors) composition_screen_rows = 2.2;
        } else {
            composition_screen_rows = 0;
        }
    } else {
        header_screen_rows = 0.75 * train_screen_rows;
        composition_screen_rows = 0;
        observation_screen_rows = 0;
        show_horizontal_journey = true;
    }

    //Si no está la vía dada de alta en la configuración de la estación, no se dibuja
    if (typeof platforms[train.platform] === "undefined") composition_screen_rows = 0;

    // El resto del espacio disponible se dedica al termómetro de paradas;
    let journey_screen_rows =
        train_screen_rows - header_screen_rows - observation_screen_rows - composition_screen_rows;

    let el = $("<div>");
    el.addClass("platform-train");
    el.attr("train-id", train.id);
    el.attr("style", "height: " + train_height + "%; font-size: " + train_height + "%;");

    //Dimensiones de los elementos relativas y absolutas
    let header_height = (100 * header_screen_rows) / train_screen_rows;

    let journey_height = (100 * journey_screen_rows) / train_screen_rows;

    let observation_height = (100 * observation_screen_rows) / train_screen_rows;

    let composition_height = (100 * composition_screen_rows) / train_screen_rows;

    // Obtenemos la relación de aspecto del lienzo para journey
    let journey_aspect_ratio = aspect_ratio / total_trains / (journey_height / 100);

    // Si es un tren que no admite viajeros, ajustamos alguns alturas
    if (is_alighting_only) {
        journey_height = journey_height + 0.57 * header_height;
        header_height = 0.43 * header_height;
    }

    //Si hay platform_side definido se fuerza a mostar el platform_sign
    if (typeof platform_side !== "undefined") show_platform_sign = true;

    // Anchura relativa de cada fila de hora  y commercial_id
    let train_commercial_id_relative_height = (100 / total_trains) * (header_height / 100) * 0.43;

    //Anchos de los elementos
    let widths = AdVista24_getPlatformWidths(
        show_platform_sign,
        show_platform_side_left,
        show_platform_side_right,
        train.accessible_sign === true,
        aspect_ratio,
        train_commercial_id_relative_height
    );

    let psl = $("<div>");
    psl.addClass("platform-train-side");
    psl.attr("style", "height: 100%; width: 5%; font-size: 100%;");
    psl.html("");
    if (platform_side === "left" || platform_side === "forward-left") {
        psl.addClass("platform-train-side-correct");
        let img = $("<img>");
        img.addClass("svg_en_img");
        if (platform_side === "left") img.attr("src", AdVista24_getMultimediaFolder("svg") + "left_arrow.svg");
        else img.attr("src", AdVista24_getMultimediaFolder("svg") + "forward_arrow.svg");
        img.addClass("color-gravita-azul-primario");
        psl.append(img);
    } else {
        psl.addClass("platform-train-side-incorrect");
    }

    let psr = $("<div>");
    psr.addClass("platform-train-side");
    psr.attr("style", "height: 100%; width: 5%; font-size: 100%;");
    psr.html("");
    if (platform_side === "right" || platform_side === "forward-right") {
        psr.addClass("platform-train-side-correct");
        let img = $("<img>");
        img.addClass("svg_en_img");
        if (platform_side === "right") img.attr("src", AdVista24_getMultimediaFolder("svg") + "right_arrow.svg");
        else img.attr("src", AdVista24_getMultimediaFolder("svg") + "forward_arrow.svg");
        img.addClass("color-gravita-azul-primario");
        psr.append(img);
    } else {
        psr.addClass("platform-train-side-incorrect");
    }

    let pb = $("<div>");
    pb.addClass("platform-train-body");

    if (show_platform_side_left && show_platform_side_right) {
        pb.attr("style", "height: 100%; width: 90%; font-size: 100%;");
    } else if (!show_platform_side_left && show_platform_side_right) {
        pb.attr("style", "height: 100%; width: 95%; font-size: 100%;");
    } else if (show_platform_side_left && !show_platform_side_right) {
        pb.attr("style", "height: 100%; width: 95%; font-size: 100%;");
    } else {
        pb.attr("style", "height: 100%; width: 100%; font-size: 100%;");
    }

    pb.append(
        AdVista24_platformHeaderHTML(
            train,
            header_height,
            widths,
            show_platform_sign,
            countdown_traffics,
            estimated_time_traffics,
            show_platform_side_right && (platform_side === "left" || platform_side === "forward-left"),
            !is_alighting_only,
            !is_alighting_only,
            sectorization_mode
        )
    );

    if (!is_alighting_only) {
        if (show_horizontal_journey) {
            pb.append(AdVista24_trainPlatformHorziontalJourneyHTML(train, journey_height, widths));
        } else {
            pb.append(AdVista24_trainVerticalJourneyHTML(train, journey_screen_rows, journey_height, widths));
        }
    } else {
        pb.append(AdVista24_trainAlightingOnlyHTML(journey_height, journey_aspect_ratio, languages));
        el.addClass("platform-train-alighting-only");
    }

    if (show_observation && observation_screen_rows > 0) {
        pb.append(AdVista24_marginHTML(1, "platform-info-margin", observation_height));
        pb.append(AdVista24_platformInfoHTML(train, 98, "X", observation_height));
        pb.append(AdVista24_marginHTML(1, "platform-info-margin", observation_height));
    }

    if (
        (typeof train.composition !== "undefined" && composition_screen_rows > 0 && show_composition) ||
        show_closed_check_in
    ) {
        if (!show_closed_check_in) {
            pb.append(
                AdVista24_trainCompositionHTML(
                    train,
                    platforms,
                    pin_position,
                    pin_style,
                    composition_height,
                    platform_arrangement,
                    sectors_highlight,
                    composition_expanded,
                    down_sectors
                )
            );
        } else {
            pb.append(AdVista24_trainClosedCheckInHTML(composition_height, languages));
        }
    }

    if (show_platform_side_left) el.append(psl);
    el.append(pb);
    if (show_platform_side_right) el.append(psr);

    return el;
}

function AdVista24_platformHeaderHTML(
    train,
    header_height,
    widths,
    show_platform_sign,
    countdown_traffics,
    estimated_time_traffics,
    show_platform_sign_right_border,
    show_destination,
    show_time,
    sectorization_mode
) {
    // Cabecera de tren en monitor de andén.

    let el = $("<div>");
    el.addClass("platform-header");
    el.attr("style", "height: " + header_height + "%; font-size: " + header_height + "%;");

    el.append(
        AdVista24_platformTrainHeaderHTML(
            train,
            widths,
            countdown_traffics,
            estimated_time_traffics,
            show_destination,
            show_time
        )
    );
    if (show_platform_sign) {
        let ps = AdVista24_platformSignHTML(train, widths["sign"], sectorization_mode);
        if (show_platform_sign_right_border) ps.addClass("include-right-border");
        el.append(ps);
    }
    return el;
}

function AdVista24_platformSignHTML(train, width, sectorization_mode) {
    // Devuelve la señal de número de vía.
    // Se eliminan las antiguas flechas de orientación, para pasar las flechas a los márgenes.

    let el = $("<div>");
    el.addClass("platform-sign");
    el.attr("style", "width: " + width + "%;");

    let bar = $("<div>");
    bar.addClass("platform-sign-bar");

    let box = $("<div>");
    box.addClass("platform-sign-number-box");
    box.append("<div class='platform-sign-number-margin-sup'>");

    box.append("<div class='platform-sign-number-margin-left' style='width: 5%;'>");
    box.append(AdVista24_trainPlatformHTML(train, "platform", 90, false, sectorization_mode));
    box.append("<div class='platform-sign-number-margin-left' style='width: 5%;'>");

    box.append("<div class='platform-sign-number-margin-inf'>");

    el.append(bar);
    el.append(box);

    return el;
}

function AdVista24_platformTrainHeaderHTML(
    train,
    widths,
    countdown_traffics,
    estimated_time_traffics,
    show_destination,
    show_time
) {
    // Obtiene el elemento de clase .platform-train-header

    let el = $("<div>");
    el.addClass("platform-train-header");
    el.attr("train-id", train.id);
    el.attr("style", "width: " + widths["header"] + "%");

    let ur = $("<div>");
    ur.addClass("platform-train-header-upper-row");
    if (show_destination) {
        ur.css("height", "43%");
        ur.css("font-size", "45%");
    } else {
        ur.css("height", "100%");
        ur.css("font-size", "100%");
    }
    ur.append(AdVista24_marginHTML(widths["margin"], "platform-train-header-margin-sup"));
    if (show_time)
        ur.append(AdVista24_platformTimeHTML(train, widths["time"], countdown_traffics, estimated_time_traffics));
    else ur.append(AdVista24_marginHTML(widths["time"], "platform-train-header-margin-no-time"));
    if (train.accessible_sign === true) {
        ur.append(AdVista24_trainAccessibleSignHTML(widths["accessible_sign"]));
        ur.append(AdVista24_marginHTML(widths["accessible_margin"], "platform-train-header-margin-sup"));
    }

    ur.append(AdVista24_trainCommercialIdHTML(train, "departures", widths["commercial_id"], true, true));

    el.append(ur);

    if (show_destination) {
        let lr = $("<div>");
        lr.attr("style", "width: 100%; height: 57%; font-size: 52%; display: flex; flex-wrap: wrap;");
        lr.addClass("platform-train-header-lower-row");

        lr.append(AdVista24_marginHTML(widths["margin"], "platform-train-header-margin-inf"));
        lr.append(AdVista24_trainDirectionHTML(train, "departures", widths["station"], 0));
        lr.append(AdVista24_marginHTML(widths["margin"], "platform-train-header-margin-inf"));
        lr.append(AdVista24_marginHTML(100, "platform-train-header-margin-bottom"));

        el.append(lr);
    }

    return el;
}

function AdVista24_trainPlatformHorziontalJourneyHTML(train, height, widths) {
    // Obtiene el elemento clase .platform-horizontal-journey
    // Es simplemente un .train-horizontal-journey con márgenes derecho e izquierdo

    let el = $("<div>");
    el.addClass("platform-horizontal-journey");
    el.attr("style", "height: " + height + "%; font-size: " + height + "%; width: 100%;");
    el.append(AdVista24_marginHTML(1.2 * widths["margin"], "platform-train-journey-margin"));
    el.append(AdVista24_trainHorizontalJourneyHTML(train, "departures", 100 - 2.4 * widths["margin"], "X", true));
    el.append(AdVista24_marginHTML(1.2 * widths["margin"], "platform-train-journey-margin"));

    return el;
}

function AdVista24_trainVerticalJourneyHTML(train, journey_screen_rows, height, widths) {
    // Obtiene el elemento de clase .train-vertical-journey (termómetro de recorrido)

    let div = $("<div>");
    let check_value = "";
    div.addClass("train-vertical-journey");

    div.attr("style", "height: " + height + "%; font-size: " + height + "%;");
    let journey = train.journey_stops_destination;

    let container = $("<div>");
    container.addClass("train-vertical-journey-container");

    // Determinar el número de screen_rows dedicadas a cada parada para que no queden paradas "cortadas" al inicio o final de la animación.
    // También determinamos el numero de paradas visibiles simultánamente.
    let stop_screen_rows;
    let visible_stops;

    // Por lo general una parada ocupa 2 screen_rows.
    if (journey_screen_rows / journey.length >= 2) {
        //Si cabe todo el recorrido en la pantalla, se distribuye el espacio entre todas las paradas
        stop_screen_rows = journey_screen_rows / journey.length;
        visible_stops = journey.length;
    } else {
        //Hay más paradas que las que caben, dedicamos 2 screen-rows a cada parada
        //ajustarmeos para que quede un numero entero de paradas a la vista
        //Número entero de paradas que caben
        visible_stops = Math.floor(journey_screen_rows / 2);
        if (visible_stops === 0) visible_stops = 1;
        stop_screen_rows = journey_screen_rows / visible_stops;
    }

    //1.5 segundos por cada parada que no quede visible
    let scroll_time = 2 * (journey.length - visible_stops);

    if (visible_stops === 1) scroll_time = 2 * (journey.length - visible_stops);

    container.css("--scrollY-time", scroll_time + "s");
    if (scroll_time > 0) container.addClass("scrollableY");

    // Altura relativa de cada parada
    let stop_height = (100 / journey_screen_rows) * stop_screen_rows;

    // Altura normalizada (para que el tamaño de la letra no varie en función de la altura de cada parada)
    let stop_height_norm = (100 / journey_screen_rows) * 2;

    if (journey.length > 0) {
        let former_tab = 0; // Punto de tabulación de la parada anterior (cada rama va en una tabulación más a la derecha)

        journey.forEach(function (station) {
            let stop = $("<div>");
            stop.addClass("train-vertical-journey-stop");

            stop.attr("style", "height: " + stop_height + "%; font-size: " + stop_height_norm * 0.7 + "%;");

            // Generación hora de paso
            let time = $("<div>");
            time.addClass("train-vertical-journey-stop-time");
            time.addClass("monospace");
            time.attr("style", "width: " + widths["stop-time"] + "%;");
            time.html(AdVista24_journeyStopTimeHTML(train, station));
            stop.append(time);

            // Margen
            stop.append(AdVista24_marginHTML(widths["stop-time-margin"], "stop-margin"));

            // Líneas y círculos de termómetro (tabulados en caso de ramas)
            for (let tab = 0; tab <= station.tabulate; tab++) {
                stop.append(
                    AdVista24_platformJourneyStopCircle(
                        station,
                        widths["stop-circle"],
                        stop_screen_rows,
                        tab,
                        former_tab
                    )
                );
            }

            // Margen
            stop.append(AdVista24_marginHTML(widths["stop-name-margin"], "stop-margin"));

            // El ancho disponible para el nombre de la estación se obtiene dinámicamente teniendo en cuenta las tabulaciones por ramas
            let stop_name_width = widths["stop-name"] - station.tabulate * widths["stop-circle"];

            // Nombre de la estación
            let combo = $("<div>");
            combo.addClass("train-vertical-journey-stop-info");
            combo.attr("style", "width: " + stop_name_width + "%;");
            combo.html(AdVista24_stationHTML(station, "platform", 0, false, true));

            stop.append(combo);

            container.append(stop);
            check_value = check_value + station.code + "%" + station.branch + "$";
            for (let tab = 0; tab <= station.tabulate; tab++) {
                check_value = check_value + "{" + station.color[tab] + "}";
            }
            former_tab = station.tabulate;
        });
    }

    div.append(container);
    div.attr("check-value", check_value);
    return div;
}

function AdVista24_journeyStopTimeHTML(train, station) {
    let el = $("<div>");
    el.addClass("time");
    if (train.delay_out > 5) {
        if (typeof station.delay_in === "undefined") station.delay_in = 0;
        el.html(AdVista24_isoToHoraMinutos(station.arrival_time, station.delay_in));
        if (station.delay_in > 0) {
            el.addClass("delayed");
        }
    } else {
        el.html(AdVista24_isoToHoraMinutos(station.arrival_time, 0));
    }

    return el;
}

function AdVista24_platformJourneyStopCircle(station, width, stop_screen_rows, tab, former_tab) {
    // Obtiene el objeto de clase .train-vertical-journey-stop-circle que contiene el SVG de cada parada del termómetro.

    let div = $("<div>");
    div.addClass("train-vertical-journey-stop-circle");
    div.attr("style", "width: " + width + "%;");

    div.html(AdVista24_stopCircleSVG(station, stop_screen_rows, tab, former_tab));

    return div;
}

function AdVista24_stopCircleSVG(station, stop_screen_rows, tab) {
    // Generación dinámica del SVG del termómetro de una estación del recorrido

    // Ancho y alto del viewbox SVG
    let vbw = 185.6;
    let vbh = 100 * stop_screen_rows;

    let svg = "";

    // Circulo exterior
    if (station.tabulate === tab) {
        if (station.color[tab] !== "#FFFFFF") {
            svg +=
                svgZ(0) +
                "<circle cx='" +
                vbw / 2 +
                "' cy='" +
                vbh / 2 +
                "' r='" +
                0.275 * vbw +
                "' fill='#FFFFFF' /></svg>";
        } else {
            svg +=
                svgZ(0) +
                "<circle cx='" +
                vbw / 2 +
                "' cy='" +
                vbh / 2 +
                "' r='" +
                0.25 * vbw +
                "' fill='#FFFFFF' /></svg>";
        }
    }

    // Línea (desde la parada anterior hasta la actual)
    if (station.tabulate > tab || !station.starts_new_branch) {
        // Línea recta
        if (station.color[tab] !== "#FFFFFF") {
            svg +=
                svgZ(1) +
                "<line x1='" +
                vbw / 2 +
                "' y1='" +
                1.01 * (-vbh / 2) +
                "' x2='" +
                vbw / 2 +
                "' y2='" +
                0.5 * vbh +
                "' stroke='#FFFFFF' stroke-width='" +
                0.225 * vbw +
                "' /></svg>";
            svg +=
                svgZ(2) +
                "<line x1='" +
                vbw / 2 +
                "' y1='" +
                1.01 * (-vbh / 2) +
                "' x2='" +
                vbw / 2 +
                "' y2='" +
                0.5 * vbh +
                "' stroke='" +
                station.color[tab] +
                "' stroke-width='" +
                0.125 * vbw +
                "' /></svg>";
        } else {
            svg +=
                svgZ(2) +
                "<line x1='" +
                vbw / 2 +
                "' y1='" +
                1.01 * (-vbh / 2) +
                "' x2='" +
                vbw / 2 +
                "' y2='" +
                0.5 * vbh +
                "' stroke='" +
                station.color[tab] +
                "' stroke-width='" +
                0.15 * vbw +
                "' /></svg>";
        }
    } else {
        // Inciio de nueva rama (línea curva desde la estación anterior)
        if (station.color[tab] !== "#FFFFFF") {
            svg +=
                svgZ(1) +
                "<path d='M " +
                vbw / 2 +
                "," +
                vbh / 2 +
                " C " +
                vbw / 2 +
                "," +
                0 +
                " " +
                -vbw / 2 +
                "," +
                0 +
                " " +
                -vbw / 2 +
                "," +
                -vbh / 2 +
                "' stroke='#FFFFFF'  stroke-width='" +
                0.23 * vbw +
                "'  fill='transparent' /></svg>";
            svg +=
                svgZ(2) +
                "<path d='M " +
                vbw / 2 +
                "," +
                vbh / 2 +
                " C " +
                vbw / 2 +
                "," +
                0 +
                " " +
                -vbw / 2 +
                "," +
                0 +
                " " +
                -vbw / 2 +
                "," +
                -vbh / 2 +
                "' stroke='" +
                station.color[tab] +
                "' stroke-width='" +
                0.13 * vbw +
                "'  fill='transparent' /></svg>";
        } else {
            svg +=
                svgZ(2) +
                "<path d='M " +
                vbw / 2 +
                "," +
                vbh / 2 +
                " C " +
                vbw / 2 +
                "," +
                0 +
                " " +
                -vbw / 2 +
                "," +
                0 +
                " " +
                -vbw / 2 +
                "," +
                -vbh / 2 +
                "' stroke='" +
                station.color[tab] +
                "' stroke-width='" +
                0.155 * vbw +
                "'  fill='transparent' /></svg>";
        }
    }

    // Círculo interior
    if (tab === station.tabulate) {
        svg +=
            svgZ(3) +
            "<circle cx='" +
            vbw / 2 +
            "' cy='" +
            vbh / 2 +
            "' r='" +
            0.225 * vbw +
            "' fill='" +
            station.color[tab] +
            "' /></svg>";
    }

    return svg;

    function svgZ(z) {
        return "<svg width='100%' height='100%' viewBox='0 0 " + vbw + " " + vbh + "' style='z-index: " + z + ";'>";
    }
}

function AdVista24_platformInfoHTML(train, width, observation_scroll, height) {
    // Obtiene el elemento clase .platform-info (observación del tren)

    let el = $("<div>");
    let check_value = "";
    el.addClass("platform-info");
    el.attr("style", "width: " + width + "%; height: " + height + "%; font-size: " + height + "%;");

    let div = $("<div>");
    switch (observation_scroll) {
        case "S":
            div.addClass("scrollableS");
            div.attr("current-line", 1);
            break;
        default: // case "X"
            div.addClass("scrollableX");
            div.addClass("platform-observation");
            div.attr("container-width", width);
            break;
    }

    if (typeof train.observation === "undefined") train.observation = "";
    div.html(train.observation.trim());
    check_value = train.observation.trim();

    el.attr("check-value", check_value);
    el.append(div);
    return el;
}

function AdVista24_trainCompositionHTML(
    train,
    platforms,
    pin_position,
    pin_style,
    height,
    platform_arrangement,
    sectors_highlight,
    composition_expanded,
    down_sectors
) {
    // Obtiene el elemento de clase .train-composition

    let div = $("<div>");
    div.addClass("train-composition");

    div.attr("style", "height: " + height + "%; font-size: " + height + "%; width: 100%;");
    div.html(
        AdVista24_compositionSVG(
            train,
            platforms,
            pin_position,
            pin_style,
            platform_arrangement,
            sectors_highlight,
            composition_expanded,
            down_sectors
        )
    );
    let check_value = "";
    check_value =
        platforms[train.platform]["platform_start"] +
        "$" +
        platforms[train.platform]["platform_end"] +
        "$" +
        train.stopping_point +
        "$" +
        train.stopping_point_reference +
        "$" +
        train.orientation_out +
        "$" +
        train.train_length;

    if (typeof platforms[train.platform] !== "undefined") {
        let platform_sectors = platforms[train.platform]["sectors"];

        if (typeof platform_sectors !== "undefined") {
            for (let i = 0; i < platform_sectors.length; i++) {
                check_value += "_SEC#" + platform_sectors[i]["name"] + "//" + platform_sectors[i]["position"] + "_";
            }
        }
    }
    for (let j = 0; j < train.composition.length; j++) {
        for (let i = 0; i < train.composition[j].length; i++) {
            if (typeof train.composition[j][i].number === "undefined") train.composition[j][i].number = "";
            if (typeof train.composition[j][i].info === "undefined") train.composition[j][i].info = [];
            check_value =
                check_value +
                "#" +
                train.composition[j][i].type +
                ";" +
                train.composition[j][i].number +
                ";" +
                train.composition[j][i].length +
                ";" +
                train.composition[j][i].info.join("&");
        }
    }
    div.attr("check-value", check_value);
    return div;
}

function AdVista24_trainAlightingOnlyHTML(height, journey_aspect_ratio, languages) {
    // Obtiene el elemento de clase .train-alighting-only

    // height es la altura en porcentaje del <div>.
    // journey_aspect_ratio es la relación de aspecto del lienzo para este elemento

    let div = $("<div>");
    div.addClass("train-alighting-only");

    div.attr("style", "height: " + height + "%; font-size: " + height + "%; width: 100%;");

    let i = 0;

    if (journey_aspect_ratio < 3) {
        // Disposición vertical
        div.append(AdVista24_marginHTML("5", "train-alighting-only-margin"));
        let div2 = $("<div>");
        div2.addClass("train-alighting-only-canvas");
        div2.css("width", "90%");
        let img = $("<img>");
        img.addClass("picto");
        img.addClass("svg_en_img");
        img.attr("src", AdVista24_getMultimediaFolder("svg") + "alighting_only.svg");
        img.css("height", "50%");
        img.css("width", "100%");
        div2.append(img);
        let divt = $("<div>");
        divt.css("height", "50%");
        divt.css("width", "100%");
        divt.css("font-size", "20%");
        languages.forEach(function (language) {
            let p = $("<div>");
            p.html(AdVista24_frases["No admite viajeros"][language]);
            p.addClass("train-alighting-only-tag");
            if (i > 0) p.addClass("hidden");
            p.addClass("reducible");
            p.css("height", "100%");
            p.attr("line_number", i);
            i++;
            divt.append(p);
        });
        divt.addClass("scrollableL");
        divt.attr("total_lines", languages.length);
        divt.attr("unhidden_line", 0);
        div2.append(divt);
        div.append(div2);
        div.append(AdVista24_marginHTML("5", "train-alighting-only-margin"));
    }
    // Disposición horizontal
    else {
        div.append(AdVista24_marginHTML("2", "train-alighting-only-margin"));
        let div2 = $("<div>");
        div2.addClass("train-alighting-only-canvas");
        div2.css("width", "96%");
        let img = $("<img>");
        img.addClass("picto");
        img.addClass("svg_en_img");
        img.attr("src", AdVista24_getMultimediaFolder("svg") + "alighting_only.svg");
        img.css("height", "100%");
        img.css("width", "20%");
        div2.append(img);
        div2.append(AdVista24_marginHTML("2", "train-alighting-only-margin"));
        let divt = $("<div>");
        divt.css("height", "100%");
        divt.css("font-size", "40%");
        divt.css("width", "78%");
        languages.forEach(function (language) {
            let p = $("<div>");
            p.html(AdVista24_frases["No admite viajeros"][language]);
            p.addClass("train-alighting-only-tag");
            if (i > 0) p.addClass("hidden");
            p.addClass("reducible");
            p.css("height", "100%");
            p.attr("line_number", i);
            i++;

            divt.append(p);
        });
        divt.addClass("scrollableL");
        divt.attr("total_lines", languages.length);
        divt.attr("unhidden_line", 1);
        div2.append(divt);
        div.append(div2);
        div.append(AdVista24_marginHTML("2", "train-alighting-only-margin"));
    }

    return div;
}

function AdVista24_alphabeticalFirstTomorrowHTML(languages) {
    // Obtiene el elemento de clase .train-alighting-only

    // height es la altura en porcentaje del <div>.
    // journey_aspect_ratio es la relación de aspecto del lienzo para este elemento

    let div = $("<div>");
    div.addClass("alphabetical-train-info");

    let i = 0;
    div.append(AdVista24_marginHTML("5", "alphabetical-train-info-margin"));
    let divt = $("<div>");
    divt.css("height", "100%");
    divt.css("font-size", "40%");
    divt.css("width", "90%");

    languages.forEach(function (language) {
        let p = $("<div>");
        p.html(AdVista24_frases["Primer tren mañana"][language]);
        p.addClass("alphabetical-train-info-tag");
        if (i > 0) p.addClass("hidden");
        p.addClass("reducible");
        p.css("height", "100%");
        p.css("width", "100%");
        p.attr("line_number", i);
        i++;
        divt.append(p);
    });
    divt.addClass("scrollableL");
    divt.attr("total_lines", languages.length);
    divt.attr("unhidden_line", 1);

    div.append(divt);
    div.append(AdVista24_marginHTML("5", "alphabetical-train-info-margin"));

    return div;
}

function AdVista24_alphabeticalLastTodayHTML(languages) {
    // Obtiene el elemento de clase .train-alighting-only

    // height es la altura en porcentaje del <div>.
    // journey_aspect_ratio es la relación de aspecto del lienzo para este elemento

    let div = $("<div>");
    div.addClass("alphabetical-train-info");

    let i = 0;
    div.append(AdVista24_marginHTML("5", "alphabetical-train-info-margin"));
    let divt = $("<div>");
    divt.css("height", "100%");
    divt.css("font-size", "40%");
    divt.css("width", "90%");

    languages.forEach(function (language) {
        let p = $("<div>");
        p.html(AdVista24_frases["Último tren de hoy"][language]);
        p.addClass("alphabetical-train-info-tag");
        if (i > 0) p.addClass("hidden");
        p.addClass("reducible");
        p.css("height", "100%");
        p.css("width", "100%");
        p.attr("line_number", i);
        i++;
        divt.append(p);
    });
    divt.addClass("scrollableL");
    divt.attr("total_lines", languages.length);
    divt.attr("unhidden_line", 1);

    div.append(divt);
    div.append(AdVista24_marginHTML("5", "alphabetical-train-info-margin"));

    return div;
}

function AdVista24_trainClosedCheckInHTML(height, languages) {
    // Obtiene el elemento de clase .train-closed-check-in

    let div = $("<div>");
    div.addClass("train-closed-check-in");

    div.attr("style", "height: " + height + "%; font-size: " + height + "%; width: 100%;");

    let div2 = $("<div>");
    div2.addClass("train-closed-check-in-line");

    div2.attr("style", "height: 100%; font-size: 100%; width: 100%;");

    let check_value = "";

    let i = 0;
    languages.forEach(function (language) {
        let p = $("<div>");
        p.html(AdVista24_frases["Acceso cerrado"][language]);
        check_value = check_value + "#" + AdVista24_frases["Acceso cerrado"][language];
        p.addClass("closed-access-tag");
        p.addClass("hidden");
        p.attr("line_number", i);
        i++;

        div2.append(p);
    });

    div2.addClass("scrollableL");
    div2.attr("total_lines", languages.length);
    div2.attr("unhidden_line", -1);
    div2.attr("check-value", check_value);

    div.append(div2);
    return div;
}

function AdVista24_compositionSVG(
    train,
    platforms,
    pin_position,
    pin_style,
    platform_arrangement,
    sectors_highlight,
    composition_expanded,
    down_sectors
) {
    // Obtiene el SVG de la composición del tren. Dibujado dinámicamente.

    // Las dimensiones de .train-composition son aproximadamente 16:1
    let vbh_ini;
    let vbh;
    if (composition_expanded) {
        vbh_ini = 0;
        vbh = 150;
    } else {
        if (down_sectors) {
            vbh_ini = 42;
            vbh = 110;
        } else {
            vbh_ini = 0;
            vbh = 100;
        }
    }

    let vbw = 1600;

    let svg =
        "<svg width='100%' height='100%' style='font-size: 100%;' viewBox='0 " + vbh_ini + " " + vbw + " " + vbh + "'>";

    svg += "<style>";
    svg += ".sector { font-size: 45px; fill: white; }";
    svg += ".sector-away { font-size: 45px; fill: #999999; }";
    svg += ".guideline { font-size: 10px; fill: yellow; }";
    svg += ".coach { font-size: 48px; fill: #102341; }";
    svg += ".distance { font-size: 45px; fill: #FFCE6C; }";
    svg += "</style>";

    let platform_start = parseInt(platforms[train.platform]["platform_start"]);
    let platform_end = parseInt(platforms[train.platform]["platform_end"]);

    pin_position.forEach(function (pin_pos) {
        let ppint = parseInt(pin_pos);
        if (ppint < platform_start) platform_start = ppint;
        if (ppint > platform_end) platform_end = ppint;
    });

    let svg_start;
    let svg_end;
    let arrangement;
    if (platform_arrangement === "ascending") {
        arrangement = 1;
        svg_start = arrangement * Math.round(parseInt(platform_start) - (platform_end - platform_start) * 0.015);
        svg_end = arrangement * Math.round(platform_end + (platform_end - platform_start) * 0.015);
    } else {
        arrangement = -1;
        svg_end = arrangement * Math.round(platform_start - (platform_end - platform_start) * 0.015);
        svg_start = arrangement * Math.round(platform_end + (platform_end - platform_start) * 0.015);
    }

    //Determinamos el punto en que empezamos a dibujar el tren en la pantalla de izquierda a derecha
    let offset;
    let draw_locations = false;
    if (
        typeof train.stopping_point === "undefined" ||
        (train.orientation_out !== "right" && train.orientation_out !== "left") ||
        (train.stopping_point_reference !== "front" &&
            train.stopping_point_reference !== "middle" &&
            train.stopping_point_reference !== "rear" &&
            train.stopping_point_reference !== "left" &&
            train.stopping_point_reference !== "right")
    ) {
        //Punto de estacionamiento desconocido o sin todos los datos necesarios, dibujamos el tren en medio del monitor, y sin referencias de localización
        //No se comprueba el tipo de referencia de stopping_point
        offset = (svg_start + svg_end) / 2 - train.train_length / 20;
    } else {
        //Punto de estacionamiento conocido
        //Si va en dirección derecha empezamos a dibujar desde "rear", si va dirección izquierda empezamos a dibujar desde "front"
        switch (train.orientation_out) {
            case "left":
                switch (train.stopping_point_reference) {
                    case "front":
                    case "left":
                        offset = train.stopping_point;
                        break;
                    case "middle":
                        offset = train.stopping_point - train.train_length / 20;
                        break;
                    case "rear":
                    case "right":
                        offset = train.stopping_point - train.train_length / 10;
                        break;
                }

                break;
            case "right":
                switch (train.stopping_point_reference) {
                    case "front":
                    case "right":
                        offset = train.stopping_point - train.train_length / 10;
                        break;
                    case "middle":
                        offset = train.stopping_point - train.train_length / 20;
                        break;
                    case "rear":
                    case "left":
                        offset = train.stopping_point;
                        break;
                }

                break;
        }

        draw_locations = true;
    }

    const allowed_pins = [
        "pin",
        "stairs_down_left",
        "stairs_down_right",
        "stairs_up_left",
        "stairs_up_right",
        "lift_down",
        "lift_up",
        "accessible_lift_down",
        "accessible_lift_up",
    ];
    if (draw_locations) {
        if (typeof platforms[train.platform].sectors !== "undefined") {
            svg += AdVista24_compositionSectorsSVG(
                train.platform,
                platforms,
                offset,
                offset + train.train_length / 10,
                svg_start,
                svg_end,
                vbw,
                arrangement,
                sectors_highlight,
                composition_expanded,
                down_sectors,
                pin_position,
                pin_style
            );
        }
        pin_position.forEach(function (position, index) {
            if (allowed_pins.includes(pin_style[index])) {
                svg += AdVista24_compositionPinSVG(position, pin_style[index], svg_start, svg_end, vbw, arrangement);
            }
        });
    }

    // Punto inicial de la composicion
    let left_stopping_point = offset;

    svg += "<g style='font-size: 48px'>";

    if (train.orientation_out === "left") {
        // El coche de cabeza está a la izquierda, dibujamos la composición de izquierda a derecha empezando por el primero
        for (let j = 0; j < train.composition.length; j++) {
            for (let i = 0; i < train.composition[j].length; i++) {
                let coach_length = train.composition[j][i].length / 10;
                let color = "#5FE0AF";
                if (typeof train.composition[j][i].info !== "undefined") {
                    if (train.composition[j][i].info.includes("high_occupancy")) color = "#FF8557";
                    else if (train.composition[j][i].info.includes("medium_occupancy")) color = "#FFCE6C";
                    else if (train.composition[j][i].info.includes("low_occupancy")) color = "#5FE0AF";
                }
                if (train.composition[j][i].type === "A" && i === 0) train.composition[j][i].type = "AL";
                if (train.composition[j][i].type === "A" && i === train.composition[j].length - 1)
                    train.composition[j][i].type = "AR";
                svg += AdVista24_compositionCoachSVG(
                    train.composition[j][i].type,
                    color,
                    train.orientation_out,
                    train.composition[j][i].number,
                    train.composition[j][i].info,
                    offset,
                    offset + coach_length,
                    svg_start,
                    svg_end,
                    vbw,
                    vbh,
                    arrangement
                );
                offset += coach_length;
            }
        }
    } else {
        // El coche de cabeza está a la derecha, dibujamos la composición de izquierda a derecha empezando por el último
        for (let j = train.composition.length - 1; j >= 0; j--) {
            for (let i = train.composition[j].length - 1; i >= 0; i--) {
                let coach_length = train.composition[j][i].length / 10;
                let color = "#5FE0AF";
                if (typeof train.composition[j][i].info !== "undefined") {
                    if (train.composition[j][i].info.includes("high_occupancy")) color = "#FF8557";
                    else if (train.composition[j][i].info.includes("medium_occupancy")) color = "#FFCE6C";
                    else if (train.composition[j][i].info.includes("low_occupancy")) color = "#5FE0AF";
                }
                if (train.composition[j][i].type === "A" && i === 0) train.composition[j][i].type = "AL";
                if (train.composition[j][i].type === "A" && i === train.composition[j].length - 1)
                    train.composition[j][i].type = "AR";
                svg += AdVista24_compositionCoachSVG(
                    train.composition[j][i].type,
                    color,
                    train.orientation_out,
                    train.composition[j][i].number,
                    train.composition[j][i].info,
                    offset,
                    offset + coach_length,
                    svg_start,
                    svg_end,
                    vbw,
                    vbh,
                    arrangement
                );
                offset += coach_length;
            }
        }
    }

    svg += "</g>";

    // Punto final de la composicion
    let right_stopping_point = offset;

    // Dibujo de la flecha con la distancia cuando la composición del tren está alejada del monitor (situado en pin_position[0])
    if (draw_locations && pin_position.length > 0) {
        let main_position = pin_position[0];

        let nearest_stopping_point = left_stopping_point;
        if (Math.abs(left_stopping_point - main_position) > Math.abs(right_stopping_point - main_position)) {
            nearest_stopping_point = right_stopping_point;
        }

        let train_distance = Math.round(Math.abs(nearest_stopping_point - main_position) / 25) * 25;

        if (
            (main_position < left_stopping_point && main_position < right_stopping_point) ||
            (main_position > left_stopping_point && main_position > right_stopping_point)
        ) {
            if (train_distance > 50) {
                svg += AdVista24_compositionDistanceSVG(
                    main_position,
                    nearest_stopping_point,
                    train_distance,
                    svg_start,
                    svg_end,
                    vbw,
                    arrangement
                );
            }
        }
    }

    if (draw_locations && AdVista24_show_composition_guide) {
        // Dibujo de líneas guía de referencia para hacer pruebas. Desactivado en producción
        svg += AdVista24_compositionGuideSVG(svg_start, svg_end, vbw, vbh, arrangement);
    }

    svg += "</svg>";

    return svg;
}

function AdVista24_compositionDistanceSVG(
    main_position,
    nearest_stopping_point,
    train_distance,
    svg_start,
    svg_end,
    vbw,
    arrangement
) {
    // Obtiene los elementos SVG de la indicación de distancia y posición de composición alejada.

    let svg = "";

    if (arrangement * main_position > arrangement * nearest_stopping_point) {
        svg += '<polyline class="moving-strokes" points="';
        svg += svgPointX(arrangement * main_position) + "," + 70 + " ";
        svg += svgPointX(arrangement * nearest_stopping_point) + 10 + "," + 70 + " ";
    } else {
        svg += '<polyline class="moving-strokes" points="';
        svg += svgPointX(arrangement * main_position) + "," + 70 + " ";
        svg += svgPointX(arrangement * nearest_stopping_point) - 10 + "," + 70 + " ";
    }
    svg +=
        '" stroke="#FFCE6C" stroke-width="' +
        0.003 * vbw +
        '" fill="transparent" stroke-dasharray="15 15" stroke-dashoffset="0" />';

    svg += '<polyline points="';
    if (arrangement * main_position > arrangement * nearest_stopping_point) {
        svg += svgPointX(arrangement * nearest_stopping_point) + 25 + "," + 55 + " ";
        svg += svgPointX(arrangement * nearest_stopping_point) + 10 + "," + 70 + " ";
        svg += svgPointX(arrangement * nearest_stopping_point) + 25 + "," + 85 + " ";
    } else {
        svg += svgPointX(arrangement * nearest_stopping_point) - 25 + "," + 55 + " ";
        svg += svgPointX(arrangement * nearest_stopping_point) - 10 + "," + 70 + " ";
        svg += svgPointX(arrangement * nearest_stopping_point) - 25 + "," + 85 + " ";
    }
    svg += '" stroke="#FFCE6C" stroke-width="' + 0.003 * vbw + '" fill="transparent"  />';

    svg += '<polyline points="';
    if (arrangement * main_position > arrangement * nearest_stopping_point) {
        svg += svgPointX(arrangement * nearest_stopping_point) + 10 + "," + 70 + " ";
        svg += svgPointX(arrangement * nearest_stopping_point) + 30 + "," + 70 + " ";
    } else {
        svg += svgPointX(arrangement * nearest_stopping_point) - 10 + "," + 70 + " ";
        svg += svgPointX(arrangement * nearest_stopping_point) - 30 + "," + 70 + " ";
    }

    svg += '" stroke="#FFCE6C" stroke-width="' + 0.003 * vbw + '" fill="transparent"  />';

    let middle_point;
    if (arrangement * main_position > arrangement * nearest_stopping_point) {
        middle_point =
            (svgPointX(arrangement * main_position) + svgPointX(arrangement * nearest_stopping_point) + 10) / 2;
    } else {
        middle_point =
            (svgPointX(arrangement * main_position) + svgPointX(arrangement * nearest_stopping_point) - 10) / 2;
    }

    svg += "<g class='distance-rectangle'>";
    svg += "<rect width='0' height='50' x='" + middle_point + "' y='" + 45 + "' fill='blue' />";
    svg +=
        "<text x='" +
        middle_point +
        "' y='" +
        85 +
        "' class='distance' text-anchor='middle'>" +
        train_distance +
        " m" +
        "</text>";
    svg += "";
    svg += "</g>";

    return svg;

    function svgPointX(x) {
        return ((x - svg_start) / (svg_end - svg_start)) * vbw;
    }
}

function AdVista24_compositionSectorsSVG(
    train_platform,
    platforms,
    train_start,
    train_end,
    svg_start,
    svg_end,
    vbw,
    arrangement,
    sectors_highlight,
    composition_expanded,
    down_sectors,
    pin_position,
    pin_style
) {
    // Obtiene los elementos SVG de los sectores en el dibujo de la composición

    let svg = "";

    let sectors = platforms[train_platform]["sectors"];
    if (arrangement === -1) {
        let train_end_bis = arrangement * train_start;
        train_start = arrangement * train_end;
        train_end = train_end_bis;
    }

    let sector_y_position = 35;
    if (down_sectors) {
        sector_y_position = 136;
    }

    for (let i = 0; i < sectors.length; i++) {
        let highlight = true;

        let sector_position = arrangement * sectors[i]["position"];
        let sector_letter = sectors[i]["name"];

        //Si el sector está a una distancia inferior a 30 de un pictograma de localización, no se dibuja
        //salvo que se esté dibujando en modo expandido y el pictograma sea inferior
        let draw_sector = true;
        pin_position.forEach(function (pin_pos, index) {
            if (Math.abs(svgPointX(pin_pos) - svgPointX(sector_position)) < 30) {
                if (!composition_expanded) draw_sector = false;
                else if (
                    pin_style[index] === "stairs_down_left" ||
                    pin_style[index] === "stairs_down_right" ||
                    pin_style[index] === "lift_down" ||
                    pin_style[index] === "accessible_lift_down" ||
                    pin_style[index] === "pin"
                )
                    draw_sector = false;
            }
        });

        if (!draw_sector) continue;

        if (sectors_highlight && (sector_position < train_start || sector_position > train_end)) highlight = false;

        if (highlight) {
            svg +=
                "<text x='" +
                svgPointX(sector_position) +
                "' y='" +
                sector_y_position +
                "' class='sector' text-anchor='middle'>" +
                sector_letter +
                "</text>";
        } else {
            svg +=
                "<text x='" +
                svgPointX(sector_position) +
                "' y='" +
                sector_y_position +
                "' class='sector-away' text-anchor='middle'>" +
                sector_letter +
                "</text>";
        }
    }

    return svg;

    function svgPointX(x) {
        return ((x - svg_start) / (svg_end - svg_start)) * vbw;
    }
}

function AdVista24_compositionPinSVG(pin_position, pin_style, svg_start, svg_end, vbw, arrangement) {
    // Obtiene el elemento SVG de un pin de situación en el dibujo de la composición

    let picto_width = [];
    picto_width["pin"] = 36;
    picto_width["stairs_down_left"] = 48;
    picto_width["stairs_down_right"] = 48;
    picto_width["stairs_up_right"] = 50;
    picto_width["stairs_up_left"] = 50;
    picto_width["lift_down"] = 38;
    picto_width["lift_up"] = 38;
    picto_width["accessible_lift_down"] = 38;
    picto_width["accessible_lift_up"] = 38;

    if (arrangement === -1) {
        if (pin_style === "stairs_down_left") pin_style = "stairs_down_right";
        else if (pin_style === "stairs_down_right") pin_style = "stairs_down_left";
        else if (pin_style === "stairs_up_left") pin_style = "stairs_up_right";
        else if (pin_style === "stairs_up_right") pin_style = "stairs_up_left";
    }

    switch (pin_style) {
        case "pin":
            return (
                "<image class='bouncing' href='" +
                AdVista24_getMultimediaFolder("svg") +
                pin_style +
                ".svg?v=1' x ='" +
                (svgPointX(arrangement * pin_position) - picto_width[pin_style] / 2) +
                "' y = '" +
                0 +
                "' width='" +
                picto_width[pin_style] +
                "' />"
            );
        case "stairs_down_left":
        case "stairs_down_right":
            return (
                "<image class='not-bouncing' href='" +
                AdVista24_getMultimediaFolder("svg") +
                pin_style +
                ".svg?v=1' x ='" +
                (svgPointX(arrangement * pin_position) - picto_width[pin_style] / 2) +
                "' y = '" +
                0 +
                "' width='" +
                picto_width[pin_style] +
                "' />"
            );
        case "stairs_up_left":
        case "stairs_up_right":
            return (
                "<image href='" +
                AdVista24_getMultimediaFolder("svg") +
                pin_style +
                ".svg?v=1' x ='" +
                (svgPointX(arrangement * pin_position) - picto_width[pin_style] / 2) +
                "' y = '" +
                98 +
                "' width='" +
                picto_width[pin_style] +
                "' />"
            );
        case "lift_down":
            return (
                "<image class='not-bouncing' href='" +
                AdVista24_getMultimediaFolder("svg") +
                "lift" +
                ".svg?v=1' x ='" +
                (svgPointX(arrangement * pin_position) - picto_width[pin_style] / 2) +
                "' y = '" +
                0 +
                "' width='" +
                picto_width[pin_style] +
                "' />"
            );
        case "lift_up":
            return (
                "<image href='" +
                AdVista24_getMultimediaFolder("svg") +
                "lift" +
                ".svg?v=1' x ='" +
                (svgPointX(arrangement * pin_position) - picto_width[pin_style] / 2) +
                "' y = '" +
                100 +
                "' width='" +
                picto_width[pin_style] +
                "' />"
            );
        case "accessible_lift_down":
            return (
                "<image class='not-bouncing' href='" +
                AdVista24_getMultimediaFolder("svg") +
                "accessible_lift" +
                ".svg?v=1' x ='" +
                (svgPointX(arrangement * pin_position) - picto_width[pin_style] / 2) +
                "' y = '" +
                0 +
                "' width='" +
                picto_width[pin_style] +
                "' />"
            );
        case "accessible_lift_up":
            return (
                "<image href='" +
                AdVista24_getMultimediaFolder("svg") +
                "accessible_lift" +
                ".svg?v=1' x ='" +
                (svgPointX(arrangement * pin_position) - picto_width[pin_style] / 2) +
                "' y = '" +
                100 +
                "' width='" +
                picto_width[pin_style] +
                "' />"
            );
    }

    function svgPointX(x) {
        return ((x - svg_start) / (svg_end - svg_start)) * vbw;
    }
}

function AdVista24_compositionCoachSVG(
    type,
    color,
    direction,
    number,
    info,
    coach_start,
    coach_end,
    svg_start,
    svg_end,
    vbw,
    vbh,
    arrangement
) {
    // Obtiene el elemento SVG de un coche de la composición

    const COACH_SEPARATION_VIEWBOX = 0.1; //separación visual entre dos coches (en % del ancho del monitor)
    const COACH_RADIUS_VIEWBOX = 0.5; //radio de las esquinas redondeadas de los coches (en % del ancho del monitor)
    const MOTOR_RADIUS_VIEWBOX = 2.0; //radio del morro de automotores (en % del ancho del monitor)

    let svg = "";

    if (arrangement === -1) {
        let coach_end_bis = arrangement * coach_start;
        coach_start = arrangement * coach_end;
        coach_end = coach_end_bis;
        if (type === "AR") type = "AL";
        else if (type === "AL") type = "AR";
    }

    let coach_separation = (COACH_SEPARATION_VIEWBOX / 100) * (svg_end - svg_start); //en metros reales
    let coach_radius = (COACH_RADIUS_VIEWBOX / 100) * (svg_end - svg_start); //en metros reales
    let motor_radius = (MOTOR_RADIUS_VIEWBOX / 100) * (svg_end - svg_start); //en metros reales
    let coach_svg_length = svgPointX(coach_end - coach_separation) - svgPointX(coach_start + coach_separation);

    // Los tipos de coche de extremo de automotor AR (automotor-right) y AL (automotor-left) están definidos para un tren que se mueve hacia la izquierda
    // Si el tren se va a mover hacia la derecha, hay que invertir la definición de los extremos del automotor
    if (direction !== "left") {
        if (type === "AR") type = "AL";
        else if (type === "AL") type = "AR";
    }
    svg += "<polygon points='";
    svg += svgPointX(coach_start + coach_separation) + "," + 95 + " ";
    switch (type) {
        case "C":
        case "AR":
        case "A":
            for (let a = 0; a <= Math.PI / 2; a = a + Math.PI / 20) {
                svg +=
                    svgPointX(coach_start + coach_separation + coach_radius * (1 - Math.cos(a))) +
                    "," +
                    (45 + COACH_RADIUS_VIEWBOX * 16 * (1 - Math.sin(a))) +
                    " ";
            }
            break;
        case "AL":
        case "L":
            for (let a = 0; a <= Math.PI / 2; a = a + Math.PI / 20) {
                svg +=
                    svgPointX(coach_start + coach_separation + motor_radius * (1 - Math.cos(a))) +
                    "," +
                    (45 + MOTOR_RADIUS_VIEWBOX * 16 * (1 - Math.sin(a))) +
                    " ";
            }
            break;
    }
    svg += svgPointX(coach_end - coach_separation) + "," + 45 + " ";
    switch (type) {
        case "C":
        case "AL":
        case "A":
            for (let a = 0; a <= Math.PI / 2; a = a + Math.PI / 20) {
                svg +=
                    svgPointX(coach_end - coach_separation - coach_radius * (1 - Math.sin(a))) +
                    "," +
                    (45 + COACH_RADIUS_VIEWBOX * 16 * (1 - Math.cos(a))) +
                    " ";
            }
            break;
        case "AR":
        case "L":
            for (let a = 0; a <= Math.PI / 2; a = a + Math.PI / 20) {
                svg +=
                    svgPointX(coach_end - coach_separation - motor_radius * (1 - Math.sin(a))) +
                    "," +
                    (45 + MOTOR_RADIUS_VIEWBOX * 16 * (1 - Math.cos(a))) +
                    " ";
            }
            break;
    }
    svg += svgPointX(coach_end - coach_separation) + "," + 95 + "'";
    svg += " fill='" + color + "' stroke='none' />";

    //Número de coche
    if (typeof number === "undefined") number = "";
    svg +=
        "<text x='" +
        svgPointX((coach_start + coach_end) / 2) +
        "' y='" +
        70 +
        "' dy='.35em' class='coach' text-anchor='middle' coach-lenght='" +
        coach_svg_length +
        "'>" +
        number +
        "</text>";

    //Prestaciones
    if (typeof info === "undefined") info = [];

    if (info.includes("accessible")) {
        svg += AdVista24_coachPictoSVG("PMR", coach_svg_length, coach_start, coach_end, svg_start, svg_end, vbw, 20);
        return svg;
    }

    if (info.includes("restaurant")) {
        svg += AdVista24_coachPictoSVG(
            "RESTAURANT",
            coach_svg_length,
            coach_start,
            coach_end,
            svg_start,
            svg_end,
            vbw,
            20
        );
        return svg;
    }

    if (info.includes("bar")) {
        svg += AdVista24_coachPictoSVG("BAR", coach_svg_length, coach_start, coach_end, svg_start, svg_end, vbw, 20);
        return svg;
    }

    if (info.includes("bicycles")) {
        svg += AdVista24_coachPictoSVG("BICYCLE", coach_svg_length, coach_start, coach_end, svg_start, svg_end, vbw, 5);
        return svg;
    }

    if (info.includes("high_occupancy")) {
        svg += AdVista24_coachPictoSVG(
            "HIGH_OCUPPANCY",
            coach_svg_length,
            coach_start,
            coach_end,
            svg_start,
            svg_end,
            vbw,
            3
        );
    } else if (info.includes("medium_occupancy")) {
        svg += AdVista24_coachPictoSVG(
            "MEDIUM_OCUPPANCY",
            coach_svg_length,
            coach_start,
            coach_end,
            svg_start,
            svg_end,
            vbw,
            3
        );
    } else if (info.includes("low_occupancy")) {
        svg += AdVista24_coachPictoSVG(
            "LOW_OCUPPANCY",
            coach_svg_length,
            coach_start,
            coach_end,
            svg_start,
            svg_end,
            vbw,
            3
        );
    }

    return svg;

    function svgPointX(x) {
        return ((x - svg_start) / (svg_end - svg_start)) * vbw;
    }
}

function AdVista24_coachPictoSVG(
    picto_name,
    coach_svg_length,
    coach_start,
    coach_end,
    svg_start,
    svg_end,
    vbw,
    margin
) {
    // Obtiene el pictograma de coche en composición

    let picto_width = ((100 - margin) / 100) * Math.min(coach_svg_length, 50);
    return (
        "<image href='" +
        AdVista24_getMultimediaFolder("coach_pictos") +
        picto_name +
        ".svg?v=1' x ='" +
        (svgPointX((coach_start + coach_end) / 2) - picto_width / 2) +
        "' y = '" +
        (70 - picto_width / 2) +
        "' width='" +
        picto_width +
        "' />"
    );

    function svgPointX(x) {
        return ((x - svg_start) / (svg_end - svg_start)) * vbw;
    }
}

function AdVista24_compositionGuideSVG(svg_start, svg_end, vbw, vbh, arrangement) {
    // Obtiene una guía métrica para hacer pruebas en el dibujo de composiciones
    let svg = "";

    let station_start = svg_start;
    let station_end = svg_end;

    for (let i = station_start; i <= station_end; i++) {
        if (i % 10 === 0) {
            svg +=
                "<line x1='" +
                ((i - station_start) / (station_end - station_start)) * vbw +
                "' y1='" +
                35 +
                "' x2='" +
                ((i - station_start) / (station_end - station_start)) * vbw +
                "' y2='" +
                95 +
                "' stroke='#FFFF00' stroke-width='" +
                0.01 * vbh +
                "' />";
            svg +=
                "<text x='" +
                ((i - station_start) / (station_end - station_start)) * vbw +
                "' y='" +
                65 +
                "' class='guideline' text-anchor='middle'>" +
                arrangement * i +
                "</text>";
        } else if (i % 2 === 0) {
            svg +=
                "<line x1='" +
                ((i - station_start) / (station_end - station_start)) * vbw +
                "' y1='" +
                40 +
                "' x2='" +
                ((i - station_start) / (station_end - station_start)) * vbw +
                "' y2='" +
                90 +
                "' stroke='#FFFF00' stroke-width='" +
                0.005 * vbh +
                "' />";
        }
    }

    return svg;
}

function AdVista24_adifClockHTML(aspect_ratio, monitor_class) {
    // Obtiene el elemento clase .adif-clock
    let cl = $("<div>");
    cl.addClass("adif-clock");
    cl.attr("style", "width: 100%; height: 100%; font-size: 100%;");
    if (monitor_class !== "black-clock") {
        cl.addClass("adif-blue-clock");
        if (aspect_ratio < 2.8) {
            cl.addClass("adif-vertical-clock");
            let space1 = $("<div>");
            space1.attr("style", "width: 100%; height: 10%;");
            cl.append(space1);
            let logo = $("<div>");
            logo.addClass("adif-logo");
            logo.attr("style", "width: 100%; height: 40%;");
            logo.append(AdVista24_logoHTML(monitor_class, 100));
            cl.append(logo);
            let time = $("<div>");
            time.addClass("adif-clock-time");
            let font_size = 20 * Math.sqrt(aspect_ratio);
            if (aspect_ratio <= 1) font_size = 20 * aspect_ratio;
            time.attr("style", "width: 100%; height: 40%; font-size:" + font_size + "%;");
            time.append(AdVista24_clockHTML(100));
            cl.append(time);
            let space2 = $("<div>");
            space2.attr("style", "width: 100%; height: 10%;");
            cl.append(space2);
        } else {
            cl.addClass("adif-horizontal-clock");
            let logo = $("<div>");
            logo.addClass("adif-logo");
            logo.attr("style", "width: 50%; height: 100%; padding-top: 1.5%;");
            logo.append(AdVista24_logoHTML(monitor_class, 100));
            cl.append(logo);
            let time = $("<div>");
            time.addClass("adif-clock-time");
            let font_size = 18 * Math.sqrt(aspect_ratio);
            time.attr("style", "width: 50%; height: 100%; font-size:" + font_size + "%;");
            time.append(AdVista24_clockHTML(100));
            cl.append(time);
        }
    } else {
        // black-clock
        cl.addClass("adif-black-clock");
        if (aspect_ratio < 2.8) {
            cl.addClass("adif-vertical-clock");
            let time = $("<div>");
            time.addClass("adif-clock-time");
            let font_size = (font_size = 20 * Math.sqrt(aspect_ratio));
            if (aspect_ratio <= 1) font_size = 20 * aspect_ratio;
            time.attr("style", "width: 100%; height: 100%; font-size:" + font_size + "%;");
            time.append(AdVista24_clockHTML(100));
            cl.append(time);
        } else {
            cl.addClass("adif-horizontal-clock");
            let time = $("<div>");
            time.addClass("adif-clock-time");
            let font_size = 18 * Math.sqrt(aspect_ratio);
            time.attr("style", "width: 100%; height: 100%; font-size:" + font_size + "%;");
            time.append(AdVista24_clockHTML(100));
            cl.append(time);
        }
    }

    return cl;
}

function AdVista24_trainInfoComplement(train) {
    //Complementa la información del recorrido del tren obtenida en el JSON para obtener los datos lógicos que
    //permiten dibujar el termómetro de recorrido con distintas ramas y colores de línea.

    //Si una estación no tiene rama declarada asume branch = 0. Carga valores iniciales por defecto.
    train.journey_stops_destination.forEach(function (train_stop) {
        if (typeof train_stop.branch === "undefined") {
            train_stop["branch"] = 0;
        }
        if (typeof train_stop.branch_decouple === "undefined") {
            train_stop["branch_decouple"] = [];
        }
        train_stop["starts_new_branch"] = false;
    });

    // Comprueba que los branch_decouple están bien definidos (Antes de la primera parada de la rama)
    // Si está mal definido o no está declarado el branch_decouple lo reasigna a la primera parada anterior a la rama
    let started_branches = [];
    if (train.journey_stops_destination.length > 0) started_branches.push(train.journey_stops_destination[0].branch);
    for (let i = 0; i < train.journey_stops_destination.length; i++) {
        let train_stop = train.journey_stops_destination[i];
        if (!started_branches.includes(train_stop.branch) && i > 1) {
            //Nueva rama detectada sin declarar previamente branch_decouple. Se asigna a la parada anterior
            let previous_stop = train.journey_stops_destination[i - 1];
            previous_stop.branch_decouple.push(train_stop.branch);
            started_branches.push(train_stop.branch);
        }
        //Observamos los branch_decouples declarados en la parada. Si ya se han designado previamente, se eliminan, si no se añaden a la lista.
        for (let j = 0; j < train_stop.branch_decouple.length; j++) {
            if (started_branches.includes(train_stop.branch_decouple[j])) {
                //Desacople ya declarado. Se elimina
                train_stop.branch_decouple.splice(j, 1);
                j--;
            } else {
                //Nueva rama. Se añade a la lista
                started_branches.push(train_stop.branch_decouple[j]);
            }
        }
    }

    //Obtenemos la lista de origenes y destinos declarados
    let train_destinations = [];
    train.destinations.forEach(function (train_stop) {
        train_destinations.push(train_stop.code);
    });
    let train_origins = [];
    train.origins.forEach(function (train_stop) {
        train_origins.push(train_stop.code);
    });

    //En la lista de paradas (se asume ordenada por orden) se asigna el parametro last_in_branch = "true" a la última parada de cada rama
    //Es necesario para evitar duplicar la última parada en recorrido y en destino en la lista de paradas horizontal
    //Para tener en cuenta el caso de destinos fictios y que por lo tanto deba mostrarse la última parada en la lista horizontal
    //se asigna el parámetro declared_as_destination

    let branch_list = [];
    let has_intermediate_stops = false;
    for (let i = train.journey_stops_destination.length - 1; i >= 0; i--) {
        let train_stop = train.journey_stops_destination[i];
        if (!branch_list.includes(train_stop.branch)) {
            branch_list.push(train_stop.branch);
            train_stop["last_in_branch"] = true;
        } else {
            train_stop["last_in_branch"] = false;
        }
        train_stop["declared_as_destination"] = train_destinations.includes(train_stop.code);
        if (!train_stop["declared_as_destination"]) has_intermediate_stops = true;
        train_stop["color"] = [];
    }

    //Si el tren tiene alguna estación que no está declarada como destino, se asigna el parametro has_intermediate_destination_stops = "true"
    train["has_intermediate_destination_stops"] = has_intermediate_stops;

    //Operaciones similares con el recorrido de origen.
    //"declared_as_destination" en el contexto de origen significa declarada como origen
    has_intermediate_stops = false;
    for (let i = 0; i < train.journey_stops_origin.length; i++) {
        let train_stop = train.journey_stops_origin[i];
        train_stop["declared_as_destination"] = train_origins.includes(train_stop.code);
        if (!train_stop["declared_as_destination"]) has_intermediate_stops = true;
    }
    train["has_intermediate_origin_stops"] = has_intermediate_stops;

    // Reorganiza el listado de paradas para que cada nueva rama vaya inmediatamente después de su branch_decouple
    // Presupone branch_decouples bien definidos (en apartado anterior)
    // Asigna el flag starts_new_branch cuando se inicia una nueva rama a la derecha (no aplica a la primera rama creada desde una estación last_in_branch)
    for (let i = 0; i < train.journey_stops_destination.length; i++) {
        let train_stop = train.journey_stops_destination[i];

        let first_new_branch = true;
        train_stop.branch_decouple.forEach(function (new_branch) {
            let next_pos = i + 1;
            let starts_new_branch = true;
            for (let j = i + 1; j < train.journey_stops_destination.length; j++) {
                if (train.journey_stops_destination[j].branch === new_branch) {
                    //Asignamos valor de start_new_branch
                    if (first_new_branch && train_stop.last_in_branch) starts_new_branch = false;
                    train.journey_stops_destination[j].starts_new_branch = starts_new_branch;
                    first_new_branch = false;
                    starts_new_branch = false;
                    //Cortamos parada en posicion j
                    let stop = train.journey_stops_destination.splice(j, 1)[0];
                    //Insertamos la parada en la posición next_pos
                    train.journey_stops_destination.splice(next_pos, 0, stop);

                    //Actualizamos next_pos
                    next_pos++;
                }
            }
        });
    }

    // Una vez reordenado el array de estaciones y obtenidos los last_in_branch, calculamos las tabulaciones
    // branch_decouple genera una nueva tabulación y last_in_branch la elimina
    // Asignamos color blanco por defecto

    let actual_tab = 0;
    for (let i = 0; i < train.journey_stops_destination.length; i++) {
        let train_stop = train.journey_stops_destination[i];

        if (train_stop.starts_new_branch) actual_tab++;

        train_stop.tabulate = actual_tab;
        train_stop["color"][train_stop.tabulate] = "#FFFFFF";

        if (train_stop.last_in_branch && train_stop.branch_decouple.length === 0) {
            //Retrocedemos dos tabulaciones (la nueva parada generará otra tabulación)
            actual_tab--;
        }
    }

    //Asignación de colores de línea para el dibujo del recorrido de acuerdo a los datos en destinos
    //Obtiene los colores y destinos asociados al color

    if (train.destinations.length === 1) {
        //Si solo hay un destino, todas las paradas toman el mismo color
        let line_color = train.destinations[0].line_color;
        if (typeof line_color === "undefined") line_color = AdVista24_line_colors[train.destinations[0].line];
        if (typeof line_color === "undefined") line_color = "#FFFFFF";

        for (let i = train.journey_stops_destination.length - 1; i >= 0; i--) {
            let train_stop = train.journey_stops_destination[i];
            for (let tab = 0; tab <= train_stop.tabulate; tab++) {
                train_stop.color[tab] = line_color;
            }
        }
    } else {
        //Si hay más de un destino, empezando por el último hasta el primero, busca la parada de destino y asigna los colores hasta origen (en cascada de destino hasta origen)
        for (let j = train.destinations.length - 1; j >= 0; j--) {
            let destination_code = train.destinations[j].code;

            let line_color = train.destinations[j].line_color;
            if (typeof line_color === "undefined") line_color = AdVista24_line_colors[train.destinations[j].line];
            if (typeof line_color === "undefined") line_color = "#FFFFFF";

            let found = false;
            let tab = 0;
            for (let i = train.journey_stops_destination.length - 1; i >= 0; i--) {
                let train_stop = train.journey_stops_destination[i];

                if (train_stop.code === destination_code) {
                    found = true;
                    tab = train_stop.tabulate;
                }
                if (found && tab <= train_stop.tabulate) {
                    train_stop["color"][tab] = line_color;
                }
            }
        }
    }

    return train;
}

function AdVista24_filtroTrenes(
    monitor_class,
    train,
    class_stop_filter,
    traffic_filter,
    traffic_include,
    company_filter,
    company_include,
    product_filter,
    product_include,
    access_filter,
    access_include,
    platform_filter,
    platform_include,
    stop_filter,
    stop_include,
    custom_filter,
    custom_include,
    sector_filter
) {
    // Indica si se ha de pintar el tren en función de los atributos filter o include de la interfaz

    // Crea el atributo platform_locations y platform_locations_in si no se han definido previamente
    if (typeof train.platform_locations === "undefined") {
        train.platform_locations = [];
        if (train.platform !== "" && typeof train.platform !== "undefined") {
            train.platform_locations.push(train.platform);
            if (typeof train.sectors !== "undefined") {
                train.sectors.forEach(function (sector) {
                    train.platform_locations.push(train.platform + sector);
                });
            }
        }

        if (typeof train.platform_preview !== "undefined") {
            train.platform_locations.push(train.platform_preview);
        }
    }

    if (typeof train.platform_in !== "undefined") {
        train.platform_locations_in = [];
        if (train.platform_in !== "" && typeof train.platform_in !== "undefined") {
            train.platform_locations_in.push(train.platform_in);
            if (typeof train.sectors_in !== "undefined") {
                train.sectors_in.forEach(function (sector) {
                    train.platform_locations_in.push(train.platform_in + sector);
                });
            }
        }

        if (typeof train.platform_preview_in !== "undefined") {
            train.platform_locations_in.push(train.platform_preview_in);
        }
    }

    // Genera delay_in y delay_out a 0 si no estan declarados
    if (typeof train.delay_in === "undefined") train.delay_in = 0;
    if (typeof train.delay_out === "undefined") train.delay_out = 0;

    // Genera countdown si no estuviera bien declarado
    if (typeof train.countdown === "undefined") {
        let hora_estimada = new Date(train.departure_time);
        hora_estimada.setMinutes(hora_estimada.getMinutes() + train.delay_out);
        let hora_actual = new Date();
        train.countdown = Math.floor((hora_estimada - hora_actual) / (1000 * 60));
    }
    if (train.countdown < 0) {
        train.countdown = 0;
    }

    // FILTRADO DE TIPO DE PARADA.
    // Tiene prioridad para excluir sobre el resto ya que filtra trenes tipo destino en interaz de salidas y similares
    if (!(class_stop_filter.length === 0)) {
        if (!class_stop_filter.includes(train.class_stop)) {
            return false;
        }
    }

    // FILTROS DE INCLUSIÓN OBLIGATORIA
    if (!(traffic_include.length === 0)) {
        if (traffic_include.includes(train.traffic_type)) {
            return true;
        }
    }

    if (!(company_include.length === 0)) {
        if (company_include.includes(train.company)) {
            return true;
        }
    }

    if (!(product_include.length === 0)) {
        let found = false;
        train.commercial_id.forEach(function (com_id) {
            if (product_include.includes(com_id.product)) {
                found = true;
                if (typeof com_id.restricted !== "undefined") {
                    if (monitor_class === "departures" && com_id.restricted === "destination") {
                        found = false;
                    }
                    if (monitor_class === "arrivals" && com_id.restricted === "origin") {
                        found = false;
                    }
                }
            }
        });
        if (found) return true;
    }

    if (!(access_include.length === 0)) {
        let found = false;
        if (monitor_class === "departures") {
            if (Array.isArray(train.departures_access)) {
                train.departures_access.forEach(function (access) {
                    if (access_include.includes(access)) {
                        found = true;
                    }
                });
                if (found) return true;
            }
        } else {
            if (Array.isArray(train.arrivals_access)) {
                train.arrivals_access.forEach(function (access) {
                    if (access_include.includes(access)) {
                        found = true;
                    }
                });
                if (found) return true;
            }
        }
    }

    if (!(platform_include.length === 0)) {
        if (monitor_class === "arrivals" && typeof train.platform_in !== "undefined") {
            if (platform_include.some((platf) => train.platform_locations_in.includes(platf))) {
                return true;
            }
        } else {
            if (platform_include.some((platf) => train.platform_locations.includes(platf))) {
                return true;
            }
        }
    }

    if (!(stop_include.length === 0)) {
        let found = false;
        if (monitor_class === "arrivals") {
            train.journey_stops_origin.forEach(function (stop) {
                if (stop_include.includes(stop.code)) {
                    found = true;
                }
            });
            if (found) return true;
        } else {
            train.journey_stops_destination.forEach(function (stop) {
                if (stop_include.includes(stop.code)) {
                    found = true;
                }
            });
            if (found) return true;
        }
    }

    if (!(custom_include.length === 0)) {
        if (Array.isArray(train.custom_categories)) {
            let found = false;
            train.custom_categories.forEach(function (custom_categ) {
                if (custom_include.includes(custom_categ)) {
                    found = true;
                }
            });
            if (found) return true;
        }
    }

    // FILTROS NORMALES
    if (!(traffic_filter.length === 0)) {
        if (!traffic_filter.includes(train.traffic_type)) {
            return false;
        }
    }

    if (!(company_filter.length === 0)) {
        if (!company_filter.includes(train.company)) {
            return false;
        }
    }

    if (!(product_filter.length === 0)) {
        let found = false;
        train.commercial_id.forEach(function (com_id) {
            if (product_filter.includes(com_id.product)) {
                found = true;
                if (typeof com_id.restricted !== "undefined") {
                    if (monitor_class === "departures" && com_id.restricted === "destination") {
                        found = false;
                    }
                    if (monitor_class === "arrivals" && com_id.restricted === "origin") {
                        found = false;
                    }
                }
            }
        });
        if (!found) return false;
    }

    if (!(access_filter.length === 0)) {
        let found = false;
        if (monitor_class === "departures") {
            if (Array.isArray(train.departures_access)) {
                train.departures_access.forEach(function (access) {
                    if (access_filter.includes(access)) {
                        found = true;
                    }
                });
                if (!found) return false;
            } else {
                return false;
            }
        } else {
            if (Array.isArray(train.arrivals_access)) {
                train.arrivals_access.forEach(function (access) {
                    if (access_filter.includes(access)) {
                        found = true;
                    }
                });
                if (!found) return false;
            } else {
                return false;
            }
        }
    }

    if (!(platform_filter.length === 0)) {
        if (monitor_class === "arrivals" && typeof train.platform_in !== "undefined") {
            if (!platform_filter.some((platf) => train.platform_locations_in.includes(platf))) {
                return false;
            }
        } else {
            if (!platform_filter.some((platf) => train.platform_locations.includes(platf))) {
                return false;
            }
        }
    }

    if (!(sector_filter.length === 0)) {
        if (typeof train.sectors !== "undefined") {
            if (train.sectors.length > 0) {
                if (!sector_filter.some((sect) => train.sectors.includes(sect))) {
                    return false;
                }
            }
        }
    }

    if (!(stop_filter.length === 0)) {
        let found = false;
        if (monitor_class === "arrivals") {
            train.journey_stops_origin.forEach(function (stop) {
                if (stop_filter.includes(stop.code)) {
                    found = true;
                }
            });
            if (!found) return false;
        } else {
            train.journey_stops_destination.forEach(function (stop) {
                if (stop_filter.includes(stop.code)) {
                    found = true;
                }
            });
            if (!found) return false;
        }
    }

    if (!(custom_filter.length === 0)) {
        if (Array.isArray(train.custom_categories)) {
            let found = false;
            train.custom_categories.forEach(function (custom_categ) {
                if (custom_filter.includes(custom_categ)) {
                    found = true;
                }
            });
            if (!found) return false;
        } else {
            return false;
        }
    }

    return true;
}

function AdVista24_ordenarTrenesHoraSalida(estimated_time_traffics) {
    // Para ordenar los trenes por hora de salida ascendente
    return function (a, b) {
        let fechaA;
        let fechaB;
        if (estimated_time_traffics.includes(a.traffic_type)) {
            fechaA = new Date(a.departure_time);
            fechaA.setMinutes(fechaA.getMinutes() + a.delay_out);
        } else {
            fechaA = new Date(a.departure_time);
        }
        if (estimated_time_traffics.includes(b.traffic_type)) {
            fechaB = new Date(b.departure_time);
            fechaB.setMinutes(fechaB.getMinutes() + b.delay_out);
        } else {
            fechaB = new Date(b.departure_time);
        }
        if (fechaA !== fechaB) return fechaA - fechaB;
        else return a.id - b.id;
    };
}

function AdVista24_ordenarTrenesHoraLlegada(estimated_time_traffics) {
    // Para ordenar los trenes por hora de llegada ascendente
    return function (a, b) {
        let fechaA;
        let fechaB;
        if (estimated_time_traffics.includes(a.traffic_type)) {
            fechaA = new Date(a.arrival_time);
            fechaA.setMinutes(fechaA.getMinutes() + a.delay_in);
        } else {
            fechaA = new Date(a.arrival_time);
        }
        if (estimated_time_traffics.includes(b.traffic_type)) {
            fechaB = new Date(b.arrival_time);
            fechaB.setMinutes(fechaB.getMinutes() + b.delay_in);
        } else {
            fechaB = new Date(b.arrival_time);
        }
        if (fechaA !== fechaB) return fechaA - fechaB;
        else return a.id - b.id;
    };
}

function AdVista24_ordenarTrenesCountdown(estimated_time_traffics) {
    // Para ordenar los trenes por cuenta atrás
    return function (a, b) {
        let isInCountdownA = AdVista24_isInCountdownMode(a);
        let isInCountdownB = AdVista24_isInCountdownMode(b);

        //Prioridad al tren en cuenta atrás sobre el tren que no está en cuenta atrás
        if (isInCountdownA !== isInCountdownB) return isInCountdownA ? -1 : 1;

        // Si los dos trenes están en cuenta atrás, ordenamos por cuenta atrás:
        if (isInCountdownA) {
            return a.countdown - b.countdown;
        }

        // Si los dos trenes no están en cuenta atrás, ordenamos por la hora de salida (teórica o prevista según estimated_time_traffics)
        let fechaA;
        let fechaB;

        if (estimated_time_traffics.includes(a.traffic_type)) {
            fechaA = new Date(a.departure_time);
            fechaA.setMinutes(fechaA.getMinutes() + a.delay_out);
        } else {
            fechaA = new Date(a.departure_time);
        }
        if (estimated_time_traffics.includes(b.traffic_type)) {
            fechaB = new Date(b.departure_time);
            fechaB.setMinutes(fechaB.getMinutes() + b.delay_out);
        } else {
            fechaB = new Date(b.departure_time);
        }
        if (fechaA !== fechaB) return fechaA - fechaB;
        else return a.id - b.id;
    };
}

function AdVista24_ordenarTrenesNumeroVia(platform_location) {
    //Ordena los servicios según el orden de apareción de su vía o vía/sector en platform_location
    return function (a, b) {
        let a_platform_name = "";
        let b_platform_name = "";
        if (typeof a.platform !== "undefined") a_platform_name += String(a.platform);
        if (typeof b.platform !== "undefined") b_platform_name += String(b.platform);
        let a_platform_sector_name = a_platform_name;
        let b_platform_sector_name = b_platform_name;
        if (Array.isArray(a.sectors) && a.sectors.length > 0) a_platform_sector_name += String(a.sectors[0]);
        if (Array.isArray(b.sectors) && b.sectors.length > 0) b_platform_sector_name += String(b.sectors[0]);

        //Si el array platform_location es vacío
        if (platform_location.length === 0) {
            if (a_platform_name !== b_platform_name) {
                // Si tienen distinta vía, ordenamos númericamente por vía
                return a_platform_name.localeCompare(b_platform_name, undefined, { numeric: true });
            } else {
                // Si tienen misma vía, ordenamos númericamente por vía/sector
                return a_platform_sector_name.localeCompare(b_platform_sector_name, undefined, { numeric: true });
            }
        }

        //Buscamos el índice de vía/sector en el array platform_location. Si no encuentra buscamos via a solas
        let indA = platform_location.indexOf(a_platform_sector_name);
        if (indA === -1) indA = platform_location.indexOf(a_platform_name);

        let indB = platform_location.indexOf(b_platform_sector_name);
        if (indB === -1) indB = platform_location.indexOf(b_platform_name);

        //Si los dos valores son iguales, ordenamos alfabéticamente
        if (indA === indB) return a_platform_sector_name - b_platform_sector_name;

        //Si solo se ha encontrado uno de los dos, damos prioridad al encontrado
        if (indA === -1) return 1;
        if (indB === -1) return -1;

        //Vías distintas, devolvemos el índice menor:
        return indA - indB;
    };
}

function AdVista24_ordenarTrenesHoraLlegadaEstacion(station) {
    // Para ordenar los trenes por hora de llegada a otra estacion
    // Se tiene en cuenta la posibilidad de que el tren pase dos veces por la misma estación

    return function (a, b) {
        // Para trenes de origen que se están demorando en la salida se les añade el retraso equivalente a si salieran ahora.
        // En el caso anterior, si aún no tienen la vía puesta, se les añade 3 minutos extra de retraso para realizar operaciones de subida de viajeros.
        let extraDelayA = 0;
        if (a.class_stop === "origin") {
            let now_date = new Date();
            let departure_date = new Date(a.departure_time);
            extraDelayA = Math.round((now_date - departure_date) / (1000 * 60));
            if (extraDelayA > -3 && a.platform === "") extraDelayA = extraDelayA + 3;
            if (extraDelayA < 0) extraDelayA = 0;
        }

        let extraDelayB = 0;

        if (b.class_stop === "origin") {
            let now_date = new Date();
            let departure_date = new Date(b.departure_time);
            extraDelayB = Math.round((now_date - departure_date) / (1000 * 60));
            if (extraDelayB > -3 && b.platform === "") extraDelayB = extraDelayB + 3;
            if (extraDelayB < 0) extraDelayB = 0;
        }

        // En cualquier otro caso, ordenamos por la hora prevista de llegada a destino
        // Filtramos los pasos por la estación
        let stopsA = a.journey_stops_destination.filter(function (stop) {
            return stop.code === station;
        });

        let stopsB = b.journey_stops_destination.filter(function (stop) {
            return stop.code === station;
        });

        // Ordenamos las paradas por hora de llegada a la estación
        stopsA.sort((x, y) => {
            let delayX = 0;
            if (typeof x.delay_in !== "undefined") delayX = x.delay_in;
            let fechaX = new Date(x.arrival_time);
            fechaX.setMinutes(fechaX.getMinutes() + delayX);

            let delayY = 0;
            if (typeof y.delay_in !== "undefined") delayY = y.delay_in;
            let fechaY = new Date(y.arrival_time);
            fechaY.setMinutes(fechaY.getMinutes() + delayY);

            return fechaX - fechaY;
        });

        stopsB.sort((x, y) => {
            let delayX = 0;
            if (typeof x.delay_in !== "undefined") delayX = x.delay_in;
            let fechaX = new Date(x.arrival_time);
            fechaX.setMinutes(fechaX.getMinutes() + delayX);

            let delayY = 0;
            if (typeof y.delay_in !== "undefined") delayY = y.delay_in;
            let fechaY = new Date(y.arrival_time);
            fechaY.setMinutes(fechaY.getMinutes() + delayY);

            return fechaX - fechaY;
        });

        // Seleccionamos el primer paso por la estacion de cada tren
        let stopA = stopsA[0];
        let stopB = stopsB[0];

        let delayA = 0;
        if (typeof stopA.delay_in !== "undefined") delayA = stopA.delay_in;
        let fechaA = new Date(stopA.arrival_time);
        fechaA.setMinutes(fechaA.getMinutes() + delayA + extraDelayA);

        let delayB = 0;
        if (typeof stopB.delay_in !== "undefined") delayB = stopB.delay_in;
        let fechaB = new Date(stopB.arrival_time);
        fechaB.setMinutes(fechaB.getMinutes() + delayB + extraDelayB);

        if (fechaA !== fechaB) return fechaA - fechaB;
        else return a.id - b.id;
    };
}

function AdVista24_isInCountdownMode(train) {
    //Devuelve verdadero si el tren está en modo cuenta atrás

    if (train.status === "delayed") return false;
    if (train.status === "cancelled") return false;

    switch (train.class_stop) {
        case "destination":
            return false;
        case "origin":
            if (train.platform === "") return false;
            return train.countdown < 10;
        case "intermediate":
            if (train.status === "scheduled") return false;
            return train.countdown < 10;
    }
}

function AdVista24_isoToHoraMinutos(fechaISO, delay) {
    // Convierte una cadena de fecha ISO 8601 en una cadena con la hora formato "hh:mm"
    // añadiendo los minutos de retraso indicados en delay

    delay = parseInt(delay);
    if (delay === 0) return fechaISO.substring(11, 16);

    let horas = parseInt(fechaISO.substring(11, 13), 10);
    let minutos = parseInt(fechaISO.substring(14, 16), 10);

    while (delay < 0) delay += 24 * 60;

    minutos += delay;

    horas += Math.floor(minutos / 60);
    minutos = minutos % 60;
    horas = horas % 24;

    horas = horas.toString().padStart(2, "0");
    minutos = minutos.toString().padStart(2, "0");

    return horas + ":" + minutos;
}

function AdVista24_minutesToArrival(train) {
    // Obtiene los minutos que faltan para la llegada del tren para comprobar si se debe mostrar un tren por tiempo (platform-trigger-time) o los accesos ()

    let hora_datos = new Date(AdVista24_trains_data.station_settings.data_time);
    let llegada = new Date(train.arrival_time);

    let llegada_real = new Date(llegada.getTime() + train.delay_in * 60000);
    let diff = Math.floor((llegada_real - hora_datos) / 60000);

    return diff;
}

function AdVista24_minutesToDeparture(train) {
    // Obtiene los minutos que faltan para la salida del tren para comprobar si se debe mostrar un tren por tiempo (platform-trigger-time)

    let hora_datos = new Date(AdVista24_trains_data.station_settings.data_time);
    let salida = new Date(train.departure_time);

    let salida_real = new Date(salida.getTime() + train.delay_out * 60000);
    let diff = Math.floor((salida_real - hora_datos) / 60000);

    return diff;
}

function AdVista24_filtroAlertas(
    alerts,
    traffic_filter,
    traffic_include,
    company_filter,
    company_include,
    product_filter,
    product_include,
    access_filter,
    access_include,
    platform_filter,
    platform_include
) {
    // Indica si se ha de pintar una alerta en función de los atributos filter o include de la interfaz

    return alerts.filter((alert) => {
        // Alerta sin filtros
        if (!alert["filter"]) return true;

        // FILTROS DE INCLUSIÓN
        // Filtro por tipos de tráfico
        if (alert["filter"]["traffic_types"] && alert["filter"]["traffic_types"].length > 0) {
            if (!(traffic_include.length === 0)) {
                if (alert["filter"]["traffic_types"].some((type) => traffic_include.includes(type))) {
                    return true;
                }
            }
        }

        // Filtro por operadores
        if (alert["filter"]["companies"] && alert["filter"]["companies"].length > 0) {
            if (!(company_include.length === 0)) {
                if (alert["filter"]["companies"].some((type) => company_include.includes(type))) {
                    return true;
                }
            }
        }

        // Filtro por productos
        if (alert["filter"]["products"] && alert["filter"]["products"].length > 0) {
            if (!(product_include.length === 0)) {
                if (alert["filter"]["products"].some((type) => product_include.includes(type))) {
                    return true;
                }
            }
        }

        // Filtro por accesos
        if (alert["filter"]["accesses"] && alert["filter"]["accesses"].length > 0) {
            if (!(access_include.length === 0)) {
                if (alert["filter"]["accesses"].some((type) => access_include.includes(type))) {
                    return true;
                }
            }
        }

        // Filtro por vías
        if (alert["filter"]["platforms"] && alert["filter"]["platforms"].length > 0) {
            if (!(platform_include.length === 0)) {
                if (alert["filter"]["platforms"].some((type) => platform_include.includes(type))) {
                    return true;
                }
            }
        }

        // FILTROS NORMALES
        // Filtro por tipos de tráfico
        if (alert["filter"]["traffic_types"] && alert["filter"]["traffic_types"].length > 0) {
            if (!(traffic_filter.length === 0)) {
                if (!alert["filter"]["traffic_types"].some((type) => traffic_filter.includes(type))) {
                    return false;
                }
            }
        }

        // Filtro por operadores
        if (alert["filter"]["companies"] && alert["filter"]["companies"].length > 0) {
            if (!(company_filter.length === 0)) {
                if (!alert["filter"]["companies"].some((type) => company_filter.includes(type))) {
                    return false;
                }
            }
        }

        // Filtro por productos
        if (alert["filter"]["products"] && alert["filter"]["products"].length > 0) {
            if (!(product_filter.length === 0)) {
                if (!alert["filter"]["products"].some((type) => product_filter.includes(type))) {
                    return false;
                }
            }
        }

        // Filtro por accesos
        if (alert["filter"]["accesses"] && alert["filter"]["accesses"].length > 0) {
            if (!(access_filter.length === 0)) {
                if (!alert["filter"]["accesses"].some((type) => access_filter.includes(type))) {
                    return false;
                }
            }
        }

        // Filtro por vías
        if (alert["filter"]["platforms"] && alert["filter"]["platforms"].length > 0) {
            if (!(platform_filter.length === 0)) {
                if (!alert["filter"]["platforms"].some((type) => platform_filter.includes(type))) {
                    return false;
                }
            }
        }

        return true;
    });
}

function AdVista24_partir_texto_en_2_lineas(texto) {
    //Parte un texto en dos lineas para aquellos casos en que no cabe completo

    // Obtenemos el punto medio del texto
    let punto_medio = Math.floor(texto.length / 2);

    //Obtenemos los índices de los posibles puntos de corte:
    // - espacios:
    let indice_espacios = AdVista24_indice_espacios_texto(texto);
    // - guiones seguidos de letra mayúscula
    let indice_guiones = AdVista24_indice_guiones_seguidos_de_mayuscula(texto);

    let puntos_corte = [...indice_espacios, ...indice_guiones];

    // Si no hay puntos de corte se devuelve el texto original
    if (puntos_corte.length === 0) return texto;

    let mejor_punto_corte = -1;
    // Buscamos el punto de corte más cercano al punto_medio
    for (let i = 0; i < puntos_corte.length; i++) {
        if (Math.abs(puntos_corte[i] - punto_medio) < Math.abs(mejor_punto_corte - punto_medio)) {
            mejor_punto_corte = puntos_corte[i];
        }
    }

    // Cortamos el texto, sustituyendo el espacio o el guión por salto de línea
    return texto.substring(0, mejor_punto_corte) + "<br>" + texto.substring(mejor_punto_corte + 1, texto.length);
}

function AdVista24_indice_espacios_texto(texto) {
    // Devuelve la posición de los espacios en un string (para cortar string en dos líneas)
    let indices = [];
    for (let i = 0; i < texto.length; i++) {
        if (texto[i] === " ") {
            indices.push(i);
        }
    }
    return indices;
}

function AdVista24_indice_guiones_seguidos_de_mayuscula(texto) {
    // Devuelve la posición de los guiones seguidos de mayúscula en un string (para cortar string en dos líneas)
    let indices = [];
    for (let i = 0; i < texto.length - 1; i++) {
        if (texto[i] === "-" || texto[i] === "—") {
            if (AdVista24_esMayuscula(texto[i + 1])) indices.push(i);
        }
    }

    return indices;
}

function AdVista24_esMayuscula(caracter) {
    // Devuelve si es una letra mayúscula
    return /^\p{Lu}$/u.test(caracter);
}

function AdVista24_updateClock() {
    // Actualiza el reloj
    let now_time = new Date();
    let hours = now_time.getHours();
    let minutes = now_time.getMinutes();
    let seconds = now_time.getSeconds();

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    let clock_time = hours + ":" + minutes + "<small>:" + seconds + "</small>";
    $(".clock p").html(clock_time);

    // Activa momentáneamente la visualización de la versión
    if (hours === seconds && hours === minutes) {
        $(".version").addClass("version-visible");
    } else {
        $(".version").removeClass("version-visible");
    }
}

function AdVista24_arraysAreEqual(arr1, arr2) {
    // Comprueba si dos arrays son idénticos
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }

    return true;
}

function AdVista24_obtienePrimeraLetraNormalizada(name) {
    return name
        .normalize("NFD") // separa letra + acento
        .replace(/[\u0300-\u036f]/g, "") // elimina acentos
        .charAt(0)
        .toUpperCase();
}

function AdVista24_Resize() {
    // Recarga la página
    location.reload(true);
}

function AdVista24_Reload() {
    // Recarga la página solo si hay conexión al servidor de la misma
    if (AdVista24_autoreload) {
        window.ADIF_INFOTREN_VISTA_LOADED = false;
        fetch(window.location.href, { method: "HEAD", cache: "no-store" })
            .then((response) => {
                if (!response.ok) {
                    // El servidor respondió pero con error (404, 500...)
                    AdVista24_consoleLog(
                        `Recarga no permitida: servidor respondió ${response.status}. Se reintenta en 1 min.`
                    );
                    setTimeout(AdVista24_Reload, 60 * 1000);
                    return;
                }
                AdVista24_consoleLog("Recarga de página mediante safeReload");
                location.reload(true);
            })
            .catch(() => {
                // No hay conexión o el servidor no responde
                AdVista24_consoleLog(`Recarga no permitida: sin conexión o error de red. Se reintenta en 1 min.`);
                setTimeout(AdVista24_Reload, 60 * 1000);
            });
    }
}

function AdVista24_data_expiration_check(force_update) {
    // Comprueba si los datos recibidos han caducado

    // Si el timer no está configurado, la función no actúa
    if (AdVista24_trains_data_expiration_timer <= 0) return;

    // Si no se envía la fecha de los datos, la función no actúa
    if (typeof AdVista24_trains_data.station_settings === "undefined") return;
    if (typeof AdVista24_trains_data.station_settings.data_time === "undefined") return;

    let data_time = new Date(AdVista24_trains_data.station_settings.data_time);
    let now_time = new Date();

    let time_diff = (now_time - data_time) / 1000;
    if (AdVista24_get_console_log) AdVista24_consoleLog("Antigüedad de los datos " + String(time_diff));

    if (time_diff > AdVista24_trains_data_expiration_timer) {
        // Datos caducados, vaciamos trenes y alertas.
        AdVista24_trains_data.trains = [];
        AdVista24_alerts = [];
        if (AdVista24_get_console_log) AdVista24_consoleLog("Borrado de datos por expiración de los datos");
        if (force_update) AdVista24_updateMonitors();
    }
}

// Gestión de las tareas continuas.
var AdVista24_updateDataIntervalID = undefined; // Identifica el timer de recarga de datos para permitir su posterior definición/modificación.

function AdVista24_changeUpdateDataInterval(update_interval_seconds) {
    // Cambia el intervalo de actualizacion de datos
    if (typeof AdVista24_updateDataIntervalID !== "undefined") {
        clearInterval(AdVista24_updateDataIntervalID);
    }
    AdVista24_updateDataIntervalID = setInterval(AdVista24_updateData, update_interval_seconds * 1000);
}

window.AdVista24_changeDataExpirationTimer = function (data_expiration_timer_seconds) {
    // Cambia el tiempo máximo de validez de los datos mostrados
    window.AdVista24_trains_data_expiration_timer = data_expiration_timer_seconds;
};

if (typeof AdVista24_updateDataIntervalID === "undefined") AdVista24_changeUpdateDataInterval(10);
setInterval(AdVista24_Reload, 60 * 60 * 1000 - 100);
setInterval(AdVista24_updateClock, 250);
setInterval(AdVista24_data_expiration_check.bind(null, true), 5 * 1000);
setInterval(AdVista24_sizeAdjustments, 250);
