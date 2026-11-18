/**
 * ARCHIVO: src/utils/supabase.js
 * QUÉ HACE: conecta la app con Supabase. Cada lugar que se guarda o se borra también se
 *           guarda o se borra en la tabla "places" de Supabase, sin que la persona haga nada.
 *           Si Supabase falla (sin internet, claves sin completar), la app sigue andando con
 *           AsyncStorage: el guardado local nunca depende de Supabase.
 * LO USA: src/utils/storage.js (agregarLugar y borrarLugar).
 * DEPENDE DE: fetch (viene con React Native). No necesita ninguna librería extra.
 * CONCEPTOS CLAVE: API REST de Supabase (PostgREST), clave publicable, fetch con async/await.
 */

// COMPLETAR: Supabase → Project Settings → API. Pegar la "Project URL" y la clave
// "anon" / "publishable". NO pegar nunca la clave "service_role" ni "secret".
const SUPABASE_URL = 'PEGAR_PROJECT_URL';
const SUPABASE_KEY = 'PEGAR_CLAVE_PUBLICABLE';

/**
 * Dice si las claves ya fueron completadas.
 * @returns {boolean} true si hay URL y clave reales.
 */
function estaConfigurado() {
  return SUPABASE_URL.startsWith('http') && !SUPABASE_KEY.startsWith('PEGAR');
}

/**
 * Cabeceras que pide Supabase en cada pedido.
 * @returns {object} Cabeceras con la clave publicable.
 */
function cabeceras() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
}

// Bucket público de Supabase Storage donde van las fotos de los lugares.
const BUCKET_FOTOS = 'lugares';
const LETRAS_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Pasa un texto base64 a bytes. Lo hacemos a mano para no sumar librerías.
 * @param {string} base64 - Imagen en base64 (sin el prefijo "data:...").
 * @returns {Uint8Array} Bytes de la imagen.
 */
function base64ABytes(base64) {
  const limpio = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((limpio.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let posicion = 0;
  for (const letra of limpio) {
    buffer = (buffer << 6) | LETRAS_BASE64.indexOf(letra);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[posicion] = (buffer >> bits) & 0xff;
      posicion += 1;
    }
  }
  return bytes.subarray(0, posicion);
}

/**
 * Sube la foto de un lugar a Supabase Storage. Así la foto se ve en cualquier celular y
 * no se pierde al cerrar la app. Si falla, devuelve null y se usa la foto local.
 * @param {string} username - Dueño del lugar (arma la carpeta).
 * @param {string} base64 - Foto en base64, la que da expo-image-picker.
 * @param {string} [tipo='image/jpeg'] - Tipo de imagen.
 * @param {string} [uri] - URI de la foto. En web, si no hay base64, se lee desde acá (blob: o data:).
 * @returns {Promise<string|null>} URL pública de la foto, o null.
 */
export async function subirFotoLugar(username, base64, tipo = 'image/jpeg', uri = '') {
  if (!estaConfigurado()) return null;
  try {
    let cuerpo = null;
    if (base64) {
      cuerpo = base64ABytes(base64);
    } else if (uri.startsWith('blob:') || uri.startsWith('data:')) {
      // Web: el navegador da la foto como blob. La leemos y la subimos tal cual.
      const archivo = await (await fetch(uri)).blob();
      cuerpo = archivo;
      tipo = archivo.type || tipo;
    }
    if (!cuerpo) return null;
    const carpeta = username.replace(/[^a-zA-Z0-9]/g, '_');
    const extension = tipo === 'image/png' ? 'png' : 'jpg';
    const ruta = `${carpeta}/${Date.now()}.${extension}`;
    const respuesta = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_FOTOS}/${ruta}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': tipo,
        'x-upsert': 'true',
      },
      body: cuerpo,
    });
    if (!respuesta.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_FOTOS}/${ruta}`;
  } catch {
    return null;
  }
}

/**
 * Dice si una URI es una foto subida a nuestro bucket de Supabase.
 * @param {string} uri - URI de la foto.
 * @returns {boolean} true si está en Supabase Storage.
 */
export function esFotoRemota(uri) {
  return typeof uri === 'string' && uri.startsWith(`${SUPABASE_URL}/storage/`);
}

/**
 * Borra una foto del bucket. Si falla, no lanza error.
 * @param {string} url - URL pública que devolvió subirFotoLugar.
 * @returns {Promise<boolean>} true si se borró.
 */
export async function borrarFotoLugar(url) {
  if (!estaConfigurado() || !esFotoRemota(url)) return false;
  try {
    const ruta = url.split(`/public/${BUCKET_FOTOS}/`)[1];
    if (!ruta) return false;
    const respuesta = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_FOTOS}/${ruta}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}

/**
 * Guarda un usuario nuevo en la tabla "users". Solo viaja el HASH de la contraseña, nunca la
 * contraseña. Si falla, devuelve false y no lanza error.
 * @param {string} username - Nombre de usuario.
 * @param {string} passwordHash - Hash SHA-256 de la contraseña.
 * @returns {Promise<boolean>} true si Supabase lo guardó.
 */
export async function guardarUsuarioRemoto(username, passwordHash) {
  if (!estaConfigurado()) return false;
  try {
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({ username, password_hash: passwordHash }),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}

/**
 * Busca un usuario en la tabla "users". Sirve para entrar con una cuenta creada en otro
 * celular o navegador. Si falla o no existe, devuelve null.
 * @param {string} username - Correo del usuario (ya en minúsculas).
 * @returns {Promise<{username: string, password_hash: string}|null>} Usuario o null.
 */
export async function leerUsuarioRemoto(username) {
  if (!estaConfigurado()) return null;
  try {
    const filtro = `username=eq.${encodeURIComponent(username)}&select=username,password_hash&limit=1`;
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/users?${filtro}`, {
      headers: cabeceras(),
    });
    if (!respuesta.ok) return null;
    const filas = await respuesta.json();
    return Array.isArray(filas) && filas.length > 0 ? filas[0] : null;
  } catch {
    return null;
  }
}

