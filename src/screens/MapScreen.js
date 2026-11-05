/**
 * ARCHIVO: src/screens/MapScreen.js
 * QUÉ HACE: mapa centrado en la ubicación real. Un long press abre PlaceModal para guardar un lugar.
 *           Los lugares guardados se ven como marcadores; al tocar uno se muestra su título, descripción y foto.
 *           Si el permiso de ubicación se niega, centra en Las Varillas (Córdoba) y avisa.
 * LO USA: AppTabs (src/navigation/AppTabs.js), pestaña "Mapa".
 * DEPENDE DE: react, react-native, react-native-maps, expo-location, @react-navigation/native (useFocusEffect),
 *             src/context/AuthContext.js, src/components/PlaceModal.js, src/components/EstadoPantalla.js,
 *             src/utils/storage.js, src/utils/theme.js.
 * CONCEPTOS CLAVE: MapView, Marker, Callout, onLongPress, expo-location (permisos), useEffect con cleanup,
 *                  useFocusEffect, for...of para armar marcadores.
 */
import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Callout, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { PlaceModal } from '../components/PlaceModal';
import { EstadoPantalla } from '../components/EstadoPantalla';
import { agregarLugar, leerLugares } from '../utils/storage';
import { theme } from '../utils/theme';

// Punto de respaldo si no hay permiso de ubicación: Las Varillas, Córdoba.
const LAS_VARILLAS = { latitude: -31.8722, longitude: -62.7194 };

/**
 * Arma la lista de marcadores a partir de los lugares guardados.
 * POR QUÉ for...of y no .map: el proyecto no usa .map. El bucle deja el array armado a mano
 * y es igual de claro para explicar.
 * @param {Array<object>} lugares - Lugares guardados del usuario.
 * @returns {JSX.Element[]} Un Marker por lugar.
 */
function armarMarcadores(lugares) {
  const marcadores = [];
  for (const lugar of lugares) {
    marcadores.push(
      <Marker
        key={lugar.id}
        coordinate={{ latitude: lugar.latitude, longitude: lugar.longitude }}
        pinColor={theme.colors.secundario}
      >
        {/* Callout: el globito que aparece al tocar el marcador. Muestra título, descripción y foto. */}
        <Callout>
          <View style={styles.callout}>
            <Text style={styles.calloutTitulo}>{lugar.title}</Text>
            {lugar.description ? <Text style={styles.calloutTexto}>{lugar.description}</Text> : null}
            <Image source={{ uri: lugar.imageUri }} style={styles.calloutImagen} />
          </View>
        </Callout>
      </Marker>,
    );
  }
  return marcadores;
}

/**
 * Pantalla del mapa. Cuándo se ejecuta: al abrir la pestaña "Mapa" (y cada vez que vuelve a tener foco).
 * @returns {JSX.Element} Mapa con marcadores, modal de alta y avisos.
 */
export default function MapScreen() {
  const { user } = useAuth();
  const [region, setRegion] = useState(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [lugares, setLugares] = useState([]);
  // Punto del long press. Si tiene valor, el modal de alta está abierto.
  const [coordenadaNueva, setCoordenadaNueva] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Corre UNA vez al abrir el mapa (deps vacías): pide permiso y busca la ubicación.
  // El cleanup marca "cancelado" para no actualizar estado si la pantalla se cierra antes de terminar.
  useEffect(() => {
    let cancelado = false;

    async function ubicar() {
      try {
        // POR QUÉ permiso "foreground": solo necesitamos la ubicación con la app abierta.
        const permiso = await Location.requestForegroundPermissionsAsync();
        if (permiso.status !== 'granted') {
          // Si lo rechaza, no rompemos nada: mostramos Las Varillas y un aviso.
          if (!cancelado) {
            setPermisoDenegado(true);
            setRegion({ ...LAS_VARILLAS, latitudeDelta: 0.05, longitudeDelta: 0.05 });
          }
          return;
        }
        const posicion = await Location.getCurrentPositionAsync({});
        if (!cancelado) {
          setRegion({
            latitude: posicion.coords.latitude,
            longitude: posicion.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      } catch {
        // Si falla la ubicación (GPS apagado, por ejemplo), usamos el mismo punto de respaldo.
        if (!cancelado) {
          setPermisoDenegado(true);
          setRegion({ ...LAS_VARILLAS, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        }
      }
    }

    ubicar();
    return () => {
      cancelado = true;
    };
  }, []);

  /**
   * Trae los lugares del usuario para dibujar los marcadores.
   * Se llama al entrar a la pestaña y después de guardar o borrar.
   * @returns {Promise<void>}
   */
  const cargarLugares = useCallback(async () => {
    const guardados = await leerLugares(user);
    setLugares(guardados);
  }, [user]);

  // Corre cada vez que la pestaña gana el foco. Así, si guardaste un lugar y volviste al mapa, aparece.
  // Depende de cargarLugares: si cambia el usuario, se vuelve a cargar su lista.
  useFocusEffect(
    useCallback(() => {
      cargarLugares();
    }, [cargarLugares]),
  );

  /**
   * Guarda el lugar nuevo y cierra el modal. Si falla, el error lo muestra PlaceModal.
   * @param {object} datos - Datos ya validados: title, description, imageUri, latitude, longitude.
   * @returns {Promise<void>}
   */
  async function guardarLugar(datos) {
    await agregarLugar(user, datos);
    setCoordenadaNueva(null);
    setMensaje('Lugar guardado.');
    await cargarLugares();
  }

  // Mientras no sabemos dónde centrar el mapa, mostramos un estado de carga.
  if (!region) {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        <EstadoPantalla titulo="Buscando tu ubicación" cargando />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      {permisoDenegado ? (
        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>
            Sin permiso de ubicación. Mostramos Las Varillas (Córdoba). Podés habilitarlo en Ajustes.
          </Text>
        </View>
      ) : null}
      {mensaje ? (
        <View style={styles.aviso} accessibilityLiveRegion="polite">
          <Text style={styles.avisoTexto}>{mensaje}</Text>
        </View>
      ) : null}
      <Text style={styles.pista}>Mantené presionado el mapa para guardar un lugar.</Text>

      <MapView
        style={styles.mapa}
        initialRegion={region}
        showsUserLocation={!permisoDenegado}
        onLongPress={(evento) => setCoordenadaNueva(evento.nativeEvent.coordinate)}
      >
        {armarMarcadores(lugares)}
      </MapView>

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
    marginTop: theme.spacing.sm,
    borderLeftWidth: theme.grosor.acento,
    borderLeftColor: theme.colors.secundario,
  },
  avisoTexto: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.texto,
  },
  pista: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textoSecundario,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  callout: {
    width: theme.tamanios.calloutAncho,
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
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
  calloutImagen: {
    width: '100%',
    height: theme.tamanios.imagenCallout,
    borderRadius: theme.radius.sm,
  },
});
