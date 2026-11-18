/**
 * ARCHIVO: src/utils/storage.js
 * QUÉ HACE: único lugar que lee y escribe AsyncStorage y las imágenes del celular.
 *           Guarda usuarios, sesión y lugares, con todas las claves centralizadas acá.
 * LO USA: AuthContext (usuarios y sesión), MapScreen, PlacesScreen, ProfileScreen.
 * DEPENDE DE: @react-native-async-storage/async-storage.
 * CONCEPTOS CLAVE: AsyncStorage (clave-valor, texto), JSON.stringify/parse,
 *                  aislamiento de datos por usuario. (Versión Snack: sin expo-file-system.)
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  borrarFotoLugar,
  borrarLugarRemoto,
  esFotoRemota,
  guardarLugarRemoto,
  leerLugaresRemotos,
  subirFotoLugar,
} from './supabase';

// VERSIÓN SNACK: expo-file-system no existe en el preview web. Se carga con require solo en
// celular, así en web nunca se evalúa y no rompe.
// Si Snack no lo resuelve (no está en Dependencies), queda en null y la app igual abre.
function cargarFileSystem() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-file-system');
  } catch {
    return null;
  }
}
const FileSystem = cargarFileSystem();

// Claves de AsyncStorage. Están acá para que no haya strings sueltos en el resto de la app.
export const CLAVES = {
  USUARIOS: '@users',
  SESION: '@session',
};

/**
 * Arma la clave de los lugares de un usuario. Cada usuario tiene la suya:
 * así los lugares de dos personas nunca se mezclan.
 * @param {string} username - Usuario dueño de los lugares.
 * @returns {string} Clave, por ejemplo "@places_juan".
 */
export function claveLugares(username) {
  return `@places_${username}`;
}

/**
 * Lee una lista guardada como JSON. Si no existe o está rota, devuelve [].
 * Así un dato dañado no tumba la app: la persona ve una lista vacía.
 * @param {string} clave - Clave de AsyncStorage.
 * @returns {Promise<Array>} Lista guardada o [].
 */
async function leerLista(clave) {
  try {
    const crudo = await AsyncStorage.getItem(clave);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    // Si lo guardado no es una lista (dato corrupto), lo tratamos como vacío.
    return Array.isArray(datos) ? datos : [];
  } catch {
    // JSON inválido o error del storage: devolvemos vacío en vez de romper la pantalla.
    return [];
  }
}

/**
 * Guarda una lista como JSON. Siempre reemplaza la lista completa.
 * @param {string} clave - Clave de AsyncStorage.
 * @param {Array} lista - Datos a guardar.
 * @returns {Promise<void>}
 */
async function guardarLista(clave, lista) {
  // AsyncStorage solo guarda texto, por eso pasamos la lista a JSON.
  await AsyncStorage.setItem(clave, JSON.stringify(lista));
}

/**
 * Devuelve todos los usuarios registrados.
 * @returns {Promise<Array<{username: string, passwordHash: string}>>} Usuarios o [].
 */
export function leerUsuarios() {
  return leerLista(CLAVES.USUARIOS);
}

/**
 * Reemplaza la lista completa de usuarios.
 * @param {Array<{username: string, passwordHash: string}>} usuarios - Lista nueva.
 * @returns {Promise<void>}
 */
export function guardarUsuarios(usuarios) {
  return guardarLista(CLAVES.USUARIOS, usuarios);
}

/**
 * Lee el usuario de la sesión activa. Si nadie inició sesión, devuelve null.
 * @returns {Promise<string|null>} Nombre de usuario o null.
 */
export async function leerSesion() {
  try {
    const usuario = await AsyncStorage.getItem(CLAVES.SESION);
    return usuario || null;
  } catch {
    return null;
  }
}

/**
 * Guarda la sesión. Mientras esté guardada, la app abre directo sin pedir login.
 * @param {string} username - Usuario que inició sesión.
 * @returns {Promise<void>}
 */
export function guardarSesion(username) {
  return AsyncStorage.setItem(CLAVES.SESION, username);
}

/**
 * Borra la sesión (logout). Al borrarla, la próxima vez hay que volver a iniciar sesión.
 * @returns {Promise<void>}
 */
export function borrarSesion() {
  return AsyncStorage.removeItem(CLAVES.SESION);
}

/**
 * Devuelve los lugares de un usuario.
 * @param {string} username - Dueño de los lugares.
 * @returns {Promise<Array>} Lugares guardados o [].
 */
