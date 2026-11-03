# Patrimonio Web

Aplicación web del MVP de Patrimonio: registro, inicio de sesión, cierre de
sesión, recuperación de la sesión al recargar y consulta de portafolios y
cuentas del usuario autenticado.

Consume exclusivamente la API real del backend
[`GerryGitHub/patrimonio`](https://github.com/GerryGitHub/patrimonio). No hay
datos simulados ni usuarios almacenados en el navegador.

## Requisitos

- Node.js 20 o superior (probado con Node 22).
- Backend de Patrimonio en ejecución.

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
4. **Dashboard** (`/`): lista `GET /api/v1/portafolios`.
5. **Portafolio** (`/portafolios/:id`): lista
   `GET /api/v1/portafolios/{id}/cuentas`.
6. **Logout**: `POST /api/auth/logout` invalida la sesión y vuelve al login.

Si una llamada de datos responde `401`, la aplicación marca la sesión como
caducada y redirige al login.

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

El token CSRF se mantiene **solo en memoria**. Si el backend lo rota (login) o
lo invalida (logout), la web actualiza o descarta su copia. Las peticiones que
modifican estado envían la cabecera `X-XSRF-TOKEN` y se reintentan una vez si el
servidor responde `403` por un token obsoleto.

No se usan `localStorage` ni `sessionStorage` para contraseñas, tokens de sesión
ni tokens CSRF.

## Estructura

```text
src/
  api/          Cliente de auth y portafolios, tipos del contrato
  auth/         Contexto de sesión y restauración con /auth/me
  components/   Layout, guards, cabecera y primitivas de UI
  lib/          HTTP, errores, validación y formato
  pages/        Login, registro, dashboard, portafolio y 404
  styles/       CSS global con diseño adaptable
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

Cubren validación de formularios, cliente HTTP (cabeceras, credenciales,
errores RFC 9457) y traducción de errores del backend a mensajes de interfaz.
