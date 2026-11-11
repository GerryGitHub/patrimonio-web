# Patrimonio Web

Aplicación web del MVP de Patrimonio: registro, inicio de sesión, cierre de
sesión, recuperación de la sesión al recargar y gestión de portafolios, cuentas,
instrumentos, posiciones, movimientos y el **Centro de Patrimonio** consolidado.

Consume exclusivamente la API real del backend
[`GerryGitHub/patrimonio`](https://github.com/GerryGitHub/patrimonio). No hay
datos simulados ni usuarios almacenados en el navegador.

## Requisitos

- Node.js 20 o superior (probado con Node 22).
- Backend de Patrimonio en ejecución con el perfil `local` y
  `patrimonio.api.consolidacion.expuesta=true` para ver el Centro de Patrimonio.

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

En desarrollo, Vite reenvía `/api` a `http://localhost:8080` mediante el proxy
de `vite.config.ts`. Así el navegador ve un único origen y las cookies de sesión
y CSRF funcionan sin habilitar CORS ni relajar `SameSite`.

Si el backend escucha en otro puerto:

```bash
VITE_API_PROXY_TARGET=http://localhost:18080 npm run dev
```

Crea un archivo `.env.local` para conservar la configuración. `.env` y
`.env.local` están ignorados por Git.

### Variables de entorno

| Variable | Valor por defecto | Uso |
|----------|-------------------|-----|
| `VITE_API_BASE_URL` | `/api` | Prefijo de la API en el navegador. |
| `VITE_API_PROXY_TARGET` | `http://localhost:8080` | Destino del proxy de Vite en desarrollo. |

## Scripts

```bash
npm run dev        # servidor de desarrollo con proxy
npm run build      # comprobación de tipos y build de producción
npm run typecheck  # solo TypeScript
npm run test       # pruebas con Vitest
npm run preview    # sirve el build local
```

## Flujo de acceso

1. **Registro** (`/registro`): envía `POST /api/auth/registro` con nombre,
   correo y contraseña. El backend responde `201` con la identidad mínima y
   **no crea sesión**. La web redirige a `/login` con un aviso de éxito.
2. **Login** (`/login`): obtiene el token CSRF, envía
   `POST /api/auth/login` y guarda el usuario en el contexto de React.
3. **Sesión**: al recargar, `GET /api/auth/me` recupera la identidad desde la
   cookie `HttpOnly`. No se lee ningún token del almacenamiento del navegador.
4. **Centro de Patrimonio** (`/`): consulta el endpoint global o el de un
   portafolio según el selector activo.
5. **Mis activos** (`/activos`): cuentas, posiciones e instrumentos por
   portafolio.
6. **Logout**: `POST /api/auth/logout` invalida la sesión y vuelve al login.

Si una llamada de datos responde `401`, la aplicación marca la sesión como
caducada y redirige al login.

## Centro de Patrimonio

El dashboard (`/`) es el Centro de Patrimonio. Consolida los activos registrados
de uno o de todos los portafolios autorizados y muestra:

- **Cobertura**: qué incluye y qué no incluye la vista. Los conceptos sin fuente
  aparecen como exclusiones explícitas; la vista no se presenta como patrimonio
  neto completo.
- **Resumen**: activos registrados a costo, capital invertido, resultado
  realizado, comisiones e impuestos. Patrimonio neto, pasivos, liquidez, valor
  de mercado y resultado no realizado se muestran como **No disponible** con su
  motivo, nunca como cero.
- **Distribución**: donuts SVG por moneda, agrupados por clase de activo, tipo de
  instrumento, institución, cuenta o moneda.
- **Evolución histórica**: gráficas SVG de costo de adquisición vigente,
  resultado realizado y valor de mercado, con selector de moneda. No se
  interpolan fechas sin registros.
- **Rendimientos realizados**: resultado de movimientos confirmados, incluidas
  posiciones cerradas y excluyendo reversiones y sus originales.
- **Liquidez y capital comprometido**: cuentas con su moneda; los saldos de
  efectivo permanecen sin información en esta entrega.
- **Eventos y vencimientos**: solo eventos registrados; no se generan fechas
  estimadas.
- **Snapshots patrimoniales**: captura manual de la fecha actual, idempotente y
  con los campos sin fuente como **No disponible**.

Reglas de presentación:

- **Nunca se convierten ni se suman monedas distintas.** Cada importe conserva
  su divisa y los porcentajes se calculan dentro de cada moneda.
- Los importes llegan como cadenas con escala fija y se formatean sin pasar por
  `number`, para no perder precisión.
- Los indicadores no disponibles incluyen su motivo; no se rellenan con ceros.
- Las gráficas son SVG propias, accesibles (`role="img"`, etiquetas y puntos
  enfocables) y sin librerías de gráficos adicionales.
- El diseño mantiene el sistema **Financial Atlas Blue** y es adaptable a móvil.

## Integraciones reales

| Operación | Endpoint |
|-----------|----------|
| Token CSRF | `GET /api/auth/csrf` |
| Registro | `POST /api/auth/registro` |
| Login | `POST /api/auth/login` |
| Identidad | `GET /api/auth/me` |
| Logout | `POST /api/auth/logout` |
| Portafolios | `GET /api/v1/portafolios` |
| Cuentas | `GET /api/v1/portafolios/{id}/cuentas` |
| Instrumentos | `GET /api/v1/instrumentos` |
| Posiciones | `GET /api/v1/portafolios/{id}/posiciones` |
| Movimientos | `GET /api/v1/portafolios/{id}/posiciones/{posicionId}/movimientos` |
| Centro por portafolio | `GET /api/v1/portafolios/{id}/patrimonio/centro` |
| Centro global | `GET /api/v1/patrimonio/centro` |
| Snapshots | `GET/POST /api/v1/portafolios/{id}/patrimonio/snapshots` |

El Centro de Patrimonio hace **una sola petición** `centro` por selección y
filtros; los snapshots se consultan aparte porque dependen de un portafolio
concreto. El endpoint global se usa cuando el selector está en «Todos los
portafolios».

El token CSRF se mantiene **solo en memoria**. Si el backend lo rota (login) o
lo invalida (logout), la web actualiza o descarta su copia. Las peticiones que
modifican estado envían la cabecera `X-XSRF-TOKEN` y se reintentan una vez si el
servidor responde `403` por un token obsoleto.

No se usan `localStorage` ni `sessionStorage` para contraseñas, tokens de sesión
ni tokens CSRF. `sessionStorage` solo conserva el identificador del portafolio
activo.

## Estructura

```text
src/
  api/          Clientes y tipos del contrato (auth, portafolios, cuentas,
                instrumentos, posiciones, movimientos, patrimonio)
  auth/         Contexto de sesión y restauración con /auth/me
  components/   Layout, guards, cabecera, primitivas de UI y gráficas
  components/patrimonio/  Centro de Patrimonio (resumen, distribución,
                evolución, rendimientos, liquidez, eventos y snapshots)
  lib/          HTTP, errores, validación, decimales y formato
  pages/        Login, registro, Centro de Patrimonio, activos, instrumentos,
                posiciones, configuración y 404
  portfolio/    Contexto del portafolio activo
  styles/       CSS global con diseño adaptable
  test/         Fixtures compartidos
```

## Producción

El build es estático (`dist/`). Se recomienda publicar la web y la API bajo el
**mismo origen**, por ejemplo con un reverse proxy que sirva `dist/` y reenvíe
`/api` al backend. Así se conservan las cookies `HttpOnly` y la protección CSRF
sin CORS.

Si se usa un origen distinto, hay que configurar CORS con credenciales y
cookies `SameSite=None; Secure` en el backend. Esa configuración no forma parte
de este repositorio.

## Pruebas

```bash
npm run test
```

Las pruebas cubren validación de formularios, cliente HTTP (cabeceras,
credenciales, errores RFC 9457), traducción de errores del backend a mensajes de
interfaz, formateo decimal sin pérdida de precisión y los componentes del Centro
de Patrimonio:

- `api/patrimonio.test.ts`: rutas por portafolio y global, filtros y snapshots.
- `lib/patrimonio.test.ts`: monedas, series, porcentajes y estados.
- `ImportesMoneda.test.tsx`, `DistribucionPatrimonio.test.tsx`,
  `GraficaLineas.test.tsx` y `SnapshotsPatrimonio.test.tsx`.
- `pages/DashboardPage.test.tsx`: cobertura, indicadores no disponibles,
  gráficas, endpoint global y estado sin portafolios.

Las gráficas y donuts se validan como SVG accesible sin depender de una
librería externa.
