/**
 * ARCHIVO: src/utils/theme.js
 * QUÉ HACE: guarda los design tokens (colores, espacios, radios, letras y grosores).
 *           Es la única fuente de estilos: ningún otro archivo escribe colores o tamaños a mano.
 * LO USA: todas las pantallas, componentes y App.js.
 * DEPENDE DE: nada (solo objetos JS).
 * CONCEPTOS CLAVE: design tokens, consistencia visual, StyleSheet, contraste.
 */

/**
 * Paleta: "niebla y chincheta".
 * Fondo frío tipo niebla, verde pino como color principal y ámbar como acento
 * (el color de la chincheta del mapa). Nada de crema ni terracota.
 */
const colors = {
  primario: '#2F5D50',
  primarioPresionado: '#234A3F',
  primarioSuave: '#DCE7E3',
  secundario: '#E0A526',
  fondo: '#EEF2F1',
  superficie: '#FFFFFF',
  texto: '#1C2B27',
  textoSecundario: '#55655F',
  textoSobrePrimario: '#FFFFFF',
  borde: '#C5D1CC',
  error: '#B3261E',
  exito: '#1E7A4C',
  deshabilitado: '#C5D1CC',
};

/** Escala de espacios en px: 4, 8, 12, 16, 24, 32. */
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/** Radios de borde. Regla única: botones e inputs usan md, tarjetas usan lg. */
const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

/** Tamaños de letra en px. */
const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
};

/** Grosores de letra (como strings, así los pide React Native). */
const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/** Alto y ancho mínimo de cualquier área tocable (guía de accesibilidad). */
const tamanioTactil = 44;

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  tamanioTactil,
};

export default theme;
