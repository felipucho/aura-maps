/**
 * ARCHIVO: src/utils/theme.js
 * QUÉ HACE: guarda los design tokens (colores, espacios, radios, letras y grosores).
 *           Es la única fuente de estilos: ningún otro archivo escribe colores o tamaños a mano.
 * LO USA: todas las pantallas, componentes y App.js.
 * DEPENDE DE: nada (solo objetos JS).
 * CONCEPTOS CLAVE: design tokens, consistencia visual, StyleSheet, contraste.
 */

/**
 * Paleta oscura: "bosque de noche".
 * Fondos casi negros teñidos de verde pino (nunca negro puro), un solo acento menta para
 * acciones y el ámbar reservado para la chincheta del mapa. Todos los grises son de la
 * misma familia verdosa, así nada desentona.
 */
const colors = {
  primario: '#62D2A2',
  primarioPresionado: '#4DB98B',
  primarioSuave: '#1A3329',
  secundario: '#F2B544',
  fondo: '#0D1311',
  superficie: '#151E1B',
  superficieAlta: '#1D2925',
  texto: '#E8F0ED',
  textoSecundario: '#93A59E',
  textoSobrePrimario: '#08130E',
  borde: '#2A3833',
  error: '#FF8A80',
  exito: '#62D2A2',
  deshabilitado: '#24302C',
  // Sombra teñida del acento (no negra): da brillo suave a botones y al logo.
  brillo: '#62D2A2',
};

/**
 * Estilo oscuro para el mapa de Google (Android). Usa la misma paleta: agua y rutas
 * en verdes oscuros, textos grises, así el mapa no "grita" al lado de la interfaz.
 */
const estiloMapaOscuro = [
  { elementType: 'geometry', stylers: [{ color: '#151E1B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#93A59E' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1311' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1D2925' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#173126' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A3833' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#36504A' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1D2925' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A1A1F' }] },
];

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
  display: 44,
};

/** Interletrado: negativo en títulos grandes (más compactos), positivo en etiquetas chicas. */
const letterSpacing = {
  titulo: -1.2,
  etiqueta: 0.4,
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

/** Medidas fijas de imágenes e íconos, en px. Así ningún componente escribe números sueltos. */
const tamanios = {
  miniatura: 56,
  imagenPrevia: 160,
  imagenCallout: 110,
  calloutAncho: 220,
  icono: 22,
  logo: 76,
  iconoLogo: 38,
  radar: 220,
};

/** Duraciones de animación, en ms. */
const duracion = {
  pulso: 2400,
};

/** Grosores de borde, en px. */
const grosor = {
  fino: 1,
  marcado: 2,
  acento: 4,
};

/** Escala que se aplica al botón mientras se presiona (efecto de hundido). */
const escalaPresion = 0.98;

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  letterSpacing,
  tamanioTactil,
  tamanios,
  grosor,
  escalaPresion,
  duracion,
  estiloMapaOscuro,
};

export default theme;
