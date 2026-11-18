/**
 * ARCHIVO: src/navigation/AppNavigator.js
 * QUÉ HACE: decide qué navegador mostrar según el estado de sesión: spinner mientras carga,
 *           AuthStack si no hay usuario, y AppDrawer si hay usuario.
 * LO USA: App.js (dentro del NavigationContainer).
 * DEPENDE DE: react-native (ActivityIndicator, StyleSheet, View), src/context/AuthContext.js (useAuth),
 *             src/navigation/AuthStack.js, src/navigation/AppDrawer.js, src/utils/theme.js.
 * CONCEPTOS CLAVE: navegación condicional, loading al arrancar, reemplazo de pantallas al loguearse.
 */
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppDrawer from './AppDrawer';
import { theme } from '../utils/theme';

/**
 * Elige la navegación según la sesión. Cuándo se ejecuta: cada vez que cambia user o loading.
 * POR QUÉ es condicional: si hay usuario, la pantalla de login ni existe en la navegación.
 * Así la persona no puede "volver atrás" a Login después de entrar, y al cerrar sesión
 * la app vuelve sola a AuthStack, sin hacer ningún navigate.
 * @returns {JSX.Element} Spinner, AuthStack o AppDrawer.
 */
export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Mientras leemos la sesión guardada, no sabemos a qué pantalla mandar: mostramos un spinner.
  if (loading) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator testID="spinner-app" size="large" color={theme.colors.primario} />
      </View>
    );
  }

  // Sin usuario: login y registro. Con usuario: la app completa.
  return user ? <AppDrawer /> : <AuthStack />;
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.fondo,
  },
});
