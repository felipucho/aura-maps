/**
 * ARCHIVO: __tests__/screens/RegisterScreen.test.js
 * QUÉ HACE: prueba que RegisterScreen muestre el error correcto debajo de cada campo al enviar,
 *           rechace usuarios duplicados y cree la cuenta cuando los datos son válidos.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/screens/RegisterScreen.js, src/context/AuthContext.js, src/utils/storage.js.
 * CONCEPTOS CLAVE: errores por campo, leerUsuarios desde storage, botón deshabilitado con errores.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../src/screens/RegisterScreen';
import { AuthProvider } from '../../src/context/AuthContext';
import { guardarUsuarios, leerUsuarios } from '../../src/utils/storage';

/**
 * Renderiza la pantalla de registro con el provider de autenticación.
 * @returns {Promise<object>} Resultado de render.
 */
async function renderizarRegistro() {
  return render(
    <AuthProvider>
      <RegisterScreen />
    </AuthProvider>,
  );
}

/**
 * Escribe usuario, contraseña y confirmación en el formulario.
 * @param {string} usuario - Usuario a escribir.
 * @param {string} clave - Contraseña a escribir.
 * @param {string} confirmacion - Repetición a escribir.
 * @returns {Promise<void>}
 */
async function completarFormulario(usuario, clave, confirmacion) {
  await fireEvent.changeText(screen.getByLabelText('Usuario'), usuario);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), clave);
  await fireEvent.changeText(screen.getByLabelText('Repetir contraseña'), confirmacion);
}

describe('RegisterScreen: errores al enviar', () => {
  test('con el formulario vacío muestra un error debajo de cada campo', async () => {
    await renderizarRegistro();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Crear cuenta'));
    });

    expect(screen.getByText('Ingresá un usuario.')).toBeTruthy();
    expect(screen.getByText('Ingresá una contraseña.')).toBeTruthy();
    expect(screen.getByText('Repetí la contraseña.')).toBeTruthy();
  });

  test('con las contraseñas distintas muestra el error de coincidencia', async () => {
    await renderizarRegistro();
    await completarFormulario('juan', 'Abcdef1', 'Abcdef2');

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Crear cuenta'));
    });

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();
  });

  test('con un usuario que ya existe muestra "Ese usuario ya existe."', async () => {
    await guardarUsuarios([{ username: 'juan', passwordHash: 'hash-viejo' }]);
    await renderizarRegistro();
    await completarFormulario('juan', 'Abcdef1', 'Abcdef1');

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Crear cuenta'));
    });

    expect(screen.getByText('Ese usuario ya existe.')).toBeTruthy();
  });

  test('el botón queda deshabilitado mientras hay errores', async () => {
    await renderizarRegistro();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Crear cuenta'));
    });

    expect(screen.getByLabelText('Crear cuenta').props.accessibilityState.disabled).toBe(true);
  });

  test('el error de un campo se limpia al empezar a corregirlo', async () => {
    await renderizarRegistro();
    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Crear cuenta'));
    });

    await fireEvent.changeText(screen.getByLabelText('Usuario'), 'juan');

    expect(screen.queryByText('Ingresá un usuario.')).toBeNull();
  });

  test('la contraseña muestra su error al salir del campo (onBlur)', async () => {
    await renderizarRegistro();
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'abc');

    await fireEvent(screen.getByLabelText('Contraseña'), 'blur');

    expect(screen.getByText('La contraseña debe tener al menos 6 caracteres.')).toBeTruthy();
  });

  test('la confirmación muestra su error al salir del campo (onBlur)', async () => {
    await renderizarRegistro();
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1');
    await fireEvent.changeText(screen.getByLabelText('Repetir contraseña'), 'otra');

    await fireEvent(screen.getByLabelText('Repetir contraseña'), 'blur');

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();
  });

  test('el usuario muestra su error al salir del campo (onBlur)', async () => {
    await renderizarRegistro();
    await fireEvent.changeText(screen.getByLabelText('Usuario'), 'ab');

    await fireEvent(screen.getByLabelText('Usuario'), 'blur');

    expect(screen.getByText('El usuario debe tener entre 4 y 20 caracteres.')).toBeTruthy();
  });
});

describe('RegisterScreen: registro válido', () => {
  test('con datos válidos crea la cuenta en el storage', async () => {
    await renderizarRegistro();
    await completarFormulario('juanito', 'Abcdef1', 'Abcdef1');

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Crear cuenta'));
    });

    await waitFor(async () => {
      const usuarios = await leerUsuarios();
      expect(usuarios).toHaveLength(1);
      expect(usuarios[0].username).toBe('juanito');
    });
  });
});
