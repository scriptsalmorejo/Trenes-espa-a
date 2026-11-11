//El contenido de estas funciones debe desarrollarlo y actualizarlo el mantenedor
//del sistema de información para adecuarlo a sus características

var datosRecibidos = null;
var firstTime = true;

async function AdVista24_getStationJSON(station) {

    //La función debe devolver un objeto JavaScript conteniendo los datos del archivo JSIV,
    //por lo que se recomienda devolver el resultado de la función JSON.parse(datos_jsiv.trim())
    //donde datos_jsiv es la cadena de texto con el contenido del archivo JSIV.

    sendMessage('log', 'infotren vista pide datos');
    
    // Devolver como promise
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if(firstTime){
                // console.log('esperando datos...');
                firstTime = false;
            }
            
            // Verificar si datosRecibidos ya no es null
            if (datosRecibidos !== null) {
                clearInterval(interval);  // Detener la verificación
                if(typeof datosRecibidos === 'string'){
                    resolve(datosRecibidos);  // Resolver la promesa con los datos recibidos
                }else{
                    resolve(JSON.stringify(datosRecibidos));
                }
            }else{
                // console.log('aun no hay datos');
            }
        }, 1000); // Revisa cada 1000 ms si hay datos
    });

}


function AdVista24_getMultimediaFolder(folder) {
    //Devuelve la url de la carpeta raíz donde están las imágenes y pictogramas vectoriales que utiliza la aplicación.
    //Debe devolverse con el caracter "/" final indicativo de la carpeta

    //El argumento folder indica el tipo de recurso a buscar. En la versión 0.22 los posibles valores de folder son:
    // "lines": contiene SVG con las pastillas de las líneas de Cercanías con el mismo nombre que le campo "line" del JSON.
    // "svg": contiene SVG varios que usa la aplicación, como el logo de ADIF.
    // "coach-pictos": contiene SVG con pictogramas de prestaciones de tren
    // "station-pictos": contiene SVG con pictogramas de características de estación
    // "trains": contiene PNG (en el futuro SVG) con logotipos de tipo de tren
    // "connections": contiene SVG con logotipos de redes y líneas de correspondencia

    if (folder != 'trains') return 'https://info.adif.es/assets/gravita/' + folder + '/';
    return 'https://info.adif.es/recursos/';

}





