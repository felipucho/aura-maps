/**
 * ARCHIVO: src/components/CustomInput.js
 * QUÉ HACE: campo de texto con label arriba y mensaje de error abajo. Se reutiliza en login,
 *           registro y el formulario de lugares. Pasa al TextInput todo lo que no es label/error.
 * LO USA: LoginScreen, RegisterScreen, PlaceModal.
 * DEPENDE DE: react, react-native (TextInput, Text, View), src/utils/theme.js.
 * CONCEPTOS CLAVE: forwardRef (para poder enfocar el input desde afuera), useState (estado de foco),
 *                  props de pasamano (...resto), accesibilidad (accessibilityLabel).
 */
import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../utils/theme';

/**
 * Componente interno del campo. Se exporta envuelto en forwardRef (abajo).
 * Cuándo se ejecuta: cada vez que cambia su label, su error o su foco.
 * @param {object} props - Props del campo.
 * @param {string} props.label - Texto que se muestra arriba del input.
 * @param {string|null} [props.error] - Mensaje de error. Si existe, se muestra debajo y el borde se pone rojo.
 * @param {Function} [props.onFocus] - Callback que el padre quiera ejecutar al enfocar.
 * @param {Function} [props.onBlur] - Callback del padre al salir del campo (para validar en onBlur).
 * @param {object} props.resto - Cualquier otra prop de TextInput (value, onChangeText, etc.).
 * @param {object} ref - Referencia al TextInput, que el padre usa para enfocarlo.
 * @returns {JSX.Element} Label, input y mensaje de error.
 */
function CustomInputBase({ label, error, onFocus, onBlur, ...resto }, ref) {
  // true mientras el campo tiene el foco: pinta el borde para que se vea en qué campo estás.
  const [enfocado, setEnfocado] = useState(false);
  const hayError = Boolean(error);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textoSecundario}
        style={[
          styles.input,
          enfocado && styles.inputEnfocado,
          hayError && styles.inputConError,
          resto.multiline && styles.inputMultilinea,
        ]}
        onFocus={(evento) => {
          setEnfocado(true);
          if (onFocus) onFocus(evento);
        }}
        onBlur={(evento) => {
          setEnfocado(false);
          // El padre valida acá: se revisa el campo al salir, no mientras se escribe.
          if (onBlur) onBlur(evento);
        }}
        {...resto}
      />
      {hayError ? (
        <Text style={styles.textoError} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// forwardRef: permite que la pantalla guarde una ref y llame a .focus() en el primer campo con error.
export const CustomInput = forwardRef(CustomInputBase);

const styles = StyleSheet.create({
  contenedor: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.texto,
  },
  input: {
    minHeight: theme.tamanioTactil,
    borderWidth: theme.grosor.fino,
    borderColor: theme.colors.borde,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.superficie,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.texto,
  },
  inputEnfocado: {
    borderColor: theme.colors.primario,
    borderWidth: theme.grosor.marcado,
  },
  inputConError: {
    borderColor: theme.colors.error,
    borderWidth: theme.grosor.marcado,
  },
  inputMultilinea: {
    minHeight: theme.tamanioTactil * 2,
    textAlignVertical: 'top',
  },
  textoError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
  },
});
