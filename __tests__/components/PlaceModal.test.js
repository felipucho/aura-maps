/**
 * ARCHIVO: __tests__/components/PlaceModal.test.js
 * QUÉ HACE: prueba el formulario de lugares: bloquea el guardado con datos inválidos, llama a
 *           onGuardar con datos válidos, maneja permisos de galería y cámara rechazados, duplicados,
 *           contador de descripción, errores que se limpian y el reset al abrir.
 * LO USA: Jest (npm test).
 * DEPENDE DE: src/components/PlaceModal.js, expo-image-picker (mock en jest.setup.js).
 * CONCEPTOS CLAVE: fireEvent, waitFor, act, rerender, mocks de permisos, validación en onBlur y al enviar.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { PlaceModal } from '../../src/components/PlaceModal';

const COORDENADA = { latitude: -31.9, longitude: -63.1 };

/**
 * Renderiza el modal con valores por defecto, para no repetir props en cada test.
 * @param {object} [props] - Props que se quieren cambiar.
 * @returns {Promise<object>} Resultado de render (incluye rerender).
 */
async function renderizarModal(props = {}) {
  return render(
    <PlaceModal
      visible
      coordenada={COORDENADA}
      lugaresExistentes={[]}
      onCerrar={jest.fn()}
      onGuardar={jest.fn()}
      {...props}
    />,
  );
}

/**
 * Carga una imagen con el botón Galería y espera a que aparezca la vista previa.
 * @returns {Promise<void>}
 */
async function elegirImagenDeGaleria() {
  await act(async () => {
    await fireEvent.press(screen.getByLabelText('Galería'));
  });
  await screen.findByLabelText('Vista previa de la imagen del lugar');
}

describe('PlaceModal: validaciones al guardar', () => {
  test('con el formulario vacío muestra errores y deshabilita el botón de guardar', async () => {
    const alGuardar = jest.fn();
    await renderizarModal({ onGuardar: alGuardar });

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Guardar lugar'));
    });

    expect(screen.getByText('Ingresá un título.')).toBeTruthy();
    expect(screen.getByText('Elegí una imagen para el lugar.')).toBeTruthy();
    expect(screen.getByLabelText('Guardar lugar').props.accessibilityState.disabled).toBe(true);
    expect(alGuardar).not.toHaveBeenCalled();
  });

  test('sin coordenada muestra el error del mapa', async () => {
    await renderizarModal({ coordenada: null });

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Guardar lugar'));
    });

    expect(screen.getByText('Elegí un punto en el mapa.')).toBeTruthy();
  });

  test('con latitud fuera de rango muestra el error de latitud', async () => {
    await renderizarModal({ coordenada: { latitude: 100, longitude: 0 } });
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Plaza');
    await elegirImagenDeGaleria();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Guardar lugar'));
    });

    expect(screen.getByText('La latitud debe estar entre -90 y 90.')).toBeTruthy();
  });

  test('el error del título aparece al salir del campo (onBlur)', async () => {
    await renderizarModal();

    await fireEvent.changeText(screen.getByLabelText('Título'), 'ab');
    await fireEvent(screen.getByLabelText('Título'), 'blur');

    expect(screen.getByText('El título debe tener entre 3 y 50 caracteres.')).toBeTruthy();
  });

  test('al empezar a corregir, el error del título se limpia', async () => {
    await renderizarModal();
    await fireEvent.changeText(screen.getByLabelText('Título'), 'ab');
    await fireEvent(screen.getByLabelText('Título'), 'blur');

    await fireEvent.changeText(screen.getByLabelText('Título'), 'abc');

    expect(screen.queryByText('El título debe tener entre 3 y 50 caracteres.')).toBeNull();
  });

  test('una descripción de más de 200 caracteres muestra error y contador', async () => {
    await renderizarModal();
    const largo = 'a'.repeat(201);

    await fireEvent.changeText(screen.getByLabelText('Descripción (opcional)'), largo);
    await fireEvent(screen.getByLabelText('Descripción (opcional)'), 'blur');

    expect(screen.getByText('La descripción no puede tener más de 200 caracteres.')).toBeTruthy();
    expect(screen.getByText('201/200')).toBeTruthy();
  });

  test('no permite guardar un lugar con mismo título y coordenadas de otro existente', async () => {
    const alGuardar = jest.fn();
    await renderizarModal({
      onGuardar: alGuardar,
      lugaresExistentes: [{ title: 'Plaza', latitude: -31.9, longitude: -63.1 }],
    });
    await fireEvent.changeText(screen.getByLabelText('Título'), 'plaza');
    await elegirImagenDeGaleria();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Guardar lugar'));
    });

    expect(screen.getByText('Ya existe un lugar con ese título en esas coordenadas.')).toBeTruthy();
    expect(alGuardar).not.toHaveBeenCalled();
  });
});

