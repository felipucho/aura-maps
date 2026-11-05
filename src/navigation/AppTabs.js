/**
 * ARCHIVO: src/navigation/AppTabs.js
 * QUÉ HACE: barra de pestañas inferior con dos pantallas: "Mapa" y "Mis lugares".
 * LO USA: AppDrawer (src/navigation/AppDrawer.js), dentro del ítem "Inicio".
 * DEPENDE DE: @react-navigation/bottom-tabs, @expo/vector-icons (Ionicons), src/screens/MapScreen.js,
 *             src/screens/PlacesScreen.js, src/utils/theme.js.
 * CONCEPTOS CLAVE: Bottom Tabs, íconos con Ionicons, headerShown false (el header lo pone el Drawer).
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screens/MapScreen';
import PlacesScreen from '../screens/PlacesScreen';
import { theme } from '../utils/theme';

const Tab = createBottomTabNavigator();

/**
 * Pestañas de la app. El header lo muestra el Drawer ("Inicio"), por eso aquí va oculto.
 * @returns {JSX.Element} Tabs con "Mapa" y "Mis lugares".
 */
export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primario,
        tabBarInactiveTintColor: theme.colors.textoSecundario,
        tabBarStyle: { backgroundColor: theme.colors.superficie },
      }}
    >
      <Tab.Screen
        name="Mapa"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Mis lugares"
        component={PlacesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
