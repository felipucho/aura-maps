/**
 * ARCHIVO: __tests__/utils/theme.test.js
 * QUÉ HACE: revisa que los design tokens tengan la escala pedida (espacios 4/8/12/16/24/32).
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/utils/theme.js.
 * CONCEPTOS CLAVE: design tokens, escala de espacios.
 */
import { theme } from '../../src/utils/theme';

describe('theme', () => {
  test('la escala de espacios es 4, 8, 12, 16, 24 y 32', () => {
    expect(Object.values(theme.spacing)).toEqual([4, 8, 12, 16, 24, 32]);
  });

  test('tiene los colores principales del proyecto', () => {
    expect(theme.colors).toEqual(
      expect.objectContaining({
        primario: expect.any(String),
        secundario: expect.any(String),
        fondo: expect.any(String),
        superficie: expect.any(String),
        texto: expect.any(String),
        textoSecundario: expect.any(String),
        error: expect.any(String),
        exito: expect.any(String),
      }),
    );
  });

  test('el área táctil mínima es de 44', () => {
    expect(theme.tamanioTactil).toBe(44);
  });
});
