/**
 * ARCHIVO: src/screens/MapScreen.js
 * QUÉ HACE: mapa centrado en Las Varillas (Córdoba). Con un toque en el mapa se abre PlaceModal
 *           para guardar un lugar en ese punto. Los lugares guardados se ven como chinchetas;
 *           al tocar una se ve su foto, título y descripción.
 *           En celular usa react-native-maps; en web usa MapaWeb (Leaflet), porque
 *           react-native-maps no funciona en el navegador.
 * LO USA: AppTabs (src/navigation/AppTabs.js), pestaña "Mapa".
 * DEPENDE DE: react, react-native, react-native-maps (solo celular), expo-location,
 *             @react-navigation/native (useFocusEffect), src/context/AuthContext.js,
 *             src/components/PlaceModal.js, src/components/MapaWeb.js, src/utils/storage.js,
 *             src/utils/theme.js.
 * CONCEPTOS CLAVE: MapView, Marker, Callout, onPress, expo-location (permisos),
 *                  useEffect con cleanup, useFocusEffect, for...of para armar marcadores.
 */
import { useCallback, useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { PlaceModal } from '../components/PlaceModal';
import { MapaWeb } from '../components/MapaWeb';
import { agregarLugar, leerLugares } from '../utils/storage';
import { theme } from '../utils/theme';

// Centro del mapa: Las Varillas, Córdoba. El mapa siempre arranca acá.
const LAS_VARILLAS = { latitude: -31.8722, longitude: -62.7194 };
const REGION_INICIAL = { ...LAS_VARILLAS, latitudeDelta: 0.03, longitudeDelta: 0.03 };

// react-native-maps no existe en web: se carga con require solo en celular, así en web
// nunca se evalúa. En web se usa MapaWeb.
const ES_WEB = Platform.OS === 'web';
const Mapas = ES_WEB ? null : require('react-native-maps');

/**
 * Arma un Marker por lugar. for...of y no .map: el proyecto no usa .map.
 * @param {Array<object>} lugares - Lugares guardados.
 * @returns {JSX.Element[]} Markers con Callout.
 */
function armarMarcadores(lugares) {
  const { Marker, Callout } = Mapas;
  const marcadores = [];
  for (const lugar of lugares) {
    marcadores.push(
      <Marker
        key={lugar.id}
        coordinate={{ latitude: lugar.latitude, longitude: lugar.longitude }}
        pinColor={theme.colors.secundario}
      >
        {/* tooltip: dibujamos nuestra propia burbuja oscura en vez de la blanca del sistema. */}
        <Callout tooltip>
          <View style={styles.callout}>
            {Platform.OS === 'android' ? (
              // En Android el callout se dibuja como foto fija: con la imagen dentro de un Text
              // se espera a que cargue la foto de Supabase antes de dibujar.
              <Text style={styles.calloutMarcoImagen}>
                <Image source={{ uri: lugar.imageUri }} style={styles.calloutImagen} resizeMode="cover" />
              </Text>
            ) : (
              <Image source={{ uri: lugar.imageUri }} style={styles.calloutImagen} />
            )}
            <Text style={styles.calloutTitulo}>{lugar.title}</Text>
            {lugar.description ? <Text style={styles.calloutTexto}>{lugar.description}</Text> : null}
          </View>
        </Callout>
      </Marker>,
    );
  }
  return marcadores;
}

/**
 * Pantalla del mapa. Cuándo se ejecuta: al abrir la pestaña "Mapa" (y cada vez que vuelve a tener foco).
 * @returns {JSX.Element} Mapa con chinchetas, pista y modal de alta.
 */
export default function MapScreen() {
  const { user } = useAuth();
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [lugares, setLugares] = useState([]);
  // Punto tocado. Si tiene valor, el modal de alta está abierto.
  const [coordenadaNueva, setCoordenadaNueva] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Corre UNA vez al abrir el mapa (deps vacías): pide el permiso de ubicación para mostrar
  // el punto azul de "dónde estoy". El mapa no espera la respuesta: siempre arranca en Las Varillas.
  // El cleanup evita actualizar estado si la pantalla se cierra antes de terminar.
  useEffect(() => {
    let cancelado = false;
    Location.requestForegroundPermissionsAsync()
      .then((permiso) => {
        if (!cancelado) setPermisoDenegado(permiso.status !== 'granted');
      })
      .catch(() => {
        if (!cancelado) setPermisoDenegado(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  /**
   * Trae los lugares del usuario para dibujar las chinchetas.
   * @returns {Promise<void>}
   */
  const cargarLugares = useCallback(async () => {
    const guardados = await leerLugares(user);
    setLugares(guardados);
  }, [user]);

  // Corre cada vez que la pestaña gana el foco: si guardaste o borraste un lugar, se actualiza.
  useFocusEffect(
    useCallback(() => {
      cargarLugares();
    }, [cargarLugares]),
  );

  /**
   * Toque en el mapa (celular). Si el toque fue sobre una chincheta, no abrimos el formulario:
   * la persona quería ver ese lugar, no crear uno nuevo.
   * @param {object} evento - Evento de react-native-maps.
   * @returns {void}
   */
  function alTocarMapa(evento) {
    if (evento.nativeEvent.action === 'marker-press') return;
    setMensaje(null);
    setCoordenadaNueva(evento.nativeEvent.coordinate);
  }

  /**
   * Guarda el lugar nuevo y cierra el modal. Si falla, el error lo muestra PlaceModal.
   * @param {object} datos - Datos ya validados del formulario.
   * @returns {Promise<void>}
   */
  async function guardarLugar(datos) {
    await agregarLugar(user, datos);
    setCoordenadaNueva(null);
    setMensaje('Lugar guardado.');
    await cargarLugares();
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      {permisoDenegado ? (
        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>
            Sin permiso de ubicación: no se muestra dónde estás. Podés habilitarlo en Ajustes.
          </Text>
        </View>
      ) : null}
      {mensaje ? (
        <View style={styles.aviso} accessibilityLiveRegion="polite">
          <Text style={styles.avisoTexto}>{mensaje}</Text>
        </View>
      ) : null}

      <View style={styles.mapa}>
        {ES_WEB ? (
          <MapaWeb
            centro={LAS_VARILLAS}
            lugares={lugares}
            onTocar={(coordenada) => {
              setMensaje(null);
              setCoordenadaNueva(coordenada);
            }}
          />
        ) : (
          <Mapas.default
            style={styles.mapa}
            initialRegion={REGION_INICIAL}
            showsUserLocation={!permisoDenegado}
            // Mapa oscuro: estilo propio en Android (Google) y modo oscuro del sistema en iOS.
            customMapStyle={theme.estiloMapaOscuro}
            userInterfaceStyle="dark"
            onPress={alTocarMapa}
          >
            {armarMarcadores(lugares)}
          </Mapas.default>
        )}
        {/* Pista flotante sobre el mapa: no le roba lugar y siempre se ve. */}
        <View style={styles.pista} pointerEvents="none">
          <Text style={styles.pistaTexto}>Tocá el mapa para guardar un lugar</Text>
        </View>
      </View>

      <PlaceModal
        visible={coordenadaNueva !== null}
        coordenada={coordenadaNueva}
        lugaresExistentes={lugares}
        onCerrar={() => setCoordenadaNueva(null)}
        onGuardar={guardarLugar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: theme.colors.fondo,
  },
  mapa: {
    flex: 1,
  },
  aviso: {
    backgroundColor: theme.colors.superficie,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderLeftWidth: theme.grosor.acento,
    borderLeftColor: theme.colors.secundario,
  },
  avisoTexto: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.texto,
  },
  pista: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    alignSelf: 'center',
    backgroundColor: theme.colors.superficieAlta,
    borderColor: theme.colors.borde,
    borderWidth: theme.grosor.fino,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  pistaTexto: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.texto,
  },
  callout: {
    width: theme.tamanios.calloutAncho,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.superficieAlta,
    borderRadius: theme.radius.md,
    borderWidth: theme.grosor.fino,
    borderColor: theme.colors.borde,
  },
  calloutMarcoImagen: {
    height: theme.tamanios.imagenCallout,
  },
  calloutImagen: {
    // Ancho fijo: dentro de un Text (Android) el porcentaje no funciona.
    width: theme.tamanios.calloutAncho - theme.spacing.sm * 2,
    height: theme.tamanios.imagenCallout,
    borderRadius: theme.radius.sm,
  },
  calloutTitulo: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.texto,
  },
  calloutTexto: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textoSecundario,
  },
});
