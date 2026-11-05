/**
 * ARCHIVO: __tests__/screens/PlacesScreen.test.js
 * QUÉ HACE: prueba la pantalla "Mis lugares": estado vacío, lista con FlatList, borrado con
 *           confirmación (Alert) y estado de error cuando falla la lectura.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/screens/PlacesScreen.js, src/context/AuthContext.js, src/utils/storage.js,
 *             @react-navigation/native (NavigationContainer para useFocusEffect).
 * CONCEPTOS CLAVE: FlatList, Alert.alert mockeado, jest.spyOn, useFocusEffect, estados vacío y error.
 */
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlacesScreen from '../../src/screens/PlacesScreen';
import { AuthProvider } from '../../src/context/AuthContext';
import * as storage from '../../src/utils/storage';

/**
 * Monta la pantalla dentro de un navegador real para que useFocusEffect funcione.
 * @returns {JSX.Element} Árbol de prueba con provider y navegación.
 */
function Prueba() {
  const Stack = createNativeStackNavigator();
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Lugares">{() => <PlacesScreen />}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

// Lugar de ejemplo para cargar en el storage antes de renderizar.
const lugarDePrueba = {
  title: 'Plaza San Martín',
  description: 'Con bancos a la sombra',
  imageUri: 'file:///documents/plaza.jpg',
  latitude: -31.9,
  longitude: -63.1,
};

beforeEach(async () => {
  await storage.guardarSesion('juan');
});

describe('PlacesScreen', () => {
  test('sin lugares muestra el estado vacío', async () => {
    await render(<Prueba />);

    expect(await screen.findByText('Todavía no agregaste lugares')).toBeTruthy();
  });

  test('con lugares guardados muestra la lista con título y fecha', async () => {
    await storage.agregarLugar('juan', lugarDePrueba);
    await render(<Prueba />);

    expect(await screen.findByText('Plaza San Martín')).toBeTruthy();
    // La fecha sale en formato dd/mm/aaaa.
    expect(screen.getByText(/^\d{2}\/\d{2}\/\d{4}$/)).toBeTruthy();
  });

  test('borrar pide confirmación y, al confirmar, saca el lugar', async () => {
    await storage.agregarLugar('juan', lugarDePrueba);
    const alerta = jest.spyOn(Alert, 'alert');
    await render(<Prueba />);
    await screen.findByText('Plaza San Martín');

    await fireEvent.press(screen.getByLabelText('Borrar Plaza San Martín'));

    // Alert.alert recibe los botones: el segundo es "Borrar" y ejecuta el borrado.
    expect(alerta).toHaveBeenCalledTimes(1);
    const botones = alerta.mock.calls[0][2];
    await act(async () => {
      await botones[1].onPress();
    });

    expect(await screen.findByText('Lugar borrado.')).toBeTruthy();
    expect(await screen.findByText('Todavía no agregaste lugares')).toBeTruthy();
    alerta.mockRestore();
  });

  test('si la lectura falla muestra el estado de error', async () => {
    const espia = jest.spyOn(storage, 'leerLugares').mockRejectedValue(new Error('falla'));
    await render(<Prueba />);

    expect(await screen.findByText('No pudimos cargar tus lugares. Probá de nuevo.')).toBeTruthy();
    espia.mockRestore();
  });
});

describe('PlacesScreen: estado de carga inicial', () => {
  test('muestra el spinner mientras espera los lugares', async () => {
    // La lectura nunca termina en este test: así el spinner queda visible.
    const espia = jest.spyOn(storage, 'leerLugares').mockReturnValue(new Promise(() => {}));
    await render(<Prueba />);

    expect(await screen.findByText('Cargando tus lugares')).toBeTruthy();
    espia.mockRestore();
  });
});