describe('PlaceModal: guardado válido', () => {
  test('con datos válidos llama a onGuardar con el título sin espacios y la imagen', async () => {
    const alGuardar = jest.fn();
    await renderizarModal({ onGuardar: alGuardar });
    await fireEvent.changeText(screen.getByLabelText('Título'), '  Plaza San Martín  ');
    await elegirImagenDeGaleria();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Guardar lugar'));
    });

    await waitFor(() => expect(alGuardar).toHaveBeenCalledTimes(1));
    expect(alGuardar).toHaveBeenCalledWith({
      title: 'Plaza San Martín',
      description: '',
      imageUri: 'file:///cache/foto-temporal.jpg',
      latitude: -31.9,
      longitude: -63.1,
    });
  });

  test('si onGuardar falla muestra un mensaje y no rompe la pantalla', async () => {
    const alGuardar = jest.fn().mockRejectedValueOnce(new Error('disco lleno'));
    await renderizarModal({ onGuardar: alGuardar });
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Plaza');
    await elegirImagenDeGaleria();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Guardar lugar'));
    });

    expect(await screen.findByText('No se pudo guardar el lugar. Probá de nuevo.')).toBeTruthy();
  });

  test('el botón Cancelar llama a onCerrar', async () => {
    const alCerrar = jest.fn();
    await renderizarModal({ onCerrar: alCerrar });

    await fireEvent.press(screen.getByLabelText('Cancelar'));

    expect(alCerrar).toHaveBeenCalledTimes(1);
  });
});

describe('PlaceModal: imagen y permisos', () => {
  test('elegir foto de galería muestra la vista previa', async () => {
    await renderizarModal();

    await elegirImagenDeGaleria();

    expect(screen.getByLabelText('Vista previa de la imagen del lugar')).toBeTruthy();
  });

  test('si el usuario cancela el selector de galería no pasa nada', async () => {
    await renderizarModal();
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: null });

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Galería'));
    });

    expect(screen.queryByLabelText('Vista previa de la imagen del lugar')).toBeNull();
  });

  test('si rechaza el permiso de galería muestra un mensaje y no abre el selector', async () => {
    await renderizarModal();
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Galería'));
    });

    expect(
      await screen.findByText(
        'Sin permiso para la galería. Habilitalo en Ajustes para elegir una foto.',
      ),
    ).toBeTruthy();
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  test('sacar una foto con la cámara muestra la vista previa', async () => {
    await renderizarModal();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Cámara'));
    });

    expect(await screen.findByLabelText('Vista previa de la imagen del lugar')).toBeTruthy();
  });

  test('si rechaza el permiso de cámara muestra un mensaje', async () => {
    await renderizarModal();
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Cámara'));
    });

    expect(
      await screen.findByText('Sin permiso para la cámara. Habilitalo en Ajustes para sacar una foto.'),
    ).toBeTruthy();
  });

  test('si cancela la cámara no cambia la imagen', async () => {
    await renderizarModal();
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({ canceled: true, assets: null });

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Cámara'));
    });

    expect(screen.queryByLabelText('Vista previa de la imagen del lugar')).toBeNull();
  });
});

describe('PlaceModal: ciclo de vida', () => {
  test('al cancelar, el formulario queda vacío para la próxima vez', async () => {
    const alCerrar = jest.fn();
    await renderizarModal({ onCerrar: alCerrar });
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Plaza vieja');

    await fireEvent.press(screen.getByLabelText('Cancelar'));

    expect(alCerrar).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Título').props.value).toBe('');
  });
});
