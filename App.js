/**
 * ARCHIVO: App.js
 * QUÉ HACE: punto de entrada de la app. Solo arma los providers (seguridad de áreas, gestos,
 *           sesión y navegación) y muestra AppNavigator. No tiene lógica de pantallas.
 * LO USA: index.js (registra este componente en Expo).
 * DEPENDE DE: react-native-gesture-handler, react-native-safe-area-context, @react-navigation/native,
 *             expo-status-bar, src/context/AuthContext.js, src/navigation/AppNavigator.js.
 * CONCEPTOS CLAVE: Providers, SafeAreaProvider, GestureHandlerRootView, NavigationContainer, StatusBar.
 */
// Debe ir primero: carga el sistema de gestos antes que cualquier pantalla que use el Drawer.
import 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Componente raíz. Los providers van de afuera hacia adentro:
 * - SafeAreaProvider: da los márgenes seguros (notch, barra de estado).
 * - GestureHandlerRootView: necesario para que el Drawer reciba los gestos de deslizar.
 * - AuthProvider: la sesión queda disponible en toda la app.
 * - NavigationContainer: contiene la navegación.
 * @returns {JSX.Element} La app completa.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.raiz}>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
});
