/**
 * ARCHIVO: __tests__/components/EstadoPantalla.test.js
 * QUÉ HACE: prueba que EstadoPantalla muestre título, mensaje, spinner y el tono de error.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/components/EstadoPantalla.js, src/utils/theme.js, @testing-library/react-native.
 * CONCEPTOS CLAVE: render, toHaveStyle, estados de pantalla (loading, vacío, error).
 */
import { render, screen } from '@testing-library/react-native';
import { EstadoPantalla } from '../../src/components/EstadoPantalla';
import { theme } from '../../src/utils/theme';

describe('EstadoPantalla', () => {
  test('muestra el título y el mensaje', async () => {
    await render(
      <EstadoPantalla titulo="Todavía no agregaste lugares" mensaje="Tocá el mapa para empezar" />,
    );

    expect(screen.getByText('Todavía no agregaste lugares')).toBeTruthy();
    expect(screen.getByText('Tocá el mapa para empezar')).toBeTruthy();
  });

  test('sin mensaje muestra solo el título', async () => {
    await render(<EstadoPantalla titulo="Cargando" />);

    expect(screen.getByText('Cargando')).toBeTruthy();
    expect(screen.queryByText('Tocá el mapa para empezar')).toBeNull();
  });

  test('con tono error pinta el título de rojo', async () => {
    await render(<EstadoPantalla titulo="No se pudo cargar" tono="error" />);

    expect(screen.getByText('No se pudo cargar')).toHaveStyle({ color: theme.colors.error });
  });

  test('con tono neutro el título usa el color de texto', async () => {
    await render(<EstadoPantalla titulo="Listo" />);

    expect(screen.getByText('Listo')).toHaveStyle({ color: theme.colors.texto });
  });

  test('con cargando=true muestra el spinner', async () => {
    await render(<EstadoPantalla titulo="Buscando tu ubicación" cargando />);

    expect(screen.getByTestId('spinner-estado')).toBeTruthy();
  });
});
