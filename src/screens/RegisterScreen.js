/**
 * ARCHIVO: src/screens/RegisterScreen.js
 * QUÉ HACE: pantalla para crear una cuenta nueva. Valida usuario, contraseña y confirmación,
 *           muestra cada error debajo de su campo y deshabilita el botón mientras hay errores.
 * LO USA: AuthStack (src/navigation/AuthStack.js).
 * DEPENDE DE: react, react-native, react-native-safe-area-context, src/context/AuthContext.js,
 *             src/utils/storage.js (leerUsuarios), src/utils/validations.js, src/components/CustomInput.js,
 *             src/components/CustomButton.js, src/utils/theme.js.
 * CONCEPTOS CLAVE: useState por campo, useRef y focus(), validación onBlur y al enviar,
 *                  limpieza de errores al corregir, botón deshabilitado con errores y loading.
 */
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { leerUsuarios } from '../utils/storage';
import {
  validarUsuario,
  validarUsuarioNoExiste,
  validarContrasenia,
  validarConfirmacion,
} from '../utils/validations';
import { theme } from '../utils/theme';

// Sin errores: estado inicial del formulario.
const SIN_ERRORES = { usuario: null, clave: null, confirmacion: null, general: null };

/**
 * Dice si hay algún error en el formulario.
 * @param {object} errores - Errores por campo.
 * @returns {boolean} true si hay al menos uno.
 */
function hayErrores(errores) {
  return Object.values(errores).some((valor) => valor !== null);
}

/**
 * Pantalla de registro. Cuándo se ejecuta: cuando la persona toca "Crear cuenta" en el login.
 * @param {object} props - Props que da React Navigation.
 * @returns {JSX.Element} Formulario de registro.
 */
export default function RegisterScreen() {
  const { register } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState(SIN_ERRORES);
  const [enviando, setEnviando] = useState(false);

  // Referencias para enfocar el primer campo con error al enviar.
  const refUsuario = useRef(null);
  const refClave = useRef(null);
  const refConfirmacion = useRef(null);

  /**
   * Cambia un campo y borra su error mientras la persona lo corrige.
   * El error vuelve a aparecer al salir del campo (onBlur) si sigue mal.
   * @param {'usuario'|'clave'|'confirmacion'} campo - Campo que cambió.
   * @param {string} texto - Nuevo texto del campo.
   * @returns {void}
   */
  function cambiarCampo(campo, texto) {
    if (campo === 'usuario') setUsuario(texto);
    if (campo === 'clave') setClave(texto);
    if (campo === 'confirmacion') setConfirmacion(texto);
    setErrores((previo) => ({ ...previo, [campo]: null, general: null }));
  }

  /** Valida el usuario al salir del campo (onBlur). */
  function revisarUsuario() {
    setErrores((previo) => ({ ...previo, usuario: validarUsuario(usuario) }));
  }

  /** Valida la contraseña al salir del campo (onBlur). */
  function revisarClave() {
    setErrores((previo) => ({ ...previo, clave: validarContrasenia(clave, usuario) }));
  }

  /** Valida la confirmación al salir del campo (onBlur). */
  function revisarConfirmacion() {
    setErrores((previo) => ({ ...previo, confirmacion: validarConfirmacion(clave, confirmacion) }));
  }

  /**
   * Valida todo al tocar "Crear cuenta". Revisa también si el usuario ya existe,
   * leyendo la lista desde storage.js (la pantalla nunca toca AsyncStorage directo).
   * Si hay errores, los muestra y enfoca el primer campo malo. Si no, llama a register.
   * @returns {Promise<void>}
   */
  async function enviar() {
    const usuarios = await leerUsuarios();
    const nombres = [];
    for (const existente of usuarios) nombres.push(existente.username);

    const nuevos = {
      usuario: validarUsuario(usuario) || validarUsuarioNoExiste(usuario, nombres),
      clave: validarContrasenia(clave, usuario),
      confirmacion: validarConfirmacion(clave, confirmacion),
      general: null,
    };
    setErrores(nuevos);

    if (nuevos.usuario) refUsuario.current?.focus();
    else if (nuevos.clave) refClave.current?.focus();
    else if (nuevos.confirmacion) refConfirmacion.current?.focus();
    if (hayErrores(nuevos)) return;

    setEnviando(true);
    const errorRegistro = await register(usuario, clave, confirmacion);
    setEnviando(false);
    // Si todo sale bien, AppNavigator cambia a la app sola. Acá solo mostramos el error raro.
    if (errorRegistro) {
      setErrores({ ...SIN_ERRORES, general: errorRegistro });
    }
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'bottom']}>
      {/* En iOS el teclado puede tapar los campos: "padding" los empuja hacia arriba. */}
      <KeyboardAvoidingView
        style={styles.contenedor}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.titulo}>Crear cuenta</Text>

        <CustomInput
          ref={refUsuario}
          label="Usuario"
          placeholder="4 a 20 letras o números"
          autoCapitalize="none"
          autoCorrect={false}
          value={usuario}
          onChangeText={(texto) => cambiarCampo('usuario', texto)}
          onBlur={revisarUsuario}
          error={errores.usuario}
        />

        <CustomInput
          ref={refClave}
          label="Contraseña"
          placeholder="Mayúscula, minúscula y número"
          secureTextEntry
          value={clave}
          onChangeText={(texto) => cambiarCampo('clave', texto)}
          onBlur={revisarClave}
          error={errores.clave}
        />

        <CustomInput
          ref={refConfirmacion}
          label="Repetir contraseña"
          placeholder="Escribí la misma contraseña"
          secureTextEntry
          value={confirmacion}
          onChangeText={(texto) => cambiarCampo('confirmacion', texto)}
          onBlur={revisarConfirmacion}
          error={errores.confirmacion}
        />

        {errores.general ? (
          <Text style={styles.textoError} accessibilityRole="alert">
            {errores.general}
          </Text>
        ) : null}

        <CustomButton
          title="Crear cuenta"
          onPress={enviar}
          disabled={hayErrores(errores) || enviando}
          loading={enviando}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: theme.colors.fondo,
  },
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  titulo: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.texto,
    marginBottom: theme.spacing.xl,
  },
  textoError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
});
