/**
 * ARCHIVO: src/utils/confirmar.js
 * QUÉ HACE: pide confirmación antes de una acción que no se puede deshacer (borrar, salir).
 *           En celular usa Alert con botones. En web, Alert con botones no hace nada
 *           (react-native-web no lo implementa), así que usa window.confirm del navegador.
 * LO USA: PlacesScreen (borrar lugar), ProfileScreen (cerrar sesión).
 * DEPENDE DE: react-native (Alert, Platform).
 * CONCEPTOS CLAVE: Promise, diferencias entre plataformas.
 */
import { Alert, Platform } from 'react-native';

/**
 * Muestra la confirmación y espera la respuesta.
 * @param {string} titulo - Título del diálogo.
 * @param {string} mensaje - Qué va a pasar.
 * @param {string} textoAccion - Texto del botón que confirma, por ejemplo "Borrar".
 * @returns {Promise<boolean>} true si la persona confirmó.
 */
export function confirmar(titulo, mensaje, textoAccion) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  }
  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
        { text: textoAccion, style: 'destructive', onPress: () => resolver(true) },
      ],
      // Android: tocar afuera del diálogo cuenta como cancelar.
      { cancelable: true, onDismiss: () => resolver(false) },
    );
  });
}
