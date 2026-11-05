/**
 * ARCHIVO: __tests__/screens/MapScreen.test.js
 * QUÉ HACE: prueba el mapa: centra en la ubicación real, cae a Las Varillas si el permiso
 *           se niega, abre el modal con long press y muestra el marcador del lugar guardado.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/screens/MapScreen.js, expo-location (mock), react-native-maps (mock),
 *             src/context/AuthContext.js, src/utils/storage.js.
 * CONCEPTOS CLAVE: permisos de ubicación, fallback a Las Varillas, long press, marcadores, mocks.
 */
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../../src/screens/MapScreen';
import { AuthProvider } from '../../src/context/AuthContext';
import { guardarSesion, leerLugares } from '../../src/utils/storage';

// Punto de respaldo que el proyecto pide: Las Varillas, Córdoba.
const LAS_VARILLAS_LAT = -31.8722;
const LAS_VARILLAS_LNG = -62.7194;

/**
 * Monta el mapa dentro de navegación y provider, para que useFocusEffect funcione.
 * @returns {JSX.Element} Árbol de prueba.
 */
function Prueba() {
  const Stack = createNativeStackNavigator();
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Mapa">{() => <MapScreen />}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

beforeEach(async () => {
  await guardarSesion('juan');
});

describe('MapScreen: ubicación', () => {
  test('con permiso concedido centra el mapa en la ubicación real', async () => {
    await render(<Prueba />);

    const mapa = await screen.findByTestId('mapa');
    // El mock de expo-location devuelve -31.9, -63.1 cuando hay permiso.
    expect(mapa.props.initialRegion.latitude).toBe(-31.9);
    expect(mapa.props.initialRegion.longitude).toBe(-63.1);
    expect(mapa.props.showsUserLocation).toBe(true);
  });

  test('si el permiso de ubicación se niega, centra en Las Varillas y avisa', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    await render(<Prueba />);

    const mapa = await screen.findByTestId('mapa');
    expect(mapa.props.initialRegion.latitude).toBe(LAS_VARILLAS_LAT);
    expect(mapa.props.initialRegion.longitude).toBe(LAS_VARILLAS_LNG);
    expect(mapa.props.showsUserLocation).toBe(false);
    expect(
      screen.getByText(/Sin permiso de ubicación\. Mostramos Las Varillas/),
    ).toBeTruthy();
  });

  test('si falla la ubicación también cae a Las Varillas sin romper la app', async () => {
    Location.getCurrentPositionAsync.mockRejectedValueOnce(new Error('GPS apagado'));
    await render(<Prueba />);

    const mapa = await screen.findByTestId('mapa');
    expect(mapa.props.initialRegion.latitude).toBe(LAS_VARILLAS_LAT);
  });
});

describe('MapScreen: alta de lugares', () => {
  test('un long press abre el modal de nuevo lugar', async () => {
    await render(<Prueba />);
    const mapa = await screen.findByTestId('mapa');

    await fireEvent(mapa, 'longPress', { nativeEvent: { coordinate: { latitude: -31.9, longitude: -63.1 } } });

    expect(await screen.findByText('Nuevo lugar')).toBeTruthy();
  });

  test('guardar un lugar crea el marcador con su imagen y lo persiste', async () => {
    await render(<Prueba />);
    const mapa = await screen.findByTestId('mapa');
    await fireEvent(mapa, 'longPress', { nativeEvent: { coordinate: { latitude: -31.9, longitude: -63.1 } } });

    await fireEvent.changeText(screen.getByLabelText('Título'), 'Plaza San Martín');
    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Galería'));
    });
    await screen.findByLabelText('Vista previa de la imagen del lugar');
    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Guardar lugar'));
    });

    expect(await screen.findByText('Lugar guardado.')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByTestId('marcador')).toHaveLength(1));
    expect(screen.getByText('Plaza San Martín')).toBeTruthy();
    const guardados = await leerLugares('juan');
    expect(guardados).toHaveLength(1);
    expect(guardados[0].imageUri).toMatch(/^file:\/\/\/documents\/lugar-\d+\.jpg$/);
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
  });
});
