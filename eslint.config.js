// Configuración de ESLint (flat config).
// Base: reglas de eslint-config-expo. Encima agregamos las prohibiciones del proyecto:
// nada de .map, nada de Touchable* ni ScrollView. El lint tiene que dar 0 errores antes de cada commit.
const expoConfig = require('eslint-config-expo/flat');

// Componentes que el proyecto no usa. Usamos Pressable y FlatList en su lugar.
const COMPONENTES_PROHIBIDOS = [
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback',
  'ScrollView',
];

module.exports = [
  ...expoConfig,
  {
    files: ['**/*.js'],
    rules: {
      // Bloquea .map(...) y también Array.from(x, fn), que hace lo mismo por dentro.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='map']",
          message: 'Prohibido .map: usar FlatList o for...of',
        },
        {
          selector:
            "CallExpression[callee.object.name='Array'][callee.property.name='from'][arguments.length>1]",
          message: 'Prohibido Array.from(x, fn): es un .map encubierto. Usar FlatList o for...of',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: COMPONENTES_PROHIBIDOS,
              message: 'Prohibido este componente. Usar Pressable o FlatList.',
            },
            {
              name: 'react-native-gesture-handler',
              importNames: COMPONENTES_PROHIBIDOS,
              message: 'Prohibido este componente. Usar Pressable o FlatList.',
            },
          ],
        },
      ],
    },
  },
];
