/**
 * ARCHIVO: __tests__/utils/validations.test.js
 * QUÉ HACE: prueba cada regla de src/utils/validations.js con casos válidos, inválidos y límites.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/utils/validations.js.
 * CONCEPTOS CLAVE: test.each con tablas, casos límite (min/max), funciones puras.
 */
import {
  validarObligatorio,
  validarUsuario,
  validarUsuarioNoExiste,
  validarContrasenia,
  validarConfirmacion,
  validarTituloLugar,
  validarDescripcionLugar,
  validarImagenLugar,
  validarLatitud,
  validarLongitud,
  validarLugarDuplicado,
} from '../../src/utils/validations';

// Texto de un largo exacto, para probar los límites sin escribir strings enormes a mano.
const largo = (cantidad, relleno = 'a') => relleno.repeat(cantidad);

describe('validarObligatorio', () => {
  test.each([
    ['', 'Falta'],
    ['   ', 'Falta'],
    [undefined, 'Falta'],
    ['x', null],
    ['  hola  ', null],
  ])('validarObligatorio(%p) devuelve %p', (valor, esperado) => {
    expect(validarObligatorio(valor, 'Falta')).toBe(esperado);
  });
});

describe('validarUsuario', () => {
  test.each([
    ['juan', null],
    ['  juan  ', null],
    [largo(4), null],
    [largo(20), null],
    ['abc1', null],
  ])('acepta %p', (valor, esperado) => {
    expect(validarUsuario(valor)).toBe(esperado);
  });

  test.each([
    ['', 'Ingresá un usuario.'],
    ['   ', 'Ingresá un usuario.'],
    [undefined, 'Ingresá un usuario.'],
    ['ju an', 'El usuario no puede tener espacios.'],
    ['juan!', 'El usuario solo puede tener letras y números.'],
    ['abc', 'El usuario debe tener entre 4 y 20 caracteres.'],
    [largo(21), 'El usuario debe tener entre 4 y 20 caracteres.'],
    ['1234', 'El usuario no puede ser solo números.'],
    ['1juan', 'El usuario no puede empezar con un número.'],
    ['admin', 'Ese usuario no está permitido.'],
    ['ROOT', 'Ese usuario no está permitido.'],
    ['Test', 'Ese usuario no está permitido.'],
  ])('rechaza %p con el mensaje correcto', (valor, esperado) => {
    expect(validarUsuario(valor)).toBe(esperado);
  });
});

describe('validarUsuarioNoExiste', () => {
  test('devuelve error si el usuario ya existe, sin importar mayúsculas', () => {
    expect(validarUsuarioNoExiste('JUAN', ['juan', 'maria'])).toBe('Ese usuario ya existe.');
  });

  test('devuelve null si el usuario es nuevo', () => {
    expect(validarUsuarioNoExiste('pedro', ['juan', 'maria'])).toBeNull();
  });

  test('devuelve null si todavía no hay usuarios', () => {
    expect(validarUsuarioNoExiste('pedro', [])).toBeNull();
  });
});

describe('validarContrasenia', () => {
  test.each([
    ['Abcde1'], // límite inferior: 6 caracteres
    ['Clave2026'],
    ['Aa1' + largo(29, 'b')], // límite superior: 32 caracteres
  ])('acepta %p', (valor) => {
    expect(validarContrasenia(valor, 'juan')).toBeNull();
  });

  test.each([
    ['', 'Ingresá una contraseña.'],
    ['Ab 1cd', 'La contraseña no puede tener espacios.'],
    ['Ab1cd', 'La contraseña debe tener al menos 6 caracteres.'],
    ['Aa1' + largo(30, 'b'), 'La contraseña no puede tener más de 32 caracteres.'], // 33 caracteres
    ['abcdef1', 'La contraseña debe tener al menos una mayúscula.'],
    ['ABCDEF1', 'La contraseña debe tener al menos una minúscula.'],
    ['Abcdefg', 'La contraseña debe tener al menos un número.'],
    ['Password1', 'Esa contraseña es muy común.'],
  ])('rechaza %p con el mensaje correcto', (valor, esperado) => {
    expect(validarContrasenia(valor, 'pedro')).toBe(esperado);
  });

  test('rechaza la contraseña igual al usuario, sin importar mayúsculas', () => {
    expect(validarContrasenia('Juan1234', 'juan1234')).toBe(
      'La contraseña no puede ser igual al usuario.',
    );
  });

  test('no compara con el usuario si no se pasa', () => {
    expect(validarContrasenia('Abcdef1')).toBeNull();
  });
});

