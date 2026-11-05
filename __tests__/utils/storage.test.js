/**
 * ARCHIVO: __tests__/utils/storage.test.js
 * QUÉ HACE: prueba guardar, leer y borrar usuarios, sesión y lugares en AsyncStorage,
 *           los datos corruptos o ausentes, el aislamiento entre usuarios y el borrado de fotos.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/utils/storage.js, AsyncStorage (mock oficial, en jest.setup.js), expo-file-system (mock).
 * CONCEPTOS CLAVE: AsyncStorage, JSON, mocks, jest.spyOn, aislamiento de datos.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import {
  CLAVES,
  claveLugares,
  leerUsuarios,
  guardarUsuarios,
  leerSesion,
  guardarSesion,
  borrarSesion,
  leerLugares,
  guardarLugares,
  generarId,
  copiarImagenADocumentos,
  borrarImagenLugar,
  agregarLugar,
  borrarLugar,
} from '../../src/utils/storage';

// Datos de ejemplo para no repetir objetos en cada test.
const datosLugar = (titulo) => ({
  title: titulo,
  description: 'Un lugar de prueba',
  imageUri: 'file:///cache/foto.jpg',
  latitude: -31.9,
  longitude: -63.1,
});

describe('claves de AsyncStorage', () => {
  test('cada usuario tiene su propia clave de lugares', () => {
    expect(claveLugares('juan')).toBe('@places_juan');
    expect(claveLugares('maria')).toBe('@places_maria');
    expect(CLAVES.USUARIOS).toBe('@users');
    expect(CLAVES.SESION).toBe('@session');
  });
});

describe('usuarios', () => {
  test('guarda y lee la lista de usuarios', async () => {
    const usuarios = [{ username: 'juan', passwordHash: 'hash-1' }];
    await guardarUsuarios(usuarios);
    await expect(leerUsuarios()).resolves.toEqual(usuarios);
  });

  test('devuelve lista vacía si no hay usuarios guardados', async () => {
    await expect(leerUsuarios()).resolves.toEqual([]);
  });

  test('devuelve lista vacía si el JSON guardado está roto', async () => {
    await AsyncStorage.setItem(CLAVES.USUARIOS, '{roto');
    await expect(leerUsuarios()).resolves.toEqual([]);
  });

  test('devuelve lista vacía si lo guardado no es una lista', async () => {
    await AsyncStorage.setItem(CLAVES.USUARIOS, '{"a":1}');
    await expect(leerUsuarios()).resolves.toEqual([]);
  });
});

describe('sesión', () => {
  test('sin sesión guardada, leerSesion devuelve null', async () => {
    await expect(leerSesion()).resolves.toBeNull();
  });

  test('guarda y lee el usuario de la sesión', async () => {
    await guardarSesion('juan');
    await expect(leerSesion()).resolves.toBe('juan');
  });

  test('borrarSesion deja la sesión vacía', async () => {
    await guardarSesion('juan');
    await borrarSesion();
    await expect(leerSesion()).resolves.toBeNull();
  });

  test('si el storage falla, leerSesion devuelve null sin romper', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('falla'));
    await expect(leerSesion()).resolves.toBeNull();
  });
});

describe('lugares', () => {
  test('guarda y lee la lista de lugares de un usuario', async () => {
    const lugares = [{ id: '1', title: 'Plaza' }];
    await guardarLugares('juan', lugares);
    await expect(leerLugares('juan')).resolves.toEqual(lugares);
  });

  test('devuelve lista vacía si no hay lugares', async () => {
    await expect(leerLugares('juan')).resolves.toEqual([]);
  });

  test('devuelve lista vacía si los lugares guardados están corruptos', async () => {
    await AsyncStorage.setItem('@places_juan', 'no es json');
    await expect(leerLugares('juan')).resolves.toEqual([]);
  });

  test('agregarLugar guarda el lugar con id, fecha y foto permanente', async () => {
    const lugar = await agregarLugar('juan', datosLugar('Plaza'));
    expect(lugar.id).toMatch(/^\d+$/);
    expect(lugar.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // La foto ya no es la temporal: quedó dentro de documentDirectory.
    expect(lugar.imageUri).toMatch(/^file:\/\/\/documents\/lugar-\d+\.jpg$/);
    await expect(leerLugares('juan')).resolves.toEqual([lugar]);
  });

  test('los lugares de dos usuarios no se mezclan', async () => {
    await agregarLugar('juan', datosLugar('Plaza de Juan'));
    await agregarLugar('maria', datosLugar('Cafe de Maria'));

    const deJuan = await leerLugares('juan');
    const deMaria = await leerLugares('maria');
    expect(deJuan).toHaveLength(1);
    expect(deJuan[0].title).toBe('Plaza de Juan');
    expect(deMaria).toHaveLength(1);
    expect(deMaria[0].title).toBe('Cafe de Maria');
  });

  test('borrarLugar saca el lugar y borra su foto', async () => {
    const lugar = await agregarLugar('juan', datosLugar('Plaza'));
    File.prototype.delete.mockClear();

    await expect(borrarLugar('juan', lugar.id)).resolves.toBe(true);
    await expect(leerLugares('juan')).resolves.toEqual([]);
    expect(File.prototype.delete).toHaveBeenCalledTimes(1);
  });

  test('borrarLugar devuelve false si el id no existe', async () => {
    await expect(borrarLugar('juan', 'no-existe')).resolves.toBe(false);
  });

  test('borrarLugar no toca los lugares de otro usuario', async () => {
    const lugarDeJuan = await agregarLugar('juan', datosLugar('Plaza'));
    await agregarLugar('maria', datosLugar('Cafe'));

    await borrarLugar('maria', lugarDeJuan.id);
    await expect(leerLugares('juan')).resolves.toHaveLength(1);
  });
});

describe('imágenes', () => {
  test('generarId devuelve la hora en milisegundos como texto', () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1234);
    expect(generarId()).toBe('1234');
  });

  test('copiarImagenADocumentos devuelve una URI dentro de documentDirectory', async () => {
    const uri = await copiarImagenADocumentos('file:///cache/foto.jpg');
    expect(uri).toMatch(/^file:\/\/\/documents\/lugar-\d+\.jpg$/);
  });

  test('borrarImagenLugar no hace nada si no hay URI', () => {
    File.prototype.delete.mockClear();
    borrarImagenLugar(undefined);
    expect(File.prototype.delete).not.toHaveBeenCalled();
  });

  test('borrarImagenLugar no borra si el archivo ya no existe', () => {
    File.prototype.delete.mockClear();
    borrarImagenLugar('file:///documents/inexistente.jpg');
    expect(File.prototype.delete).not.toHaveBeenCalled();
  });
});
