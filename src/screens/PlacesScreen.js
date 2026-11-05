/**
 * ARCHIVO: src/screens/PlacesScreen.js
 * QUÉ HACE: lista los lugares guardados del usuario con FlatList: miniatura, título y fecha.
 *           Permite borrar un lugar con confirmación y muestra estados de carga, vacío y error.
 * LO USA: AppTabs (src/navigation/AppTabs.js), pestaña "Mis lugares".
 * DEPENDE DE: react, react-native (Alert, FlatList, Image, Pressable, Text, View), @expo/vector-icons (Ionicons),
 *             @react-navigation/native (useFocusEffect), src/context/AuthContext.js,
 *             src/components/EstadoPantalla.js, src/utils/storage.js, src/utils/theme.js.
 * CONCEPTOS CLAVE: FlatList, ListEmptyComponent, useFocusEffect, Alert de confirmación, Pressable,
 *                  estados de carga, vacío y error.
 */
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { EstadoPantalla } from '../components/EstadoPantalla';
import { borrarLugar, leerLugares } from '../utils/storage';
import { theme } from '../utils/theme';

/**
 * Convierte la fecha ISO en dd/mm/aaaa. Lo hacemos a mano para no depender del idioma del celular.
 * @param {string} iso - Fecha en formato ISO, por ejemplo "2026-11-05T10:00:00.000Z".
 * @returns {string} Fecha en formato dd/mm/aaaa.
 */
function formatearFecha(iso) {
  const fecha = new Date(iso);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

/**
 * Pantalla "Mis lugares". Cuándo se ejecuta: al abrir la pestaña y cada vez que vuelve a tener foco.
 * @returns {JSX.Element} Lista de lugares con estados de carga, vacío y error.
 */
export default function PlacesScreen() {
  const { user } = useAuth();
  const [lugares, setLugares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  /**
   * Vuelve a leer los lugares del usuario. Muestra cargando mientras espera y error si falla.
   * @returns {Promise<void>}
   */
  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const guardados = await leerLugares(user);
      setLugares(guardados);
    } catch {
      setError('No pudimos cargar tus lugares. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  }, [user]);

  // Corre cada vez que la pestaña gana el foco: así un lugar guardado en el mapa aparece acá
  // sin tener que cerrar la app. Depende de cargar, que cambia si cambia el usuario.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  /**
   * Pide confirmación antes de borrar. Borrar es irreversible, por eso no se borra directo.
   * @param {object} lugar - Lugar que se quiere borrar.
   * @returns {void}
   */
  function confirmarBorrado(lugar) {
    Alert.alert('Borrar lugar', `¿Querés borrar "${lugar.title}"? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => borrar(lugar.id) },
    ]);
  }

  /**
   * Borra el lugar y da feedback. Después vuelve a cargar la lista.
   * @param {string} id - Id del lugar a borrar.
   * @returns {Promise<void>}
   */
  async function borrar(id) {
    await borrarLugar(user, id);
    setMensaje('Lugar borrado.');
    await cargar();
  }

  // Cargando por primera vez: mostramos spinner en lugar de una lista vacía engañosa.
  if (cargando && lugares.length === 0) {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        <EstadoPantalla titulo="Cargando tus lugares" cargando />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      {mensaje ? (
        <Text style={styles.mensaje} accessibilityLiveRegion="polite">
          {mensaje}
        </Text>
      ) : null}
      {error ? <EstadoPantalla titulo="Ups" mensaje={error} tono="error" /> : null}

      {/* FlatList: la lista de lugares. ListEmptyComponent se muestra cuando no hay ninguno. */}
      <FlatList
        data={lugares}
        keyExtractor={(lugar) => lugar.id}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListEmptyComponent={
          <EstadoPantalla
            titulo="Todavía no agregaste lugares"
            mensaje="Andá al mapa y mantené presionado un punto para guardar tu primer lugar."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Image source={{ uri: item.imageUri }} style={styles.miniatura} />
            <View style={styles.textos}>
              <Text style={styles.titulo} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.fecha}>{formatearFecha(item.createdAt)}</Text>
            </View>
            {/* Pressable de 44x44 como mínimo: área táctil cómoda para el dedo. */}
            <Pressable
              onPress={() => confirmarBorrado(item)}
              accessibilityRole="button"
              accessibilityLabel={`Borrar ${item.title}`}
              style={({ pressed }) => [styles.botonBorrar, pressed && styles.botonBorrarPresionado]}
            >
              <Ionicons name="trash-outline" size={theme.tamanios.icono} color={theme.colors.error} />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: theme.colors.fondo,
  },
  lista: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  separador: {
    height: theme.spacing.md,
  },
  mensaje: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.exito,
    fontWeight: theme.fontWeight.semibold,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.superficie,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  miniatura: {
    width: theme.tamanios.miniatura,
    height: theme.tamanios.miniatura,
    borderRadius: theme.radius.md,
  },
  textos: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titulo: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.texto,
  },
  fecha: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textoSecundario,
  },
  botonBorrar: {
    width: theme.tamanioTactil,
    height: theme.tamanioTactil,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonBorrarPresionado: {
    backgroundColor: theme.colors.primarioSuave,
  },
});
