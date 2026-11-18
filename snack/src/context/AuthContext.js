/**
 * ARCHIVO: src/context/AuthContext.js
 * QUÉ HACE: maneja el login, el registro, el logout y la sesión persistente de la app.
 *           Expone user, loading, login, register, logout y el contador del bloqueo.
 * LO USA: App.js (envuelve la app), AppNavigator, LoginScreen, RegisterScreen, ProfileScreen.
 * DEPENDE DE: react, expo-crypto (hash SHA-256), src/utils/storage.js, src/utils/validations.js.
 * CONCEPTOS CLAVE: Context, Provider, useContext, useState, useRef, useEffect, cleanup,
 *                  hook propio useAuth, hash de contraseñas, bloqueo por intentos.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import {
  leerUsuarios,
  guardarUsuarios,
  leerSesion,
  guardarSesion,
  borrarSesion,
} from '../utils/storage';
import { guardarUsuarioRemoto, leerUsuarioRemoto } from '../utils/supabase';
import {
  validarCorreo,
  validarUsuarioNoExiste,
  validarContrasenia,
  validarConfirmacion,
} from '../utils/validations';

// Cuántos intentos fallidos seguidos se permiten antes de bloquear el login.
const MAX_INTENTOS = 5;
// Cuánto dura el bloqueo, en segundos.
const SEGUNDOS_BLOQUEO = 30;
// Mensaje genérico: no decimos si falló el usuario o la contraseña (no damos pistas).
const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos';

// Contexto: el "canal" por donde la sesión llega a cualquier pantalla sin pasar props a mano.
export const AuthContext = createContext(null);

/**
 * Convierte una contraseña en un hash SHA-256.
 * POR QUÉ: nunca guardamos la contraseña en texto plano. Si alguien lee el storage,
 * ve el hash y no la clave. El hash no se puede revertir a la contraseña.
 * @param {string} clave - Contraseña escrita por la persona.
 * @returns {Promise<string>} Hash en hexadecimal.
 */
async function hashearContrasenia(clave) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, clave);
}

/**
 * Saca solo los nombres de una lista de usuarios (la validación de duplicados los necesita así).
 * Usamos for...of en vez de .map porque el proyecto no usa .map.
 * @param {Array<{username: string}>} usuarios - Usuarios guardados.
 * @returns {string[]} Solo los nombres.
 */
function nombresDe(usuarios) {
  const nombres = [];
  for (const usuario of usuarios) {
    nombres.push(usuario.username);
  }
  return nombres;
}

/**
 * Proveedor de autenticación. Envuelve la app y guarda el estado de la sesión.
 * Cuándo corre: cada vez que la app arranca (el efecto de sesión lee el storage al montar).
 * @param {object} props - Props.
 * @param {React.ReactNode} props.children - Pantallas que tienen acceso al contexto.
 * @returns {JSX.Element} Provider con el valor de autenticación.
 */
