/**
 * ARCHIVO: src/utils/validations.js
 * QUÉ HACE: reglas de validación de formularios. Cada función recibe un valor y devuelve
 *           un mensaje de error en español, o null si está bien.
 * LO USA: LoginScreen, RegisterScreen, PlaceModal y AuthContext (para revalidar al registrar).
 * DEPENDE DE: nada. Son funciones puras: no tocan AsyncStorage ni la UI.
 * CONCEPTOS CLAVE: funciones puras, expresiones regulares, validación en onBlur y al enviar.
 */

// Nombres que no se pueden usar como usuario (mayúsculas o minúsculas, da igual).
const PALABRAS_RESERVADAS = ['admin', 'root', 'test'];

// Contraseñas demasiado comunes. Se comparan en minúsculas.
const CONTRASENIAS_COMUNES = [
  '123456',
  '123456789',
  '12345678',
  '1234567',
  '111111',
  '000000',
  '123123',
  'password',
  'password1',
  'qwerty',
  'abc123',
  'letmein',
  'iloveyou',
  'admin123',
];

/**
 * Quita espacios de los extremos. Si el valor no es texto, devuelve "".
 * @param {*} valor - Valor crudo del input.
 * @returns {string} Texto sin espacios en los extremos.
 */
function limpiar(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

/**
 * Valida que un campo no esté vacío (después de quitar espacios).
 * @param {*} valor - Valor del campo.
 * @param {string} mensaje - Texto de error si está vacío.
 * @returns {string|null} El mensaje si está vacío, o null.
 */
export function validarObligatorio(valor, mensaje) {
  return limpiar(valor) === '' ? mensaje : null;
}

/**
 * Valida el usuario al registrarse. Aplica trim antes de validar.
 * Reglas: no vacío, sin espacios, solo letras y números, 4 a 20 caracteres,
 * no solo números, no empieza con número, no es palabra reservada.
 * @param {string} valor - Usuario escrito por la persona.
 * @returns {string|null} Mensaje de error o null si es válido.
 */
export function validarUsuario(valor) {
  const usuario = limpiar(valor);
  if (usuario === '') return 'Ingresá un usuario.';
  if (/\s/.test(usuario)) return 'El usuario no puede tener espacios.';
  if (!/^[a-zA-Z0-9]+$/.test(usuario)) return 'El usuario solo puede tener letras y números.';
  if (usuario.length < 4 || usuario.length > 20) {
    return 'El usuario debe tener entre 4 y 20 caracteres.';
  }
  if (/^\d+$/.test(usuario)) return 'El usuario no puede ser solo números.';
  if (/^\d/.test(usuario)) return 'El usuario no puede empezar con un número.';
  if (PALABRAS_RESERVADAS.includes(usuario.toLowerCase())) {
    return 'Ese usuario no está permitido.';
  }
  return null;
}

/**
 * Revisa que el usuario no esté ya registrado. Es pura: recibe la lista de nombres
 * que ya existen, así no necesita leer AsyncStorage.
 * @param {string} valor - Usuario que se quiere registrar.
 * @param {string[]} usuariosExistentes - Nombres de usuarios ya guardados.
 * @returns {string|null} "Ese usuario ya existe." o null.
 */
export function validarUsuarioNoExiste(valor, usuariosExistentes) {
  const buscado = limpiar(valor).toLowerCase();
  // for...of en vez de .map/.some: el proyecto no usa .map.
  for (const existente of usuariosExistentes) {
    if (existente.toLowerCase() === buscado) return 'Ese usuario ya existe.';
  }
  return null;
}

/**
 * Valida la contraseña al registrarse.
 * Reglas: no vacía, sin espacios, 6 a 32 caracteres, una mayúscula, una minúscula,
 * un número, distinta del usuario y no está en la lista de contraseñas comunes.
 * @param {string} valor - Contraseña escrita.
 * @param {string} [usuario=''] - Usuario, para no permitir que sean iguales.
 * @returns {string|null} Mensaje de error o null.
 */
export function validarContrasenia(valor, usuario = '') {
  const clave = typeof valor === 'string' ? valor : '';
  if (clave === '') return 'Ingresá una contraseña.';
  if (/\s/.test(clave)) return 'La contraseña no puede tener espacios.';
  if (clave.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  if (clave.length > 32) return 'La contraseña no puede tener más de 32 caracteres.';
  if (!/[A-Z]/.test(clave)) return 'La contraseña debe tener al menos una mayúscula.';
  if (!/[a-z]/.test(clave)) return 'La contraseña debe tener al menos una minúscula.';
  if (!/[0-9]/.test(clave)) return 'La contraseña debe tener al menos un número.';
  if (clave.toLowerCase() === limpiar(usuario).toLowerCase()) {
    return 'La contraseña no puede ser igual al usuario.';
  }
  if (CONTRASENIAS_COMUNES.includes(clave.toLowerCase())) {
    return 'Esa contraseña es muy común.';
  }
  return null;
}

/**
 * Valida que la confirmación sea igual a la contraseña.
 * @param {string} clave - Contraseña original.
 * @param {string} confirmacion - Repetición escrita por la persona.
 * @returns {string|null} Mensaje de error o null.
 */
export function validarConfirmacion(clave, confirmacion) {
  if (typeof confirmacion !== 'string' || confirmacion === '') {
    return 'Repetí la contraseña.';
  }
  if (confirmacion !== clave) return 'Las contraseñas no coinciden.';
  return null;
}

/**
 * Valida el título de un lugar: obligatorio y de 3 a 50 caracteres (después de trim).
 * @param {string} valor - Título escrito.
 * @returns {string|null} Mensaje de error o null.
 */
export function validarTituloLugar(valor) {
  const titulo = limpiar(valor);
  if (titulo === '') return 'Ingresá un título.';
  if (titulo.length < 3 || titulo.length > 50) {
    return 'El título debe tener entre 3 y 50 caracteres.';
  }
  return null;
}

/**
 * Valida la descripción de un lugar. Es opcional, pero no puede pasar de 200 caracteres.
 * @param {string} valor - Descripción escrita (puede estar vacía).
 * @returns {string|null} Mensaje de error o null.
 */
export function validarDescripcionLugar(valor) {
  if (limpiar(valor).length > 200) {
    return 'La descripción no puede tener más de 200 caracteres.';
  }
  return null;
}

/**
 * Valida que haya una imagen elegida para el lugar.
 * @param {string} uri - URI de la imagen (vacía si no se eligió nada).
 * @returns {string|null} Mensaje de error o null.
 */
export function validarImagenLugar(uri) {
  return limpiar(uri) === '' ? 'Elegí una imagen para el lugar.' : null;
}

/**
 * Valida la latitud: número entre -90 y 90.
 * @param {number} valor - Latitud del punto del mapa.
 * @returns {string|null} Mensaje de error o null.
 */
export function validarLatitud(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return 'La latitud no es válida.';
  if (valor < -90 || valor > 90) return 'La latitud debe estar entre -90 y 90.';
  return null;
}

/**
 * Valida la longitud: número entre -180 y 180.
 * @param {number} valor - Longitud del punto del mapa.
 * @returns {string|null} Mensaje de error o null.
 */
export function validarLongitud(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return 'La longitud no es válida.';
  if (valor < -180 || valor > 180) return 'La longitud debe estar entre -180 y 180.';
  return null;
}

/**
 * Evita guardar dos lugares con el mismo título y las mismas coordenadas.
 * @param {string} titulo - Título nuevo.
 * @param {number} latitud - Latitud nueva.
 * @param {number} longitud - Longitud nueva.
 * @param {Array<{title: string, latitude: number, longitude: number}>} lugares - Lugares ya guardados.
 * @returns {string|null} Mensaje de error o null.
 */
export function validarLugarDuplicado(titulo, latitud, longitud, lugares) {
  const buscado = limpiar(titulo).toLowerCase();
  for (const lugar of lugares) {
    const mismoTitulo = lugar.title.trim().toLowerCase() === buscado;
    if (mismoTitulo && lugar.latitude === latitud && lugar.longitude === longitud) {
      return 'Ya existe un lugar con ese título en esas coordenadas.';
    }
  }
  return null;
}
