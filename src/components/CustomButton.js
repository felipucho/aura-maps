/**
 * ARCHIVO: src/components/CustomButton.js
 * QUÉ HACE: botón reutilizable hecho con Pressable. Tiene estado pressed, disabled y loading,
 *           y dos variantes: "primario" (relleno) y "contorno" (borde, para acciones secundarias).
 * LO USA: LoginScreen, RegisterScreen, PlaceModal, PlacesScreen, ProfileScreen.
 * DEPENDE DE: react-native (Pressable, Text, ActivityIndicator), src/utils/theme.js.
 * CONCEPTOS CLAVE: Pressable, función de style con { pressed }, accessibilityState, loading, disabled.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../utils/theme';

/**
 * Botón reutilizable. Cuándo se ejecuta: cada render del padre.
 * Usa Pressable (regla del proyecto), que da el estado "pressed".
 * @param {object} props - Props del botón.
 * @param {string} props.title - Texto del botón. Usar verbos: "Guardar", "Entrar".
 * @param {Function} props.onPress - Se ejecuta al tocar (no se ejecuta si está deshabilitado o cargando).
 * @param {boolean} [props.disabled=false] - Deshabilita el botón.
 * @param {boolean} [props.loading=false] - Muestra un spinner y bloquea el botón mientras procesa.
 * @param {'primario'|'contorno'} [props.variante='primario'] - Estilo visual del botón.
 * @returns {JSX.Element} Pressable con el texto o el spinner adentro.
 */
export function CustomButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variante = 'primario',
}) {
  // Mientras carga, el botón no responde: evita que se mande el mismo envío dos veces.
  const bloqueado = disabled || loading;
  const esContorno = variante === 'contorno';

  return (
    <Pressable
      onPress={onPress}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: bloqueado, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        esContorno ? styles.contorno : styles.primario,
        // El estado pressed da una respuesta visual inmediata al tocar.
        pressed && !bloqueado && (esContorno ? styles.contornoPresionado : styles.primarioPresionado),
        pressed && !bloqueado && styles.escalaPresionada,
        bloqueado && styles.deshabilitado,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={esContorno ? theme.colors.primario : theme.colors.textoSobrePrimario} />
      ) : (
        <Text
          style={[
            styles.texto,
            esContorno ? styles.textoContorno : styles.textoPrimario,
            bloqueado && styles.textoDeshabilitado,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: theme.tamanioTactil,
    minWidth: theme.tamanioTactil,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: {
    backgroundColor: theme.colors.primario,
  },
  primarioPresionado: {
    backgroundColor: theme.colors.primarioPresionado,
  },
  contorno: {
    backgroundColor: theme.colors.superficie,
    borderWidth: theme.grosor.fino,
    borderColor: theme.colors.primario,
  },
  contornoPresionado: {
    backgroundColor: theme.colors.primarioSuave,
  },
  // Escala levemente el botón al tocarlo: efecto de "botón que se hunde".
  escalaPresionada: {
    transform: [{ scale: theme.escalaPresion }],
  },
  deshabilitado: {
    backgroundColor: theme.colors.deshabilitado,
    borderColor: theme.colors.deshabilitado,
  },
  texto: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  textoPrimario: {
    color: theme.colors.textoSobrePrimario,
  },
  textoContorno: {
    color: theme.colors.primario,
  },
  textoDeshabilitado: {
    color: theme.colors.textoSecundario,
  },
});