describe('validarConfirmacion', () => {
  test.each([
    ['Abcdef1', 'Abcdef1', null],
    ['Abcdef1', '', 'Repetí la contraseña.'],
    ['Abcdef1', undefined, 'Repetí la contraseña.'],
    ['Abcdef1', 'Abcdef2', 'Las contraseñas no coinciden.'],
  ])('clave %p, confirmación %p -> %p', (clave, confirmacion, esperado) => {
    expect(validarConfirmacion(clave, confirmacion)).toBe(esperado);
  });
});

describe('validarTituloLugar', () => {
  test.each([
    ['abc', null], // límite inferior: 3
    [largo(50), null], // límite superior: 50
    ['  abc  ', null],
  ])('acepta %p', (valor, esperado) => {
    expect(validarTituloLugar(valor)).toBe(esperado);
  });

  test.each([
    ['', 'Ingresá un título.'],
    ['  ab  ', 'El título debe tener entre 3 y 50 caracteres.'],
    [largo(51), 'El título debe tener entre 3 y 50 caracteres.'],
  ])('rechaza %p con el mensaje correcto', (valor, esperado) => {
    expect(validarTituloLugar(valor)).toBe(esperado);
  });
});

describe('validarDescripcionLugar', () => {
  test.each([
    [undefined, null], // opcional
    ['', null],
    [largo(200), null], // límite: 200
  ])('acepta %p', (valor, esperado) => {
    expect(validarDescripcionLugar(valor)).toBe(esperado);
  });

  test('rechaza más de 200 caracteres', () => {
    expect(validarDescripcionLugar(largo(201))).toBe(
      'La descripción no puede tener más de 200 caracteres.',
    );
  });
});

describe('validarImagenLugar', () => {
  test('pide una imagen si la URI está vacía', () => {
    expect(validarImagenLugar('')).toBe('Elegí una imagen para el lugar.');
    expect(validarImagenLugar(undefined)).toBe('Elegí una imagen para el lugar.');
  });

  test('acepta una URI con contenido', () => {
    expect(validarImagenLugar('file:///cache/foto.jpg')).toBeNull();
  });
});

describe('validarLatitud', () => {
  test.each([
    [-90, null], // límite inferior
    [90, null], // límite superior
    [-31.8722, null],
  ])('acepta %p', (valor, esperado) => {
    expect(validarLatitud(valor)).toBe(esperado);
  });

  test.each([
    [90.1, 'La latitud debe estar entre -90 y 90.'],
    [-90.1, 'La latitud debe estar entre -90 y 90.'],
    [NaN, 'La latitud no es válida.'],
    ['10', 'La latitud no es válida.'],
  ])('rechaza %p', (valor, esperado) => {
    expect(validarLatitud(valor)).toBe(esperado);
  });
});

describe('validarLongitud', () => {
  test.each([
    [-180, null],
    [180, null],
    [-62.7194, null],
  ])('acepta %p', (valor, esperado) => {
    expect(validarLongitud(valor)).toBe(esperado);
  });

  test.each([
    [180.5, 'La longitud debe estar entre -180 y 180.'],
    [-180.5, 'La longitud debe estar entre -180 y 180.'],
    [Infinity, 'La longitud no es válida.'],
    [null, 'La longitud no es válida.'],
  ])('rechaza %p', (valor, esperado) => {
    expect(validarLongitud(valor)).toBe(esperado);
  });
});

describe('validarLugarDuplicado', () => {
  const lugares = [{ title: 'Plaza', latitude: -31.9, longitude: -63.1 }];

  test('detecta mismo título (sin importar mayúsculas y espacios) y mismas coordenadas', () => {
    expect(validarLugarDuplicado('  plaza ', -31.9, -63.1, lugares)).toBe(
      'Ya existe un lugar con ese título en esas coordenadas.',
    );
  });

  test('permite mismo título en otras coordenadas', () => {
    expect(validarLugarDuplicado('Plaza', -31.8, -63.1, lugares)).toBeNull();
  });

  test('permite otro título en las mismas coordenadas', () => {
    expect(validarLugarDuplicado('Cafe', -31.9, -63.1, lugares)).toBeNull();
  });

  test('no hay duplicados si la lista está vacía', () => {
    expect(validarLugarDuplicado('Plaza', -31.9, -63.1, [])).toBeNull();
  });
});
