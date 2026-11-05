/**
 * ARCHIVO: __tests__/components/CustomInput.test.js
 * QUÉ HACE: prueba que CustomInput muestre label y error, que avise los cambios y que
 *           reenvíe onBlur al padre.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/components/CustomInput.js, @testing-library/react-native.
 * CONCEPTOS CLAVE: render, screen, fireEvent, createRef (forwardRef), accesibilidad.
 */
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CustomInput } from '../../src/components/CustomInput';

describe('CustomInput', () => {
  test('muestra el label y el mensaje de error', async () => {
    await render(<CustomInput label="Usuario" error="Ingresá un usuario." />);

    expect(screen.getByText('Usuario')).toBeTruthy();
    expect(screen.getByText('Ingresá un usuario.')).toBeTruthy();
  });

  test('sin error no muestra ningún mensaje de alerta', async () => {
    await render(<CustomInput label="Usuario" />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('avisa cada cambio de texto al padre', async () => {
    const alCambiar = jest.fn();
    await render(<CustomInput label="Usuario" value="" onChangeText={alCambiar} />);

    await fireEvent.changeText(screen.getByLabelText('Usuario'), 'juan');

    expect(alCambiar).toHaveBeenCalledWith('juan');
  });

  test('reenvía onBlur al padre (para validar al salir del campo)', async () => {
    const alSalir = jest.fn();
    await render(<CustomInput label="Usuario" onBlur={alSalir} />);

    await fireEvent(screen.getByLabelText('Usuario'), 'blur');

    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  test('reenvía onFocus al padre al enfocar', async () => {
    const alEntrar = jest.fn();
    await render(<CustomInput label="Usuario" onFocus={alEntrar} />);

    await fireEvent(screen.getByLabelText('Usuario'), 'focus');

    expect(alEntrar).toHaveBeenCalledTimes(1);
  });

  test('reenvía la ref al TextInput para poder enfocarlo desde afuera', async () => {
    const ref = createRef();
    await render(<CustomInput ref={ref} label="Usuario" />);

    expect(ref.current).not.toBeNull();
  });
});
