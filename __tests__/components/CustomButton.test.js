/**
 * ARCHIVO: __tests__/components/CustomButton.test.js
 * QUÉ HACE: prueba que CustomButton muestre el texto, dispare onPress, respete disabled y loading,
 *           y aplique la variante contorno.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/components/CustomButton.js, @testing-library/react-native.
 * CONCEPTOS CLAVE: await fireEvent.press, estados disabled y busy, accesibilidad del botón.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CustomButton } from '../../src/components/CustomButton';

describe('CustomButton', () => {
  test('muestra el título y dispara onPress al tocar', async () => {
    const alTocar = jest.fn();
    await render(<CustomButton title="Entrar" onPress={alTocar} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(alTocar).toHaveBeenCalledTimes(1);
  });

  test('si está deshabilitado no dispara onPress', async () => {
    const alTocar = jest.fn();
    await render(<CustomButton title="Entrar" onPress={alTocar} disabled />);

    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(alTocar).not.toHaveBeenCalled();
  });

  test('mientras carga no muestra el texto, marca busy y no dispara onPress', async () => {
    const alTocar = jest.fn();
    await render(<CustomButton title="Guardar" onPress={alTocar} loading />);

    expect(screen.queryByText('Guardar')).toBeNull();
    const boton = screen.getByRole('button', { busy: true });
    expect(boton.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(boton);
    expect(alTocar).not.toHaveBeenCalled();
  });

  test('sin loading ni disabled muestra el texto y el estado habilitado', async () => {
    await render(<CustomButton title="Guardar" onPress={() => {}} />);

    const boton = screen.getByRole('button', { name: 'Guardar' });
    expect(boton.props.accessibilityState.disabled).toBe(false);
    expect(boton.props.accessibilityState.busy).toBe(false);
  });

  test('la variante contorno también muestra el texto y dispara onPress', async () => {
    const alTocar = jest.fn();
    await render(
      <CustomButton title="Cancelar" variante="contorno" onPress={alTocar} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(alTocar).toHaveBeenCalledTimes(1);
  });
});
