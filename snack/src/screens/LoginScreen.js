/**
 * ARCHIVO: src/screens/LoginScreen.js
 * QUÉ HACE: pantalla para iniciar sesión con usuario y contraseña. Muestra un mensaje genérico si
 *           fallan los datos y una cuenta regresiva cuando el login queda bloqueado.
 * LO USA: AuthStack (src/navigation/AuthStack.js).
 * DEPENDE DE: react, react-native (KeyboardAvoidingView, Text, View, Platform), react-native-safe-area-context,
 *             src/context/AuthContext.js (useAuth), src/components/CustomInput.js, src/components/CustomButton.js,
 *             src/utils/validations.js, src/utils/theme.js.
 * CONCEPTOS CLAVE: useState, useRef y focus(), useAuth, validación onBlur y al enviar, bloqueo con cuenta regresiva.
 */
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RadarPin } from '../components/RadarPin';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { validarObligatorio } from '../utils/validations';
import { theme } from '../utils/theme';

// Sin errores: estado inicial y el que se usa después de un envío correcto.
const SIN_ERRORES = { usuario: null, clave: null, general: null };

/**
 * Pantalla de login. Cuándo se ejecuta: cuando AppNavigator muestra AuthStack (no hay sesión).
 * @param {object} props - Props que da React Navigation.
 * @param {object} props.navigation - Permite ir a la pantalla de registro.
 * @returns {JSX.Element} Formulario de login.
 */
export default function LoginScreen({ navigation }) {
  const { login, segundosBloqueado } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState(SIN_ERRORES);
  const [enviando, setEnviando] = useState(false);

  // Referencias para enfocar el primer campo con error.
  const refUsuario = useRef(null);
  const refClave = useRef(null);

  const bloqueado = segundosBloqueado > 0;

  /** Valida el usuario al salir del campo (onBlur). */
  function revisarUsuario() {
    setErrores((previo) => ({
      ...previo,
      usuario: validarObligatorio(usuario, 'Ingresá tu correo.'),
    }));
  }

  /** Valida la contraseña al salir del campo (onBlur). */
  function revisarClave() {
    setErrores((previo) => ({
      ...previo,
      clave: validarObligatorio(clave, 'Ingresá tu contraseña.'),
    }));
  }

  /**
   * Envía el formulario. Primero valida que no haya campos vacíos (sin llamar al context).
   * Si el login falla, muestra el mensaje genérico del context.
   * @returns {Promise<void>}
   */
  async function enviar() {
    const errorUsuario = validarObligatorio(usuario, 'Ingresá tu correo.');
    const errorClave = validarObligatorio(clave, 'Ingresá tu contraseña.');
    if (errorUsuario || errorClave) {
      setErrores({ usuario: errorUsuario, clave: errorClave, general: null });
      // Enfocamos el primer campo vacío para que la persona sepa dónde escribir.
      if (errorUsuario) refUsuario.current?.focus();
      else refClave.current?.focus();
      return;
    }

    setEnviando(true);
    const errorLogin = await login(usuario, clave);
    setEnviando(false);
    // Si el login funciona, AppNavigator cambia de pantalla solo: acá no hace falta navegar.
    setErrores({ usuario: null, clave: null, general: errorLogin });
  }

  // El botón muestra la cuenta regresiva mientras el login está bloqueado.
  const textoBoton = bloqueado ? `Esperá ${segundosBloqueado} s` : 'Entrar';

  // Contenido de la pantalla: logo con radar arriba y el formulario en una tarjeta.
  const contenido = (
    <View>
      <View style={styles.encabezado}>
        <RadarPin />
        <Text style={styles.marca}>Aura Maps</Text>
        <Text style={styles.subtitulo}>Guardá los lugares que te gustan en el mapa.</Text>
      </View>

      <View style={styles.tarjeta}>
        <CustomInput
          ref={refUsuario}
          label="Correo"
          placeholder="nombre@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={usuario}
          onChangeText={(texto) => {
            setUsuario(texto);
            setErrores((previo) => ({ ...previo, usuario: null, general: null }));
          }}
          onBlur={revisarUsuario}
          error={errores.usuario}
        />

        <CustomInput
          ref={refClave}
          label="Contraseña"
          placeholder="Tu contraseña"
          secureTextEntry
          value={clave}
          onChangeText={(texto) => {
            setClave(texto);
            setErrores((previo) => ({ ...previo, clave: null, general: null }));
          }}
          onBlur={revisarClave}
          error={errores.clave}
        />

        {errores.general ? (
          <Text style={styles.textoError} accessibilityRole="alert">
            {errores.general}
          </Text>
        ) : null}

        {bloqueado ? (
          <Text style={styles.ayuda}>
            Demasiados intentos fallidos. Podés volver a intentar en {segundosBloqueado} segundos.
          </Text>
        ) : null}

        <View style={styles.acciones}>
          <CustomButton
            title={textoBoton}
            onPress={enviar}
            disabled={bloqueado || Boolean(errores.usuario || errores.clave)}
            loading={enviando}
          />
          <CustomButton
            title="Crear cuenta"
            variante="contorno"
            onPress={() => navigation.navigate('Registro')}
            disabled={enviando}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'bottom']}>
      {/* En iOS el teclado puede tapar los campos: "padding" los empuja hacia arriba. */}
      <KeyboardAvoidingView
        style={styles.contenedor}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* FlatList de un solo item (regla del proyecto: sin ScrollView). Da scroll en
            pantallas chicas o con el teclado abierto. extraData hace que se redibuje al escribir. */}
        <FlatList
          data={[{ clave: 'login' }]}
          keyExtractor={(item) => item.clave}
          renderItem={() => contenido}
          extraData={[usuario, clave, errores, enviando, segundosBloqueado]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.lista}
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
  },
  lista: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  marca: {
    fontSize: theme.fontSize.display,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: theme.letterSpacing.titulo,
    color: theme.colors.texto,
    marginTop: theme.spacing.md,
  },
  subtitulo: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textoSecundario,
    textAlign: 'center',
  },
  tarjeta: {
    backgroundColor: theme.colors.superficie,
    borderRadius: theme.radius.lg,
    borderWidth: theme.grosor.fino,
    borderColor: theme.colors.borde,
    padding: theme.spacing.xl,
  },
  textoError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  ayuda: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textoSecundario,
    marginBottom: theme.spacing.md,
  },
  acciones: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
});
