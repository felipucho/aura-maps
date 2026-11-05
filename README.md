# Lorenzo

App móvil hecha con **React Native + Expo** (JavaScript, sin TypeScript). Permite iniciar sesión, marcar lugares en un mapa con una foto y ver la lista de los lugares guardados. Los datos quedan en el celular, así que sobreviven a reiniciar la app.

## Cómo probarla en Expo Go

Requisitos: Node.js 20 o superior y la app **Expo Go** en el celular (Android o iPhone).

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:

   ```bash
   npx expo start
   ```

3. Abrir la app:
   - **Celular:** escanear el código QR que aparece en la terminal con la app Expo Go (en Android se escanea desde Expo Go; en iPhone, desde la cámara). El celular y la computadora tienen que estar en la misma red Wi-Fi.
   - **Emulador Android:** tener Android Studio con un emulador abierto y correr:

     ```bash
     npx expo start --android
     ```

4. Para revisar el código y los tests:

   ```bash
   npm run lint
   npm test
   npm run test:coverage
   ```

## Funcionalidades

- **Registro e inicio de sesión** con validaciones (usuario, contraseña, confirmación) y bloqueo de 30 segundos tras 5 intentos fallidos.
- **Sesión persistente:** al reabrir la app sigue logueado. El logout borra la sesión.
- **Mapa** centrado en la ubicación real. Si se niega el permiso, centra en Las Varillas (Córdoba).
- **Long press** en el mapa: abre un formulario para guardar un lugar con título, descripción y foto (galería o cámara).
- **Marcadores:** tocar uno muestra su título, descripción y foto.
- **Mis lugares:** lista con miniatura, título y fecha. Permite borrar con confirmación.
- **Perfil** (en el menú lateral): usuario, cantidad de lugares y logout.

## Estructura

```
App.js                      Providers de la app y navegación raíz
index.js                    Registro del componente en Expo (lo genera el template)
app.json                    Configuración de Expo y textos de permisos
eslint.config.js            Reglas de lint (prohíbe .map, Touchable* y ScrollView)
jest.setup.js               Mocks de librerías nativas para los tests
src/
  screens/                  Pantallas
  components/               Componentes reutilizables
  navigation/               Stack, tabs y drawer
  context/                  Estado de autenticación (AuthContext)
  utils/                    Tema, validaciones y persistencia
__tests__/                  Tests con la misma estructura que src/
```

### Un renglón por archivo

| Archivo | Qué hace |
|---|---|
| `App.js` | Arma los providers (áreas seguras, gestos, sesión, navegación) y muestra `AppNavigator`. |
| `index.js` | Registra `App` como componente raíz de Expo. |
| `app.json` | Nombre de la app y textos en español de los permisos de ubicación, galería y cámara. |
| `eslint.config.js` | Configura ESLint y prohíbe `.map`, `Touchable*` y `ScrollView`. |
| `jest.setup.js` | Simula AsyncStorage, crypto, ubicación, cámara, archivos, mapa y gestos para los tests. |
| `src/context/AuthContext.js` | Login, registro, logout, bloqueo por intentos y sesión persistente. Expone el hook `useAuth`. |
| `src/navigation/AppNavigator.js` | Muestra spinner, `AuthStack` o `AppDrawer` según la sesión. |
| `src/navigation/AuthStack.js` | Pila sin sesión: Login y Registro. |
| `src/navigation/AppDrawer.js` | Menú lateral: "Inicio" (tabs) y "Perfil". |
| `src/navigation/AppTabs.js` | Pestañas inferiores: "Mapa" y "Mis lugares". |
| `src/screens/LoginScreen.js` | Formulario de login con errores genéricos y cuenta regresiva del bloqueo. |
| `src/screens/RegisterScreen.js` | Formulario de registro con validación por campo. |
| `src/screens/MapScreen.js` | Mapa, permisos de ubicación, long press, marcadores y callouts. |
| `src/screens/PlacesScreen.js` | Lista de lugares con `FlatList`, borrado con confirmación y estados. |
| `src/screens/ProfileScreen.js` | Usuario, cantidad de lugares y cerrar sesión. |
| `src/components/CustomInput.js` | Campo de texto con label y mensaje de error. |
| `src/components/CustomButton.js` | Botón con `Pressable`, estados pressed, disabled y loading. |
| `src/components/EstadoPantalla.js` | Bloque de estado: cargando, vacío, error o aviso. |
| `src/components/PlaceModal.js` | Modal para crear un lugar, con validaciones y elección de foto. |
| `src/utils/theme.js` | Design tokens: colores, espacios, radios, letras y tamaños. |
| `src/utils/validations.js` | Funciones puras que validan usuario, contraseña, lugar y coordenadas. |
| `src/utils/storage.js` | Único lugar que toca AsyncStorage y las imágenes. Centraliza las claves. |

## Librerías y por qué

| Librería | Para qué |
|---|---|
| `expo` | Base del proyecto y acceso a los módulos nativos desde Expo Go. |
| `react-navigation` (native, native-stack, bottom-tabs, drawer) | Navegación: stack de login, tabs y menú lateral. |
| `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets` | Dependencias del Drawer (gestos y animaciones). |
| `react-native-safe-area-context`, `react-native-screens` | Márgenes seguros y pantallas nativas, requeridas por la navegación. |
| `react-native-maps` | Mapa, marcadores y callouts. |
| `expo-location` | Permiso de ubicación y posición actual. |
| `expo-image-picker` | Elegir foto de la galería o sacarla con la cámara. |
| `expo-file-system` | Copiar la foto a la carpeta de documentos para que no se borre. |
| `expo-crypto` | Hash SHA-256 de las contraseñas. |
| `@react-native-async-storage/async-storage` | Guardar usuarios, sesión y lugares. |
| `@expo/vector-icons` | Íconos de las pestañas, el menú y el botón de borrar. |
| `expo-font`, `expo-asset` | Dependencias que necesitan los íconos. |
| `jest`, `jest-expo`, `@testing-library/react-native` | Tests unitarios y de componentes. |
| `eslint`, `eslint-config-expo` | Lint del proyecto. |

## Tests

```bash
npm test                 # corre todos los tests
npm run test:coverage    # además muestra la cobertura
```

La meta del proyecto es 90% o más en `src/utils` y `src/context`, y 70% o más en general.
