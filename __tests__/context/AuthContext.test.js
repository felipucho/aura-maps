/**
 * ARCHIVO: __tests__/context/AuthContext.test.js
 * QUÉ HACE: prueba el contexto de autenticación: registro, duplicados, login correcto e incorrecto,
 *           bloqueo tras 5 intentos con cuenta regresiva, sesión persistente y logout.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/context/AuthContext.js, src/utils/storage.js (AsyncStorage mockeado).
 * CONCEPTOS CLAVE: renderHook, act, waitFor, fake timers, persistencia de sesión.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { guardarUsuarios, guardarSesion, leerSesion, leerUsuarios } from '../../src/utils/storage';

// Renderiza el hook dentro del proveedor y espera a que termine de leer la sesión.
async function renderizarAuth() {
  const resultado = await renderHook(() => useAuth(), { wrapper: AuthProvider });
  await waitFor(() => expect(resultado.result.current.loading).toBe(false));
  return resultado;
}

describe('registro', () => {
  test('crea la cuenta, guarda el hash (no la clave) e inicia sesión', async () => {
    const { result } = await renderizarAuth();

    let error;
    await act(async () => {
      error = await result.current.register('juan', 'Abcdef1', 'Abcdef1');
    });

    expect(error).toBeNull();
    expect(result.current.user).toBe('juan');
    const usuarios = await leerUsuarios();
    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].username).toBe('juan');
    // La contraseña no aparece en texto plano en el storage.
    expect(usuarios[0].passwordHash).not.toBe('Abcdef1');
    expect(usuarios[0].passwordHash).toMatch(/^hash-falso-/);
    await expect(leerSesion()).resolves.toBe('juan');
  });

  test('rechaza un usuario duplicado sin crear otra cuenta', async () => {
    await guardarUsuarios([{ username: 'juan', passwordHash: 'hash-viejo' }]);
    const { result } = await renderizarAuth();

    let error;
    await act(async () => {
      error = await result.current.register('JUAN', 'Abcdef1', 'Abcdef1');
    });

    expect(error).toBe('Ese usuario ya existe.');
    expect(result.current.user).toBeNull();
    await expect(leerUsuarios()).resolves.toHaveLength(1);
  });

  test('devuelve el primer error de validación y no guarda nada', async () => {
    const { result } = await renderizarAuth();

    let error;
    await act(async () => {
      error = await result.current.register('juan', 'abc', 'abc');
    });

    expect(error).toBe('La contraseña debe tener al menos 6 caracteres.');
    await expect(leerUsuarios()).resolves.toEqual([]);
  });

  test('devuelve error si la confirmación no coincide', async () => {
    const { result } = await renderizarAuth();

    let error;
    await act(async () => {
      error = await result.current.register('juan', 'Abcdef1', 'Abcdef2');
    });

    expect(error).toBe('Las contraseñas no coinciden.');
  });
});

describe('login', () => {
  test('inicia sesión con datos correctos', async () => {
    const { result } = await renderizarAuth();
    await act(async () => {
      await result.current.register('juan', 'Abcdef1', 'Abcdef1');
      await result.current.logout();
    });

    let error;
    await act(async () => {
      error = await result.current.login('juan', 'Abcdef1');
    });

    expect(error).toBeNull();
    expect(result.current.user).toBe('juan');
  });

  test('con contraseña incorrecta devuelve el mensaje genérico', async () => {
    const { result } = await renderizarAuth();
    await act(async () => {
      await result.current.register('juan', 'Abcdef1', 'Abcdef1');
      await result.current.logout();
    });

    let error;
    await act(async () => {
      error = await result.current.login('juan', 'Otra1234');
    });

    expect(error).toBe('Usuario o contraseña incorrectos');
    expect(result.current.user).toBeNull();
  });

  test('con usuario inexistente devuelve el mismo mensaje genérico', async () => {
    const { result } = await renderizarAuth();

    let error;
    await act(async () => {
      error = await result.current.login('nadie', 'Abcdef1');
    });

    expect(error).toBe('Usuario o contraseña incorrectos');
  });

  test('bloquea el login tras 5 intentos fallidos y muestra la cuenta regresiva', async () => {
    jest.useFakeTimers();
    try {
      const { result } = await renderizarAuth();
      await act(async () => {
        await result.current.register('juan', 'Abcdef1', 'Abcdef1');
        await result.current.logout();
      });

      // 5 intentos fallidos seguidos.
      for (let i = 0; i < 5; i += 1) {
        await act(async () => {
          await result.current.login('juan', 'Malla1234');
        });
      }
      expect(result.current.segundosBloqueado).toBe(30);

      // Un intento más, aunque sea correcto, queda bloqueado.
      let error;
      await act(async () => {
        error = await result.current.login('juan', 'Abcdef1');
      });
      expect(error).toBe('Demasiados intentos. Esperá 30 segundos.');

      // Pasa un segundo: la cuenta regresiva baja.
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.segundosBloqueado).toBe(29);

      // Pasan los 30 segundos: el login vuelve a estar libre.
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });
      expect(result.current.segundosBloqueado).toBe(0);
      await act(async () => {
        error = await result.current.login('juan', 'Abcdef1');
      });
      expect(error).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('un login correcto reinicia el contador de fallos', async () => {
    const { result } = await renderizarAuth();
    await act(async () => {
      await result.current.register('juan', 'Abcdef1', 'Abcdef1');
      await result.current.logout();
    });

    // 4 fallos, luego un acierto, luego 4 fallos más: no debería bloquear.
    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        await result.current.login('juan', 'Malla1234');
      });
    }
    await act(async () => {
      await result.current.login('juan', 'Abcdef1');
      await result.current.logout();
    });
    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        await result.current.login('juan', 'Malla1234');
      });
    }
    expect(result.current.segundosBloqueado).toBe(0);
  });
});

describe('sesión persistente', () => {
  test('si había sesión guardada, al montar el usuario sigue logueado', async () => {
    await guardarSesion('maria');
    const { result } = await renderizarAuth();
    expect(result.current.user).toBe('maria');
  });

  test('sin sesión guardada, al montar no hay usuario', async () => {
    const { result } = await renderizarAuth();
    expect(result.current.user).toBeNull();
  });

  test('logout borra la sesión del storage', async () => {
    await guardarSesion('maria');
    const { result } = await renderizarAuth();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    await expect(leerSesion()).resolves.toBeNull();
  });

  test('si el componente se desmonta antes de leer la sesión, no falla', async () => {
    const { unmount } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    unmount();
    // Damos tiempo a que termine la lectura: no debe aparecer ningún error.
    await act(async () => {
      await Promise.resolve();
    });
  });
});

describe('useAuth', () => {
  test('fuera de AuthProvider devuelve null', async () => {
    const { result } = await renderHook(() => useAuth());
    expect(result.current).toBeNull();
  });
});