export async function leerLugares(username) {
  const locales = await leerLista(claveLugares(username));
  // Supabase manda: así los lugares vuelven aunque se borre el storage o cambies de celular.
  // Sin internet (null), se usa la copia local.
  const remotos = await leerLugaresRemotos(username);
  if (!remotos) return locales;
  // Sumamos los locales que todavía no llegaron a Supabase, para no perder ninguno.
  const ids = new Set();
  for (const lugar of remotos) ids.add(lugar.id);
  const combinados = [...remotos];
  for (const lugar of locales) {
    if (!ids.has(lugar.id)) combinados.push(lugar);
  }
  await guardarLista(claveLugares(username), combinados);
  return combinados;
}

/**
 * Reemplaza la lista de lugares de un usuario.
 * @param {string} username - Dueño de los lugares.
 * @param {Array} lugares - Lista nueva.
 * @returns {Promise<void>}
 */
export function guardarLugares(username, lugares) {
  return guardarLista(claveLugares(username), lugares);
}

/**
 * Genera un id único para un lugar. Usamos la hora en milisegundos, como pide el proyecto.
 * @returns {string} Id, por ejemplo "1730800000000".
 */
export function generarId() {
  return Date.now().toString();
}

/**
 * Copia la foto a la carpeta de documentos de la app.
 * POR QUÉ: la URI que da el image picker es temporal (cache). El sistema la puede borrar
 * y el marcador perdería la foto. La carpeta de documentos no se borra sola, así la foto
 * sobrevive a reiniciar la app.
 * VERSIÓN SNACK: en celular copia con expo-file-system (File y Paths). En web no hay
 * file system y se devuelve la misma URI.
 * @param {string} uriTemporal - URI de la foto elegida en galería o cámara.
 * @returns {Promise<string>} URI permanente (celular) o la misma URI (web).
 */
export async function copiarImagenADocumentos(uriTemporal) {
  if (!FileSystem) return uriTemporal;
  const { File, Paths } = FileSystem;
  const origen = new File(uriTemporal);
  // Nombre único con la hora, así dos fotos nunca pisan el mismo archivo.
  const destino = new File(Paths.document, `lugar-${Date.now()}.jpg`);
  await origen.copy(destino);
  return destino.uri;
}

/**
 * Borra el archivo de imagen de un lugar. Si ya no existe, no hace nada.
 * @param {string} uri - URI de la imagen guardada en documentDirectory.
 * @returns {void}
 */
export function borrarImagenLugar(uri) {
  // VERSIÓN SNACK: en web no hay copia propia que borrar. Las fotos en Supabase se borran aparte.
  if (!uri || !FileSystem || esFotoRemota(uri)) return;
  try {
    const archivo = new FileSystem.File(uri);
    if (archivo.exists) archivo.delete();
  } catch {
    // Si la URI no es un archivo local válido, no hay nada que borrar.
  }
}

/**
 * Crea un lugar nuevo, copia su foto y lo guarda en la lista del usuario.
 * @param {string} username - Dueño del lugar.
 * @param {{title: string, description: string, imageUri: string, latitude: number, longitude: number}} datos - Datos del lugar.
 * @returns {Promise<object>} El lugar guardado, con id, createdAt e imageUri permanente.
 */
export async function agregarLugar(username, datos) {
  // Primero subimos la foto a Supabase Storage: así se ve en cualquier celular y aunque se
  // borre el storage. Si no hay internet, copiamos la foto local como antes.
  const urlPublica = await subirFotoLugar(
    username,
    datos.imageBase64,
    datos.imageType || 'image/jpeg',
    datos.imageUri || '',
  );
  const imagenPermanente = urlPublica || (await copiarImagenADocumentos(datos.imageUri));
  const lugar = {
    id: generarId(),
    title: datos.title,
    description: datos.description,
    imageUri: imagenPermanente,
    latitude: datos.latitude,
    longitude: datos.longitude,
    createdAt: new Date().toISOString(),
  };
  const lugares = await leerLugares(username);
  await guardarLugares(username, [...lugares, lugar]);
  // Copia en Supabase. Si falla, no pasa nada: el lugar ya quedó guardado en local.
  await guardarLugarRemoto(username, lugar);
  return lugar;
}

/**
 * Borra un lugar: primero lo saca de la lista y después borra su foto.
 * POR QUÉ este orden: si falla el guardado de la lista, la foto sigue existiendo
 * y el lugar no queda roto. Borrar la foto primero podría dejar el lugar sin imagen.
 * @param {string} username - Dueño del lugar.
 * @param {string} id - Id del lugar a borrar.
 * @returns {Promise<boolean>} true si se borró, false si no existía.
 */
export async function borrarLugar(username, id) {
  const lugares = await leerLugares(username);
  const lugar = lugares.find((item) => item.id === id);
  if (!lugar) return false;
  await guardarLugares(
    username,
    lugares.filter((item) => item.id !== id),
  );
  borrarImagenLugar(lugar.imageUri);
  await borrarFotoLugar(lugar.imageUri);
  await borrarLugarRemoto(username, id);
  return true;
}