export function AuthProvider({ children }) {
  // Nombre del usuario logueado, o null si nadie inició sesión.
  const [user, setUser] = useState(null);
  // true mientras leemos la sesión guardada. Mientras es true, el navegador muestra un spinner.
  const [loading, setLoading] = useState(true);
  // Momento (en ms) hasta el que el login está bloqueado. 0 = sin bloqueo.
  const [bloqueadoHasta, setBloqueadoHasta] = useState(0);
  // "Ahora" que se actualiza cada segundo mientras hay bloqueo, para mostrar la cuenta regresiva.
  // Empieza en 0: no llamamos Date.now() durante el render (React lo prohíbe). Se fija al bloquear.
  const [ahora, setAhora] = useState(0);
  // Intentos fallidos seguidos. Es useRef y no useState: cambiarlo no debe re-renderizar la pantalla.
  const intentosFallidos = useRef(0);

  // Corre UNA sola vez al montar el provider (deps vacías): lee la sesión guardada.
  // Así, si la persona cerró la app logueada, al abrirla sigue logueada.
  // La variable "cancelado" evita actualizar estado si el proveedor se desmontó antes de terminar.
  useEffect(() => {
    let cancelado = false;
    async function cargarSesion() {
      const usuarioGuardado = await leerSesion();
      if (!cancelado) {
        setUser(usuarioGuardado);
        setLoading(false);
      }
    }
    cargarSesion();
    return () => {
      cancelado = true;
    };
  }, []);

  // Corre cada vez que cambia bloqueadoHasta. Solo tiene trabajo si hay un bloqueo activo:
  // cada segundo actualiza "ahora" para que la cuenta regresiva baje. Al terminar, se frena.
  // El cleanup borra el intervalo si el bloqueo cambia o la pantalla se va.
  useEffect(() => {
    if (bloqueadoHasta <= Date.now()) return undefined;
    const intervalo = setInterval(() => {
      const momento = Date.now();
      setAhora(momento);
      if (momento >= bloqueadoHasta) clearInterval(intervalo);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [bloqueadoHasta]);

  // Segundos que faltan para desbloquear. 0 significa que el login está libre.
  const segundosBloqueado = Math.max(0, Math.ceil((bloqueadoHasta - ahora) / 1000));

  /**
   * Inicia sesión con usuario y contraseña. Si hay bloqueo activo, no intenta nada.
   * Tras 5 fallos seguidos, bloquea el login 30 segundos.
   * @param {string} usuarioCrudo - Usuario escrito.
   * @param {string} clave - Contraseña escrita.
   * @returns {Promise<string|null>} Mensaje de error, o null si entró bien.
   */
  async function login(usuarioCrudo, clave) {
    if (segundosBloqueado > 0) {
      return `Demasiados intentos. Esperá ${segundosBloqueado} segundos.`;
    }
    // El correo se guarda en minúsculas: "Ana@x.com" y "ana@x.com" son la misma cuenta.
    const nombre = usuarioCrudo.trim().toLowerCase();
    const usuarios = await leerUsuarios();
    const hash = await hashearContrasenia(clave);
    // Calculamos el hash aunque el usuario no exista: así tarda lo mismo y no revelamos
    // por el tiempo de respuesta si el usuario está registrado.
    const local = usuarios.find((usuario) => usuario.username === nombre);
    // Supabase manda: la cuenta anda en cualquier celular o navegador, y aunque se borre el
    // storage al cerrar la app. Si no hay internet (remoto = null), usamos la copia local.
    const remoto = await leerUsuarioRemoto(nombre);
    const hashGuardado = remoto ? remoto.password_hash : local?.passwordHash;

    if (hashGuardado && hashGuardado === hash) {
      // Contraseña correcta: dejamos la cuenta al día en este dispositivo.
      const otros = usuarios.filter((usuario) => usuario.username !== nombre);
      await guardarUsuarios([...otros, { username: nombre, passwordHash: hash }]);
      // Si la cuenta solo existía en este dispositivo, la subimos a Supabase.
      if (!remoto) await guardarUsuarioRemoto(nombre, hash);
      intentosFallidos.current = 0;
      await guardarSesion(nombre);
      setUser(nombre);
      return null;
    }

    intentosFallidos.current += 1;
    if (intentosFallidos.current >= MAX_INTENTOS) {
      // Bloqueamos y reiniciamos el contador: después del bloqueo, vuelven 5 intentos.
      intentosFallidos.current = 0;
      setAhora(Date.now());
      setBloqueadoHasta(Date.now() + SEGUNDOS_BLOQUEO * 1000);
    }
    return MENSAJE_CREDENCIALES;
  }

  /**
   * Crea una cuenta nueva y deja la sesión iniciada.
   * Vuelve a validar todo acá, así la regla se cumple aunque la pantalla falle.
   * @param {string} usuarioCrudo - Usuario elegido.
   * @param {string} clave - Contraseña elegida.
   * @param {string} confirmacion - Repetición de la contraseña.
   * @returns {Promise<string|null>} Primer error de validación, o null si se creó la cuenta.
   */
  async function register(usuarioCrudo, clave, confirmacion) {
    const nombre = usuarioCrudo.trim().toLowerCase();
    const usuarios = await leerUsuarios();
    // El correo no puede existir ni en este dispositivo ni en Supabase (otro celular).
    const nombres = nombresDe(usuarios);
    const remoto = await leerUsuarioRemoto(nombre);
    if (remoto) nombres.push(remoto.username);
    const error =
      validarCorreo(nombre) ||
      validarUsuarioNoExiste(nombre, nombres) ||
      validarContrasenia(clave, nombre) ||
      validarConfirmacion(clave, confirmacion);
    if (error) return error;

    const hash = await hashearContrasenia(clave);
    await guardarUsuarios([...usuarios, { username: nombre, passwordHash: hash }]);
    // Copia en Supabase (solo el hash). Si falla, la cuenta igual queda creada en local.
    await guardarUsuarioRemoto(nombre, hash);
    await guardarSesion(nombre);
    setUser(nombre);
    return null;
  }

  /**
   * Cierra la sesión: borra la sesión del storage y vuelve a la pantalla de login.
   * @returns {Promise<void>}
   */
  async function logout() {
    await borrarSesion();
    setUser(null);
  }

  const valor = {
    user,
    loading,
    login,
    register,
    logout,
    segundosBloqueado,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/**
 * Hook propio para leer la autenticación desde cualquier pantalla.
 * Ejemplo: const { user, logout } = useAuth();
 * @returns {object|null} Valor del contexto, o null si se usa fuera de AuthProvider.
 */
export function useAuth() {
  return useContext(AuthContext);
}
