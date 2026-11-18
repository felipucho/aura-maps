/**
 * ARCHIVO: src/navigation/AppDrawer.js
 * QUÉ HACE: menú lateral (drawer) con dos ítems: "Inicio" (las pestañas del mapa y de lugares) y "Perfil".
 * LO USA: AppNavigator (src/navigation/AppNavigator.js), cuando hay usuario logueado.
 * DEPENDE DE: @react-navigation/drawer, @expo/vector-icons (Ionicons), src/navigation/AppTabs.js,
 *             src/screens/ProfileScreen.js, src/utils/theme.js.
 * CONCEPTOS CLAVE: Drawer Navigator, gestos (react-native-gesture-handler), anidar Tabs dentro de Drawer.
 */
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AppTabs from './AppTabs';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../utils/theme';

const Drawer = createDrawerNavigator();

/**
 * Menú lateral de la app. "Inicio" lleva a las pestañas; "Perfil" muestra los datos del usuario.
 * @returns {JSX.Element} Drawer con sus dos ítems.
 */
export default function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.fondo },
        headerTintColor: theme.colors.texto,
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: theme.colors.superficie },
        drawerActiveBackgroundColor: theme.colors.primarioSuave,
        headerTitleStyle: { color: theme.colors.texto },
        drawerActiveTintColor: theme.colors.primario,
        drawerInactiveTintColor: theme.colors.textoSecundario,
      }}
    >
      <Drawer.Screen
        name="Inicio"
        component={AppTabs}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}
