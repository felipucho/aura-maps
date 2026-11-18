/**
 * ARCHIVO: src/navigation/AuthStack.js
 * QUÉ HACE: pila de pantallas para quien no tiene sesión: Login y Registro.
 * LO USA: AppNavigator (src/navigation/AppNavigator.js), cuando no hay usuario logueado.
 * DEPENDE DE: @react-navigation/native-stack, src/screens/LoginScreen.js, src/screens/RegisterScreen.js,
 *             src/utils/theme.js.
 * CONCEPTOS CLAVE: Stack Navigator (native-stack), navigation.navigate, opciones de header con theme.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { theme } from '../utils/theme';

const Stack = createNativeStackNavigator();

/**
 * Pila de autenticación. Los nombres "Login" y "Registro" son los que usa navigation.navigate.
 * @returns {JSX.Element} Stack con las dos pantallas de acceso.
 */
export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.fondo },
        headerTintColor: theme.colors.texto,
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.colors.texto },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Registro" component={RegisterScreen} options={{ title: 'Registro' }} />
    </Stack.Navigator>
  );
}
