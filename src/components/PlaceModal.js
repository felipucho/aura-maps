/**
 * ARCHIVO: src/components/PlaceModal.js
 * QUÉ HACE: formulario en un modal para crear un lugar: título, descripción e imagen (galería o cámara).
 *           Valida al salir de cada campo y al tocar "Guardar", y no deja guardar con errores.
 * LO USA: MapScreen (se abre con long press en el mapa).
 * DEPENDE DE: react, react-native (Modal, FlatList, KeyboardAvoidingView, Image, Text, View),
 *             react-native-safe-area-context, expo-image-picker, src/components/CustomInput.js,
 *             src/components/CustomButton.js, src/utils/theme.js, src/utils/validations.js.
 * CONCEPTOS CLAVE: Modal, KeyboardAvoidingView, useRef y focus(), reset del formulario al cerrar,
 *                  permisos de cámara y galería, validación onBlur y al enviar, FlatList como contenedor.
 */
import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CustomInput } from './CustomInput';
import { CustomButton } from './CustomButton';
import { theme } from '../utils/theme';
import {
  validarTituloLugar,
  validarDescripcionLugar,
  validarImagenLugar,
  validarLatitud,
  validarLongitud,
  validarLugarDuplicado,
} from '../utils/validations';

// Límite de la descripción. Se muestra como contador "n/200" debajo del campo.
const LIMITE_DESCRIPCION = 200;

// Estado sin errores. Se usa para limpiar el formulario al abrir el modal.
const SIN_ERRORES = { titulo: null, descripcion: null, imagen: null, general: null };

/**
 * Dice si hay algún error en el objeto de errores.
 * @param {object} errores - Objeto con un mensaje (o null) por campo.
 * @returns {boolean} true si hay al menos un error.
 */
function hayErrores(errores) {
  return Object.values(errores).some((valor) => valor !== null);
}

/**
 * Devuelve el primer campo con error en orden de lectura (título, descripción).
 * Sirve para mover el foco al lugar donde la persona tiene que corregir.
 * @param {object} errores - Errores actuales.
 * @returns {'titulo'|'descripcion'|null} Nombre del campo o null si ninguno tiene foco.
 */
function primerCampoConError(errores) {
  if (errores.titulo) return 'titulo';
  if (errores.descripcion) return 'descripcion';
  return null;
}

/**
 * Valida la coordenada elegida en el mapa (latitud y longitud dentro de rango).
 * @param {{latitude: number, longitude: number}|null} coordenada - Punto del long press.
 * @returns {string|null} Mensaje de error o null.
 */
function validarCoordenadas(coordenada) {
  if (!coordenada) return 'Elegí un punto en el mapa.';
  return validarLatitud(coordenada.latitude) || validarLongitud(coordenada.longitude);
}

/**
 * Modal para crear un lugar. Cuándo se ejecuta: cada vez que el padre cambia "visible".
 * @param {object} props - Props del modal.
 * @param {boolean} props.visible - Si el modal está abierto.
 * @param {{latitude: number, longitude: number}|null} props.coordenada - Punto elegido con el long press.
 * @param {Array<{title: string, latitude: number, longitude: number}>} [props.lugaresExistentes=[]] - Para evitar duplicados.
 * @param {Function} props.onCerrar - Se llama al cancelar o al tocar afuera (Android: botón atrás).
 * @param {Function} props.onGuardar - Recibe los datos del lugar ya validados. Puede ser async.
 * @returns {JSX.Element} Modal con el formulario.
 */
