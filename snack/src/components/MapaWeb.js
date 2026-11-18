/**
 * ARCHIVO: src/components/MapaWeb.js
 * QUÉ HACE: mapa para la versión web. react-native-maps no funciona en el navegador, así que
 *           en web dibujamos un mapa Leaflet (mapa base oscuro de Esri) dentro de
 *           un iframe. Al tocar el mapa avisa la coordenada; los lugares se ven como chinchetas.
 * LO USA: MapScreen (solo cuando Platform.OS === 'web').
 * DEPENDE DE: react, react-native (View), src/utils/theme.js. Leaflet se carga desde unpkg.
 * CONCEPTOS CLAVE: iframe, postMessage (comunicación entre la app y el mapa), useEffect con cleanup.
 */
import { createElement, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../utils/theme';

/**
 * Arma el HTML del mapa. Corre dentro del iframe: crea el mapa, escucha los toques y
 * dibuja las chinchetas que le manda la app.
 * @param {{latitude: number, longitude: number}} centro - Dónde arranca el mapa.
 * @returns {string} Documento HTML completo.
 */
function armarHtml(centro) {
  const c = theme.colors;
  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #mapa { margin: 0; height: 100%; background: ${c.fondo}; }
  .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: ${c.superficieAlta}; color: ${c.texto}; }
  .leaflet-popup-content { margin: 10px; width: 200px; font-family: system-ui, sans-serif; }
  .leaflet-popup-content img { width: 100%; height: 110px; object-fit: cover; border-radius: 8px; display: block; }
  .leaflet-popup-content b { display: block; margin-top: 6px; font-size: 15px; }
  .leaflet-popup-content p { margin: 4px 0 0; color: ${c.textoSecundario}; font-size: 13px; }
  .leaflet-control-attribution { background: rgba(13,19,17,.7) !important; color: ${c.textoSecundario}; }
  .leaflet-control-attribution a { color: ${c.primario}; }
</style></head>
<body><div id="mapa"></div>
<script>
  var mapa = L.map('mapa', { zoomControl: true }).setView([${centro.latitude}, ${centro.longitude}], 14);
  // Mapa base oscuro de Esri (gratis, sin clave) + capa de nombres de calles y ciudades.
  var esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
  L.tileLayer(esri + 'World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: 'Tiles &copy; Esri'
  }).addTo(mapa);
  L.tileLayer(esri + 'World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(mapa);
  var capa = L.layerGroup().addTo(mapa);
  function escapar(t) {
    return String(t || '').replace(/[&<>"']/g, function (x) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x];
    });
  }
  // Tocar el mapa: le avisamos a la app la coordenada para abrir el formulario.
  mapa.on('click', function (e) {
    parent.postMessage({ tipo: 'aura-toque', lat: e.latlng.lat, lng: e.latlng.lng }, '*');
  });
  // La app nos manda los lugares: dibujamos una chincheta por lugar.
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.tipo !== 'aura-lugares') return;
    capa.clearLayers();
    d.lugares.forEach(function (l) {
      var html = (l.imagen ? '<img src="' + escapar(l.imagen) + '">' : '') +
        '<b>' + escapar(l.titulo) + '</b>' + (l.descripcion ? '<p>' + escapar(l.descripcion) + '</p>' : '');
      L.circleMarker([l.lat, l.lng], {
        radius: 9, color: '${c.fondo}', weight: 2, fillColor: '${c.secundario}', fillOpacity: 1
      }).bindPopup(html).addTo(capa);
    });
  });
  parent.postMessage({ tipo: 'aura-listo' }, '*');
</script></body></html>`;
}

/**
 * Mapa web con Leaflet.
 * @param {object} props - Props.
 * @param {{latitude: number, longitude: number}} props.centro - Centro inicial.
 * @param {Array<object>} props.lugares - Lugares guardados (se dibujan como chinchetas).
 * @param {Function} props.onTocar - Recibe { latitude, longitude } al tocar el mapa.
 * @returns {JSX.Element} Iframe con el mapa.
 */
export function MapaWeb({ centro, lugares, onTocar }) {
  const refIframe = useRef(null);
  // El HTML se arma una sola vez: si cambiara, el iframe se recargaría y perdería el zoom.
  const html = useRef(armarHtml(centro)).current;

  /**
   * Manda los lugares al iframe. for...of y no .map: regla del proyecto.
   * @returns {void}
   */
  function enviarLugares() {
    const simples = [];
    for (const lugar of lugares) {
      simples.push({
        lat: lugar.latitude,
        lng: lugar.longitude,
        titulo: lugar.title,
        descripcion: lugar.description,
        imagen: lugar.imageUri,
      });
    }
    refIframe.current?.contentWindow?.postMessage({ tipo: 'aura-lugares', lugares: simples }, '*');
  }

  // Escucha los mensajes del iframe: toques en el mapa y el aviso de que ya cargó.
  // El cleanup saca el listener al salir de la pantalla.
  useEffect(() => {
    function alRecibir(evento) {
      const datos = evento.data;
      if (!datos || evento.source !== refIframe.current?.contentWindow) return;
      if (datos.tipo === 'aura-toque') onTocar({ latitude: datos.lat, longitude: datos.lng });
      if (datos.tipo === 'aura-listo') enviarLugares();
    }
    window.addEventListener('message', alRecibir);
    return () => window.removeEventListener('message', alRecibir);
  });

  // Cada vez que cambian los lugares, actualizamos las chinchetas.
  useEffect(() => {
    enviarLugares();
  });

  return (
    <View style={styles.contenedor}>
      {createElement('iframe', {
        ref: refIframe,
        srcDoc: html,
        title: 'Mapa de lugares',
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: theme.colors.fondo,
  },
});
