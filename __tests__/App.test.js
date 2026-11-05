/**
 * ARCHIVO: __tests__/App.test.js
 * QUÉ HACE: prueba que App.js arme los providers y muestre la pantalla de login cuando no hay sesión.
 * LO USA: Jest (npm test).
 * DEPENDE DE: App.js.
 * CONCEPTOS CLAVE: providers, render del componente raíz.
 */
import { render, screen } from '@testing-library/react-native';
import App from '../App';

// El Drawer usa react-native-reanimated, que no corre en Node. Lo reemplazamos por un stub
// para probar la decisión de navegación (qué navegador se muestra), no el menú en sí.
jest.mock('../src/navigation/AppDrawer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(Text, null, 'Drawer de prueba'),
  };
});

describe('App', () => {
  test('sin sesión muestra la pantalla de login', async () => {
    await render(<App />);

    expect(await screen.findByText('Lorenzo')).toBeTruthy();
  });
});