export function PlaceModal({ visible, coordenada, lugaresExistentes = [], onCerrar, onGuardar }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [errores, setErrores] = useState(SIN_ERRORES);
  const [guardando, setGuardando] = useState(false);

  // Referencias a los inputs, para poder enfocar el primero que tenga error.
  const refTitulo = useRef(null);
  const refDescripcion = useRef(null);

  /**
   * Vacía el formulario. Se llama al cancelar, al cerrar con el botón atrás o después de guardar,
   * así al volver a abrir el modal no queda texto del lugar anterior.
   * POR QUÉ no usamos useEffect: el reset se hace en el momento de cerrar, sin efectos extra.
   * @returns {void}
   */
  function limpiarFormulario() {
    setTitulo('');
    setDescripcion('');
    setImageUri('');
    setErrores(SIN_ERRORES);
    setGuardando(false);
  }

  /**
   * Cierra el modal: limpia el formulario y avisa al padre.
   * @returns {void}
   */
  function cerrar() {
    limpiarFormulario();
    onCerrar();
  }

  /** Valida el título al salir del campo (onBlur). */
  function revisarTitulo() {
    setErrores((previo) => ({ ...previo, titulo: validarTituloLugar(titulo) }));
  }

  /** Valida la descripción al salir del campo (onBlur). */
  function revisarDescripcion() {
    setErrores((previo) => ({ ...previo, descripcion: validarDescripcionLugar(descripcion) }));
  }

  /**
   * Al escribir en el título: guarda el texto y limpia su error y el de duplicado.
   * Los errores se limpian cuando la persona empieza a corregir; se vuelven a validar al salir.
   * @param {string} texto - Nuevo valor del título.
   * @returns {void}
   */
  function alCambiarTitulo(texto) {
    setTitulo(texto);
    setErrores((previo) => ({ ...previo, titulo: null, general: null }));
  }

  /**
   * Al escribir en la descripción: guarda el texto y limpia su error.
   * @param {string} texto - Nuevo valor de la descripción.
   * @returns {void}
   */
  function alCambiarDescripcion(texto) {
    setDescripcion(texto);
    setErrores((previo) => ({ ...previo, descripcion: null }));
  }

  /**
   * Pide permiso de galería y abre el selector de fotos.
   * POR QUÉ pedimos el permiso recién al tocar el botón: pedirlo al abrir la app asusta
   * y no hace falta hasta que la persona quiera elegir una foto.
   * Si el permiso se rechaza, mostramos un mensaje en vez de romper la app.
   * @returns {Promise<void>}
   */
  async function elegirDeGaleria() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permiso.status !== 'granted') {
      setErrores((previo) => ({
        ...previo,
        imagen: 'Sin permiso para la galería. Habilitalo en Ajustes para elegir una foto.',
      }));
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    // Si la persona cancela el selector no es un error: simplemente no cambiamos nada.
    if (!resultado.canceled) {
      setImageUri(resultado.assets[0].uri);
      setErrores((previo) => ({ ...previo, imagen: null }));
    }
  }

  /**
   * Pide permiso de cámara y abre la cámara para sacar una foto.
   * Mismo criterio que la galería: permiso al tocar, y rechazo con mensaje.
   * @returns {Promise<void>}
   */
  async function sacarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (permiso.status !== 'granted') {
      setErrores((previo) => ({
        ...previo,
        imagen: 'Sin permiso para la cámara. Habilitalo en Ajustes para sacar una foto.',
      }));
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!resultado.canceled) {
      setImageUri(resultado.assets[0].uri);
      setErrores((previo) => ({ ...previo, imagen: null }));
    }
  }

  /**
   * Valida todo el formulario junto. Se usa al tocar "Guardar".
   * El duplicado se revisa solo si el resto está bien, para no repetir mensajes.
   * @returns {object} Errores nuevos. Todos null si está todo bien.
   */
  function validarTodo() {
    const general = validarCoordenadas(coordenada);
    const tituloOk = validarTituloLugar(titulo);
    return {
      titulo: tituloOk,
      descripcion: validarDescripcionLugar(descripcion),
      imagen: validarImagenLugar(imageUri),
      general:
        general ||
        (tituloOk === null
          ? validarLugarDuplicado(titulo, coordenada.latitude, coordenada.longitude, lugaresExistentes)
          : null),
    };
  }

  /**
   * Guarda el lugar. Primero valida todo y, si hay errores, enfoca el primer campo malo.
   * Si todo está bien, llama a onGuardar y muestra el spinner mientras procesa.
   * @returns {Promise<void>}
   */
  async function guardar() {
    const nuevos = validarTodo();
    setErrores(nuevos);
    if (hayErrores(nuevos)) {
      const campo = primerCampoConError(nuevos);
      if (campo === 'titulo') refTitulo.current?.focus();
      if (campo === 'descripcion') refDescripcion.current?.focus();
      return;
    }

    setGuardando(true);
    try {
      await onGuardar({
        title: titulo.trim(),
        description: descripcion.trim(),
        imageUri,
        latitude: coordenada.latitude,
        longitude: coordenada.longitude,
      });
      limpiarFormulario();
    } catch {
      // Si falla el guardado, mostramos el error y dejamos la persona en el formulario.
      setErrores((previo) => ({
        ...previo,
        general: 'No se pudo guardar el lugar. Probá de nuevo.',
      }));
    } finally {
      setGuardando(false);
    }
  }

  // FlatList en vez de ScrollView (regla del proyecto). Con un solo item, funciona como
  // un área con scroll para que el formulario no quede tapado por el teclado.
  const formulario = (
    <View style={styles.formulario}>
      <Text style={styles.encabezado}>Nuevo lugar</Text>
      {coordenada ? (
        <Text style={styles.ayuda}>
          Ubicación: {coordenada.latitude.toFixed(4)}, {coordenada.longitude.toFixed(4)}
        </Text>
      ) : null}

      <CustomInput
        ref={refTitulo}
        label="Título"
        placeholder="Ej: Plaza San Martín"
        value={titulo}
        onChangeText={alCambiarTitulo}
        onBlur={revisarTitulo}
        error={errores.titulo}
      />

      <CustomInput
        ref={refDescripcion}
        label="Descripción (opcional)"
        placeholder="Contá qué tiene de especial"
        value={descripcion}
        onChangeText={alCambiarDescripcion}
        onBlur={revisarDescripcion}
        error={errores.descripcion}
        multiline
      />
      <Text style={styles.contador}>
        {descripcion.length}/{LIMITE_DESCRIPCION}
      </Text>

      <Text style={styles.etiqueta}>Imagen</Text>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.vistaPrevia}
          accessibilityLabel="Vista previa de la imagen del lugar"
        />
      ) : (
        <View style={styles.sinImagen}>
          <Text style={styles.ayuda}>Todavía no elegiste una imagen</Text>
        </View>
      )}
      <View style={styles.fila}>
        <View style={styles.mitad}>
          <CustomButton title="Galería" variante="contorno" onPress={elegirDeGaleria} />
        </View>
        <View style={styles.mitad}>
          <CustomButton title="Cámara" variante="contorno" onPress={sacarFoto} />
        </View>
      </View>
      {errores.imagen ? (
        <Text style={styles.textoError} accessibilityRole="alert">
          {errores.imagen}
        </Text>
      ) : null}

      {errores.general ? (
        <Text style={styles.textoError} accessibilityRole="alert">
          {errores.general}
        </Text>
      ) : null}

      <View style={styles.acciones}>
        {/* El botón se deshabilita mientras haya errores: hay que corregirlos antes de guardar. */}
        <CustomButton
          title="Guardar lugar"
          onPress={guardar}
          disabled={hayErrores(errores)}
          loading={guardando}
        />
        <CustomButton title="Cancelar" variante="contorno" onPress={cerrar} disabled={guardando} />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <SafeAreaView style={styles.pantalla} edges={['top', 'bottom']}>
        {/* En iOS el teclado tapa el formulario: "padding" lo empuja hacia arriba. */}
        <KeyboardAvoidingView
          style={styles.pantalla}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <FlatList
            data={[{ clave: 'formulario' }]}
            keyExtractor={(item) => item.clave}
            renderItem={() => formulario}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.contenido}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: theme.colors.fondo,
  },
  contenido: {
    padding: theme.spacing.lg,
  },
  formulario: {
    gap: theme.spacing.xs,
  },
  encabezado: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.texto,
    marginBottom: theme.spacing.xs,
  },
  ayuda: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textoSecundario,
  },
  contador: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textoSecundario,
    textAlign: 'right',
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  etiqueta: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.texto,
  },
  vistaPrevia: {
    width: '100%',
    height: 160,
    borderRadius: theme.radius.lg,
    marginVertical: theme.spacing.sm,
  },
  sinImagen: {
    height: 160,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borde,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.superficie,
  },
  fila: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  mitad: {
    flex: 1,
  },
  textoError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
  },
  acciones: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
});
