/**
 * ARCHIVO: src/components/RadarPin.js
 * QUÉ HACE: logo animado de la app: una chincheta ámbar en el centro y dos ondas que se
 *           expanden como un radar, como si el mapa estuviera buscando lugares.
 * LO USA: LoginScreen.
 * DEPENDE DE: react, react-native (Animated, AccessibilityInfo), @expo/vector-icons, src/utils/theme.js.
 * CONCEPTOS CLAVE: Animated.loop, interpolate, useEffect con cleanup, movimiento reducido.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

// En web el driver nativo no existe: ahí la animación corre en JavaScript.
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';

/**
 * Estilo animado de una onda: crece y se desvanece a medida que el valor va de 0 a 1.
 * @param {Animated.Value} valor - Progreso de la onda.
 * @returns {object} Estilo con opacidad y escala.
 */
function estiloOnda(valor) {
  return {
    opacity: valor.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
  };
}

/**
 * Logo con radar animado. Si la persona activó "reducir movimiento", queda quieto.
 * @returns {JSX.Element} Radar con la chincheta.
 */
export function RadarPin() {
  const ondaA = useRef(new Animated.Value(0)).current;
  const ondaB = useRef(new Animated.Value(0)).current;
  const [reducirMovimiento, setReducirMovimiento] = useState(false);

  // Corre una vez: averigua si el sistema pide menos animaciones.
  useEffect(() => {
    let cancelado = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => {
        if (!cancelado) setReducirMovimiento(Boolean(valor));
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  // Arranca las dos ondas desfasadas media vuelta. El cleanup las frena al salir de la pantalla.
  useEffect(() => {
    if (reducirMovimiento) return undefined;
    const pulso = (valor) =>
      Animated.loop(
        Animated.timing(valor, {
          toValue: 1,
          duration: theme.duracion.pulso,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USAR_DRIVER_NATIVO,
        }),
      );
    const animacionA = pulso(ondaA);
    const animacionB = pulso(ondaB);
    animacionA.start();
    const demora = setTimeout(() => animacionB.start(), theme.duracion.pulso / 2);
    return () => {
      clearTimeout(demora);
      animacionA.stop();
      animacionB.stop();
    };
  }, [reducirMovimiento, ondaA, ondaB]);

  return (
    <View style={styles.radar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* Anillos fijos: dan la idea de mapa/radar aunque no haya animación. */}
      <View style={[styles.anillo, styles.anilloExterno]} />
      <View style={[styles.anillo, styles.anilloMedio]} />
      {reducirMovimiento ? null : (
        <>
          <Animated.View style={[styles.onda, estiloOnda(ondaA)]} />
          <Animated.View style={[styles.onda, estiloOnda(ondaB)]} />
        </>
      )}
      <View style={styles.logo}>
        <Ionicons name="location" size={theme.tamanios.iconoLogo} color={theme.colors.secundario} />
      </View>
    </View>
  );
}

const RADAR = theme.tamanios.radar;

const styles = StyleSheet.create({
  radar: {
    width: RADAR,
    height: RADAR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anillo: {
    position: 'absolute',
    borderWidth: theme.grosor.fino,
    borderColor: theme.colors.borde,
    borderRadius: theme.radius.pill,
  },
  anilloExterno: {
    width: RADAR,
    height: RADAR,
  },
  anilloMedio: {
    width: RADAR * 0.62,
    height: RADAR * 0.62,
  },
  onda: {
    position: 'absolute',
    width: RADAR,
    height: RADAR,
    borderRadius: theme.radius.pill,
    borderWidth: theme.grosor.marcado,
    borderColor: theme.colors.primario,
    backgroundColor: theme.colors.primarioSuave,
  },
  logo: {
    width: theme.tamanios.logo,
    height: theme.tamanios.logo,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.superficieAlta,
    borderWidth: theme.grosor.marcado,
    borderColor: theme.colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
    // Brillo teñido del acento, no sombra negra.
    shadowColor: theme.colors.brillo,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
