/**
 * ARCHIVO: __tests__/screens/LoginScreen.test.js
 * QUÉ HACE: prueba que LoginScreen muestre los errores al enviar vacío, el mensaje genérico
 *           ante credenciales malas y que el botón "Crear cuenta" navegue a Registro.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/screens/LoginScreen.js, src/context/AuthContext.js, @testing-library/react-native.
 * CONCEPTOS CLAVE: render con provider, fireEvent, act, errores al enviar, navegación simulada.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { AuthProvider } from '../../src/context/AuthContext';
import * as Crypto from 'expo-crypto';
import { guardarUsuarios } from '../../src/utils/storage';

/**
 * Renderiza la pantalla de login con el provider de autenticación.
 * @param {object} [navigation] - Objeto de navegación simulado.
 * @returns {Promise<object>} Resultado de render.
 */
async function renderizarLogin(navigation = { navigate: jest.fn() }) {
  return render(
    <AuthProvider>
      <LoginScreen navigation={navigation} />
    </AuthProvider>,
  );
}

describe('LoginScreen', () => {
  test('al enviar vacío muestra los dos errores de campo obligatorio', async () => {
    await renderizarLogin();

    await fireEvent.press(screen.getByLabelText('Entrar'));

    expect(screen.getByText('Ingresá tu usuario.')).toBeTruthy();
    expect(screen.getByText('Ingresá tu contraseña.')).toBeTruthy();
  });

  test('con credenciales incorrectas muestra el mensaje genérico', async () => {
    await renderizarLogin();
    await fireEvent.changeText(screen.getByLabelText('Usuario'), 'nadie');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1');

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Entrar'));
    });

    expect(await screen.findByText('Usuario o contraseña incorrectos')).toBeTruthy();
  });

  test('con credenciales correctas no muestra error', async () => {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'Abcdef1');
    await guardarUsuarios([{ username: 'juan', passwordHash: hash }]);
    await renderizarLogin();
    await fireEvent.changeText(screen.getByLabelText('Usuario'), 'juan');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1');

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Entrar'));
    });

    await waitFor(() => expect(screen.queryByText('Usuario o contraseña incorrectos')).toBeNull());
  });

  test('el campo usuario muestra el error al salir si está vacío (onBlur)', async () => {
    await renderizarLogin();

    await fireEvent(screen.getByLabelText('Usuario'), 'blur');

    expect(screen.getByText('Ingresá tu usuario.')).toBeTruthy();
  });

  test('el campo contraseña muestra el error al salir si está vacío (onBlur)', async () => {
    await renderizarLogin();

    await fireEvent(screen.getByLabelText('Contraseña'), 'blur');

    expect(screen.getByText('Ingresá tu contraseña.')).toBeTruthy();
  });

  test('"Crear cuenta" navega a la pantalla de registro', async () => {
    const navigation = { navigate: jest.fn() };
    await renderizarLogin(navigation);

    await fireEvent.press(screen.getByLabelText('Crear cuenta'));

    expect(navigation.navigate).toHaveBeenCalledWith('Registro');
  });
});
