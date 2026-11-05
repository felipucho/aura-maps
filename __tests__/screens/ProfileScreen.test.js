/**
 * ARCHIVO: __tests__/screens/ProfileScreen.test.js
 * QUÉ HACE: prueba el perfil: muestra el usuario y la cantidad de lugares, y el logout
 *           pide confirmación antes de cerrar la sesión.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/screens/ProfileScreen.js, src/context/AuthContext.js, src/utils/storage.js.
 * CONCEPTOS CLAVE: Alert.alert mockeado, logout con confirmación, contador de lugares.
 */
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../../src/screens/ProfileScreen';
import { AuthProvider } from '../../src/context/AuthContext';
import { agregarLugar, guardarSesion, leerSesion } from '../../src/utils/storage';

/**
 * Monta el perfil con provider y navegación.
 * @returns {JSX.Element} Árbol de prueba.
 */
function Prueba() {
  const Stack = createNativeStackNavigator();
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Perfil">{() => <ProfileScreen />}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const datosLugar = {
  title: 'Cafe',
  description: '',
  imageUri: 'file:///cache/cafe.jpg',
  latitude: -31.9,
  longitude: -63.1,
};

describe('ProfileScreen', () => {
  test('muestra el usuario y la cantidad de lugares guardados', async () => {
    await guardarSesion('juan');
    await agregarLugar('juan', datosLugar);
    await agregarLugar('juan', { ...datosLugar, title: 'Parque' });
    await render(<Prueba />);

    expect(await screen.findByText('juan')).toBeTruthy();
    expect(await screen.findByText('2')).toBeTruthy();
  });

  test('cerrar sesión pide confirmación y, al confirmar, borra la sesión', async () => {
    await guardarSesion('juan');
    const alerta = jest.spyOn(Alert, 'alert');
    await render(<Prueba />);
    await screen.findByText('juan');

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Cerrar sesión'));
    });

    expect(alerta).toHaveBeenCalledTimes(1);
    const botones = alerta.mock.calls[0][2];
    await act(async () => {
      await botones[1].onPress();
    });

    await expect(leerSesion()).resolves.toBeNull();
    alerta.mockRestore();
  });
});
