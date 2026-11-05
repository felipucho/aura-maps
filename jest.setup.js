/**
 * ARCHIVO: jest.setup.js
 * QUÉ HACE: prepara el entorno de los tests. Reemplaza con mocks las librerías nativas
 *           (AsyncStorage, crypto, ubicación, cámara, archivos, mapa) para que corran en Node.
 * LO USA: Jest, por la clave "setupFilesAfterEnv" de package.json.
 * DEPENDE DE: @react-native-async-storage/async-storage (mock oficial), react, react-native.
 * CONCEPTOS CLAVE: jest.mock, mocks, módulos nativos, funciones simuladas (jest.fn).
 */

// AsyncStorage: usamos el mock oficial. Guarda en memoria, así los tests no tocan el disco.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Antes de cada test: vaciamos el storage falso y reiniciamos los contadores de los mocks.
// Así un test no hereda usuarios, sesiones o llamadas de otro test.
beforeEach(async () => {
  const modulo = require('@react-native-async-storage/async-storage');
  // El mock oficial exporta el objeto directo; por eso aceptamos con o sin ".default".
  const AsyncStorage = modulo.default ?? modulo;
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// expo-crypto: el hash real no corre en Node. Usamos un hash falso pero determinístico:
// misma entrada -> misma salida. Sirve para probar la lógica de contraseñas.
jest.mock('expo-crypto', () => {
  /**
   * Hash falso y determinístico. NO es seguro, solo existe para los tests.
   * @param {string} texto - Texto a "hashear".
   * @returns {string} Cadena con prefijo, distinta del texto original.
   */
  function hashFalso(texto) {
    let suma = 0;
    for (const letra of texto) {
      suma = (suma * 31 + letra.charCodeAt(0)) % 1000000007;
    }
    return 'hash-falso-' + suma;
  }
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: jest.fn(async (_algoritmo, texto) => hashFalso(texto)),
  };
});

// expo-location: por defecto el permiso se concede y devolvemos una posición de prueba.
// Cada test puede cambiar el resultado con mockResolvedValueOnce.
jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: -31.9, longitude: -63.1 },
  })),
}));

// expo-image-picker: por defecto el usuario elige una foto y los permisos se conceden.
jest.mock('expo-image-picker', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///cache/foto-temporal.jpg' }],
  })),
  launchCameraAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///cache/foto-camara.jpg' }],
  })),
}));

// expo-file-system (API nueva de SDK 58: File, Directory, Paths).
// Simulamos copiar y borrar sin tocar el disco. Cada método es jest.fn para poder verificarlo.
jest.mock('expo-file-system', () => {
  /**
   * Archivo falso. Guarda la ruta y expone copy/delete simulados.
   * @param {...(string|object)} partes - Ruta por partes (strings) u objeto Directory.
   * @returns {object} Instancia con uri, exists, copy y delete.
   */
  class FileFalso {
    constructor(...partes) {
      this.uri = armarUri(partes);
      // Para los tests: una ruta que contiene "inexistente" simula un archivo que no está.
      this.exists = this.uri.indexOf('inexistente') === -1;
    }
  }
  // copy y delete van en el prototipo para que los tests puedan espiarlos
  // (File.prototype.delete) y verificar que se llamaron.
  FileFalso.prototype.copy = jest.fn(async () => {});
  FileFalso.prototype.delete = jest.fn(() => {});
  class DirectoryFalso {
    constructor(...partes) {
      this.uri = partes.filter((p) => typeof p === 'string').join('/');
    }
  }
  // Mantiene la ruta de un Directory cuando se pasa como primer argumento de File.
  // Usamos for...of para no escribir .map (regla del proyecto).
  function armarUri(partes) {
    const textos = [];
    for (const parte of partes) {
      textos.push(typeof parte === 'string' ? parte : parte.uri);
    }
    return textos.join('/');
  }
  return {
    File: FileFalso,
    Directory: DirectoryFalso,
    Paths: {
      document: { uri: 'file:///documents' },
      cache: { uri: 'file:///cache' },
    },
  };
});

// react-native-maps: no hay mapa real en Node. Lo reemplazamos por View con testID
// para poder encontrar el mapa y los marcadores en los tests.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  /**
   * Mapa falso. Renderiza una View y deja pasar sus hijos.
   * @param {object} props - Props del mapa (region, onLongPress, etc.).
   * @returns {JSX.Element} View con testID "mapa".
   */
  function MapViewFalso(props) {
    return React.createElement(View, { testID: 'mapa' }, props.children);
  }

  /**
   * Marcador falso. Renderiza una View con testID "marcador".
   * @param {object} props - Props del marcador.
   * @returns {JSX.Element} View con testID "marcador".
   */
  function MarkerFalso(props) {
    return React.createElement(View, { testID: 'marcador' }, props.children);
  }

  return {
    __esModule: true,
    default: MapViewFalso,
    Marker: MarkerFalso,
    PROVIDER_GOOGLE: 'google',
  };
});
