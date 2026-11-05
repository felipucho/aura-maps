# Guion de defensa (4 a 5 minutos)

## 1. Presentación (20 s)

"Lorenzo es una app para guardar lugares en un mapa. Tiene login, sesión persistente, mapa con permisos, fotos y una lista de lugares. Está hecha con React Native y Expo, en JavaScript, y corre en Expo Go."

## 2. Flujo de autenticación (50 s)

- Registro: valido usuario, contraseña y confirmación. Cada error sale debajo de su campo. Antes de guardar, reviso que el usuario no exista.
- Guardo el usuario con la contraseña **hasheada** (SHA-256). Nunca guardo la clave en texto plano.
- Login: si falla, muestro un mensaje genérico ("Usuario o contraseña incorrectos") para no revelar qué dato está mal.
- Después de 5 intentos fallidos, bloqueo el login 30 segundos y muestro la cuenta regresiva.

## 3. AuthContext (50 s)

- `AuthContext` guarda `user`, `loading`, y las funciones `login`, `register` y `logout`.
- Es un Context de React: cualquier pantalla lo lee con el hook `useAuth()`, sin pasar props a mano.
- Al montar, un `useEffect` lee la sesión del storage. Tiene deps vacías porque debe correr una sola vez al abrir la app.
- El intervalo de la cuenta regresiva también tiene `useEffect` con cleanup, para no dejar timers corriendo.

## 4. Navegación condicional (40 s)

- `AppNavigator` mira `loading` y `user`:
  - Si `loading`, muestra un spinner: todavía no sabemos si hay sesión.
  - Si no hay `user`, muestra `AuthStack` (Login y Registro).
  - Si hay `user`, muestra `AppDrawer` (Inicio con las tabs, y Perfil).
- No hacemos `navigate` después de loguearse: el cambio de pantalla sale solo del estado. Así no se puede volver atrás al login.

## 5. Permisos (40 s)

- Ubicación: pido el permiso al abrir el mapa. Si lo rechazan, centro en Las Varillas y muestro un aviso. La app no se rompe.
- Galería y cámara: pido el permiso **al tocar el botón**, no al abrir la app. Si lo rechazan, muestro un mensaje explicativo.
- Los textos de los permisos están en `app.json`, en español.

## 6. Persistencia (40 s)

- Todo va por `storage.js`. Las pantallas nunca tocan AsyncStorage directo.
- Las claves: `@users`, `@session` y `@places_<usuario>`. Cada usuario tiene su lista, así no se mezclan.
- La URI de la foto del picker es temporal (cache). La copio a `documentDirectory` con `expo-file-system`, así sobrevive a reiniciar. Al borrar un lugar, borro también su archivo.

## 7. Por qué FlatList, Pressable y for...of (30 s)

- **FlatList** en vez de ScrollView: es una lista virtualizada. Solo dibuja lo que se ve, así escala bien.
- **Pressable** en vez de Touchable: es el componente moderno. Da el estado `pressed` para dar feedback visual.
- **for...of** en vez de `.map` para los marcadores: es la regla del proyecto. Armo el array a mano con un bucle, igual de claro.
- ESLint lo hace cumplir: `npm run lint` falla si alguien escribe `.map`, `Touchable*` o `ScrollView`.

## 8. Por qué hashear contraseñas (20 s)

- Si alguien lee el storage del celular, ve solo el hash. El hash no se revierte a la clave.
- Por eso comparo hashes: calculo el hash de lo que escribe la persona y lo comparo con el guardado.

## 9. Cierre (10 s)

"Tests con Jest y Testing Library, lint en cero errores, y el código está dividido en capas: utils, context, componentes, pantallas y navegación."

---

# 10 preguntas probables del profe

**1. ¿Por qué Context y no Redux?**
Porque la app tiene un solo estado global simple: la sesión. Context alcanza y Redux sería una abstracción de más para este tamaño.

**2. ¿Qué pasa si cierro la app logueado?**
Al abrir, `AuthProvider` lee `@session` en AsyncStorage. Si hay un nombre, el usuario sigue logueado.

**3. ¿Cómo guardan las contraseñas?**
Con SHA-256 usando `expo-crypto`. Se guarda el hash, nunca la clave.

**4. ¿Por qué el mensaje de login es genérico?**
Para no decirle a un atacante si el usuario existe. Con "usuario o contraseña incorrectos" no revelo cuál de los dos falló.

**5. ¿Qué pasa si rechazan el permiso de ubicación?**
El mapa se centra en Las Varillas y aparece un aviso. No se rompe ninguna pantalla.

**6. ¿Por qué copian la foto a otra carpeta?**
La URI del picker es temporal y la puede borrar el sistema. Copiar a `documentDirectory` la deja guardada para siempre (hasta que se borre el lugar).

**7. ¿Por qué un useEffect tiene deps vacías en el mapa?**
Pedir el permiso y la ubicación debe pasar una sola vez al abrir el mapa. Si no, pediría ubicación en cada render.

**8. ¿Qué hace el cleanup de un useEffect?**
Corre antes de que el efecto se vuelva a ejecutar o cuando el componente se desmonta. Lo uso para frenar intervalos y para no actualizar estado de una pantalla que ya se cerró.

**9. ¿Por qué useFocusEffect en la lista de lugares?**
Porque si guardás un lugar en el mapa y volvés a la pestaña "Mis lugares", la lista tiene que estar al día. `useFocusEffect` vuelve a leer cada vez que la pantalla gana el foco.

**10. ¿Cómo sabés que la lógica de validación funciona?**
Las validaciones son funciones puras en `validations.js`. Tienen tests con `test.each` que cubren los casos válidos, inválidos y los límites (por ejemplo, usuario de 3, 4, 20 y 21 caracteres; contraseña de 32 y 33).
