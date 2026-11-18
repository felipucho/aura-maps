/**
 * ARCHIVO: src/screens/ProfileScreen.js
 * QUÉ HACE: muestra el usuario logueado y cuántos lugares guardó. Tiene el botón de cerrar sesión,
 *           que pide confirmación antes de salir.
 * LO USA: AppDrawer (src/navigation/AppDrawer.js), ítem "Perfil" del menú.
 * DEPENDE DE: react, react-native (Alert, StyleSheet, Text, View), react-native-safe-area-context,
 *             @react-navigation/native (useFocusEffect), src/context/AuthContext.js,
 *             src/components/CustomButton.js, src/utils/storage.js, src/utils/theme.js.
 * CONCEPTOS CLAVE: useAuth, logout, Alert de confirmación, useFocusEffect para recontar lugares.
 */
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { confirmar } from '../utils/confirmar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { CustomButton } from '../components/CustomButton';
import { leerLugares } from '../utils/storage';
import { theme } from '../utils/theme';

/**
 * Pantalla de perfil. Cuándo se ejecuta: cuando la persona abre "Perfil" en el menú lateral.
 * @returns {JSX.Element} Datos del usuario y botón de logout.
 */
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [cantidad, setCantidad] = useState(0);

  // Corre cada vez que la pantalla gana el foco: así el contador se actualiza
  // si guardaste o borraste lugares desde otra pestaña.
  useFocusEffect(
    useCallback(() => {
      async function contar() {
        const lugares = await leerLugares(user);
        setCantidad(lugares.length);
      }
      contar();
    }, [user]),
  );

  /**
   * Pide confirmación antes de cerrar sesión, así no se sale por un toque sin querer.
   * @returns {void}
   */
  async function confirmarLogout() {
    const ok = await confirmar('Cerrar sesión', '¿Seguro que querés salir?', 'Salir');
    if (ok) await logout();
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>Correo</Text>
        <Text style={styles.valor}>{user}</Text>

        <Text style={styles.etiqueta}>Lugares guardados</Text>
        <Text style={styles.valor}>{cantidad}</Text>
      </View>

      <View style={styles.acciones}>
        <CustomButton title="Cerrar sesión" variante="contorno" onPress={confirmarLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: theme.colors.fondo,
    padding: theme.spacing.lg,
  },
  tarjeta: {
    backgroundColor: theme.colors.superficie,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  etiqueta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textoSecundario,
    marginTop: theme.spacing.md,
  },
  valor: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.texto,
  },
  acciones: {
    marginTop: theme.spacing.xl,
  },
});
