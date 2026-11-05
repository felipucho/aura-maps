/**
 * ARCHIVO: __tests__/navigation/AppNavigator.test.js
 * QUÉ HACE: prueba la navegación condicional: spinner mientras carga, AuthStack sin sesión y AppDrawer con sesión.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/navigation/AppNavigator.js, src/context/AuthContext.js, src/utils/storage.js.
 * CONCEPTOS CLAVE: navegación condicional, spinner de carga, Drawer y Tabs en tests.
 */
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../../src/navigation/AppNavigator';
import { AuthProvider } from '../../src/context/AuthContext';
import * as storage from '../../src/utils/storage';

const { guardarSesion } = storage;

// El Drawer usa react-native-reanimated, que no corre en Node. Lo reemplazamos por un stub
// para probar la decisión de navegación (qué navegador se muestra), no el menú en sí.
jest.mock('../../src/navigation/AppDrawer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(Text, null, 'Drawer de prueba'),
  };
});

/**
 * Monta el navegador principal con el provider de autenticación, como en App.js.
 * @returns {JSX.Element} Árbol de prueba.
 */
function Prueba() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

describe('AppNavigator', () => {
  test('mientras lee la sesión muestra el spinner', async () => {
    // La lectura de la sesión nunca termina: así el spinner queda visible.
    const espia = jest.spyOn(storage, 'leerSesion').mockReturnValue(new Promise(() => {}));
    await render(<Prueba />);

    expect(screen.getByTestId('spinner-app')).toBeTruthy();
    espia.mockRestore();
  });

  test('sin sesión muestra el stack de autenticación (login)', async () => {
    await render(<Prueba />);

    expect(await screen.findByText('Lorenzo')).toBeTruthy();
    expect(screen.getByLabelText('Entrar')).toBeTruthy();
  });

  test('con sesión muestra el drawer (AppDrawer) en vez del login', async () => {
    await guardarSesion('juan');
    await render(<Prueba />);

    expect(await screen.findByText('Drawer de prueba')).toBeTruthy();
    expect(screen.queryByLabelText('Entrar')).toBeNull();
  });
});
