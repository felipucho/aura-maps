/**
 * ARCHIVO: src/components/EstadoPantalla.js
 * QUÉ HACE: muestra un bloque centrado con título y mensaje para los estados de una pantalla:
 *           cargando, vacío, error o un aviso (por ejemplo, permiso de ubicación denegado).
 * LO USA: PlacesScreen (cargando, vacío, error) y MapScreen (permiso denegado).
 * DEPENDE DE: react-native (ActivityIndicator, Text, View), src/utils/theme.js.
 * CONCEPTOS CLAVE: estados de UI (loading, empty, error), render condicional, accessibilityRole.
 */
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../utils/theme';

/**
 * Bloque de estado reutilizable. Cuándo se ejecuta: cada vez que la pantalla decide mostrar un estado.
 * @param {object} props - Props del estado.
 * @param {string} props.titulo - Frase corta que dice qué pasa.
 * @param {string} [props.mensaje] - Texto de ayuda: qué puede hacer la persona.
 * @param {boolean} [props.cargando=false] - Si es true, muestra un spinner arriba del título.
 * @param {'neutro'|'error'} [props.tono='neutro'] - Color del título: rojo para errores.
 * @returns {JSX.Element} Bloque centrado con el estado.
 */
export function EstadoPantalla({ titulo, mensaje, cargando = false, tono = 'neutro' }) {
  const colorTitulo = tono === 'error' ? theme.colors.error : theme.colors.texto;

  return (
    <View style={styles.contenedor} accessibilityLiveRegion="polite">
      {cargando ? <ActivityIndicator testID="spinner-estado" color={theme.colors.primario} /> : null}
      <Text style={[styles.titulo, { color: colorTitulo }]}>{titulo}</Text>
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  titulo: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  mensaje: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textoSecundario,
    textAlign: 'center',
  },
});