/**
 * Trae los lugares de un usuario desde la tabla "places", con la misma forma que usa la app.
 * Si falla (sin internet), devuelve null para que se use la copia local.
 * @param {string} username - Correo del usuario.
 * @returns {Promise<Array<object>|null>} Lugares o null.
 */
export async function leerLugaresRemotos(username) {
  if (!estaConfigurado()) return null;
  try {
    const filtro = `username=eq.${encodeURIComponent(username)}&select=*&order=created_at.asc`;
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/places?${filtro}`, {
      headers: cabeceras(),
    });
    if (!respuesta.ok) return null;
    const filas = await respuesta.json();
    if (!Array.isArray(filas)) return null;
    // for...of y no .map: regla del proyecto.
    const lugares = [];
    for (const fila of filas) {
      lugares.push({
        id: fila.id,
        title: fila.title,
        description: fila.description || '',
        imageUri: fila.image_uri,
        latitude: fila.latitude,
        longitude: fila.longitude,
        createdAt: fila.created_at,
      });
    }
    return lugares;
  } catch {
    return null;
  }
}

/**
 * Guarda un lugar en la tabla "places". Si falla, devuelve false y no lanza error.
 * @param {string} username - Dueño del lugar.
 * @param {object} lugar - Lugar ya guardado en local (id, title, description, imageUri, latitude, longitude, createdAt).
 * @returns {Promise<boolean>} true si Supabase lo guardó.
 */
export async function guardarLugarRemoto(username, lugar) {
  if (!estaConfigurado()) return false;
  try {
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/places`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({
        id: lugar.id,
        username,
        title: lugar.title,
        description: lugar.description,
        image_uri: lugar.imageUri,
        latitude: lugar.latitude,
        longitude: lugar.longitude,
        created_at: lugar.createdAt,
      }),
    });
    return respuesta.ok;
  } catch {
    // Sin internet o Supabase caído: el lugar ya está a salvo en AsyncStorage.
    return false;
  }
}

/**
 * Borra un lugar de la tabla "places". Si falla, devuelve false y no lanza error.
 * @param {string} username - Dueño del lugar.
 * @param {string} id - Id del lugar.
 * @returns {Promise<boolean>} true si Supabase lo borró.
 */
export async function borrarLugarRemoto(username, id) {
  if (!estaConfigurado()) return false;
  try {
    const filtro = `id=eq.${encodeURIComponent(id)}&username=eq.${encodeURIComponent(username)}`;
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/places?${filtro}`, {
      method: 'DELETE',
      headers: cabeceras(),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}
