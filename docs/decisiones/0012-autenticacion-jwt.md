# ADR 0012 — Autenticación con JWT y bcrypt

**Estado:** Aceptada · **Fecha:** 2026-09-27

## Contexto

Resolvia necesita saber quién hace cada petición, a qué organización pertenece (ADR 0005) y qué rol tiene (`USER`, `TECHNICIAN` o `ADMIN`). Los clientes son una web React (fase 2) y una app Flutter (fase 9), así que la autenticación no puede depender de cookies de un solo dominio. Además, cada institución puede tener la API en su propia red, sin servicios de identidad externos.

La autenticación se implementó en los días 7 y 8 del plan (registro, inicio de sesión, guards globales y `GET /api/auth/me`). En la revisión del día 8, `buscador-fallas` encontró **BUG-001**: los guards confiaban en el rol del token, así que un usuario borrado o degradado conservaba sus permisos hasta que el token venciera (`JWT_EXPIRES_IN=1d`). Este ADR documenta el diseño y cómo se resolvió BUG-001.

## Decisión

### Contraseñas

- Se guardan con **bcrypt** y costo 10 (`BCRYPT_ROUNDS`). Cada punto más de costo duplica el tiempo de cálculo, y también el de un ataque de fuerza bruta.
- La contraseña debe tener entre 8 y **72 bytes**. bcrypt ignora lo que pase de 72 bytes, y en UTF-8 una tilde ocupa dos, por eso se valida con `@IsByteLength` y no con la longitud en caracteres.
- El hash nunca sale del módulo `users`: solo `verifyCredentials` lo lee.
- El inicio de sesión responde el **mismo 401** si el correo no existe o si la contraseña es incorrecta. Cuando el correo no existe se compara contra un hash ficticio, para que ambos casos tarden lo mismo y no se pueda averiguar qué correos están registrados.

### Tokens

- **JWT de acceso firmado con HS256** y el secreto `JWT_SECRET` (mínimo 32 caracteres, validado al arrancar). La estrategia solo acepta `HS256` y verifica el vencimiento (`JWT_EXPIRES_IN`, por defecto `1d`).
- Claims: `sub` (id del usuario), `organizationId` y `role`. El `organizationId` sirve para abrir el alcance de la organización antes de cualquier consulta.
- El token viaja en `Authorization: Bearer <token>`, así que sirve igual para la web, el móvil y las integraciones.

### Guards cerrados por defecto

- `JwtAuthGuard` y `RolesGuard` son **globales**: todo endpoint exige token salvo los marcados con `@Public()` (health, registro e inicio de sesión). Un endpoint nuevo nace protegido; si alguien olvida un decorador, el error es un 401, no una fuga.
- `@Roles(...)` restringe por rol (403) y `@CurrentUser()` entrega el usuario autenticado. En Swagger, `@ApiAuth()` declara la seguridad y `@Roles()` documenta su 403; `test/swagger.e2e-spec.ts` lo verifica.
- El guard llena `OrganizationContext` con la organización del usuario, así que cada consulta posterior queda filtrada por ella (ADR 0005).

### El rol sale de la base de datos, no del token (BUG-001)

- `JwtStrategy.validate` **carga el usuario en cada petición**, dentro del alcance de la organización del token, y devuelve su rol **actual**.
- Si el usuario ya no existe, o no pertenece a la organización del token, responde **401**. Si su rol actual no alcanza para el endpoint, `RolesGuard` responde **403** aunque el token diga `ADMIN`.
- El claim `role` se sigue emitiendo porque le sirve al cliente para decidir qué mostrar, pero es **informativo**: nunca se usa para autorizar.

### Alternativas descartadas

- **Confiar en el rol del token hasta que venza** (el diseño del día 8): no hace consultas por petición, pero borrar a alguien o quitarle el rol de administrador no tiene efecto durante hasta un día. En un helpdesk con datos personales de estudiantes y empleados, ese margen no es aceptable.
- **Tokens cortos (5–15 minutos) con token de refresco:** reduce el margen sin consultar la base de datos en cada petición, pero agrega rotación, almacenamiento y revocación de los tokens de refresco, y el margen sigue existiendo. Puede combinarse más adelante con la decisión actual si hace falta.
- **Lista de tokens revocados:** también exige una consulta por petición, y además una tabla nueva y su limpieza.
- **Sesiones con cookie en el servidor:** complican el cliente móvil y los orígenes cruzados.
- **Argon2id en lugar de bcrypt:** es el algoritmo más recomendado hoy, pero bcrypt es suficiente con contraseñas de 8 a 72 bytes y costo 10, está muy probado en Node y ya estaba en el stack. Se puede migrar al volver a hashear en el siguiente inicio de sesión.

## Consecuencias

- Cada petición autenticada hace **una consulta por clave primaria** a `User`. Es barata, y en la escala de una institución o una pyme no se nota. Si algún día pesa, una caché corta por usuario (con invalidación al cambiar el rol) mantiene el efecto inmediato.
- Borrar un usuario o cambiarle el rol tiene **efecto inmediato**, con el mismo token. Lo prueban las e2e de `test/auth-guards.e2e-spec.ts`: token de un usuario borrado → 401; token con rol `ADMIN` de un usuario `USER` → 403; ascenso de rol → 200 con el mismo token.
- Todavía **no hay revocación del token en sí**: cerrar sesión solo borra el token en el cliente, y cambiar la contraseña no invalida los tokens ya emitidos. Si hace falta, se agrega un `tokenVersion` en `User` que el token lleve y la estrategia compare.
- Cambiar `JWT_SECRET` invalida todos los tokens a la vez; es el mecanismo de emergencia.

### Endurecimiento pendiente

Observaciones de la revisión del día 8, sin riesgo explotable hoy, que quedan registradas para retomarlas:

- **`issuer` y `audience`:** no se fijan al firmar ni se exigen al validar. Si otro servicio llegara a compartir el secreto, sus tokens serían aceptados. Conviene fijarlos antes de la fase 8 (nube).
- **Tokens sin `exp`:** passport-jwt acepta un token sin `exp` si está firmado con el secreto correcto. Hoy la API siempre firma con vencimiento, así que solo afecta a tokens fabricados con el secreto. Conviene exigirlo al validar.
- **Pruebas de algoritmo:** la librería ya rechaza `alg: none` y `HS512` porque solo se admite `HS256`, pero faltan pruebas e2e que lo fijen, para que un cambio de configuración no lo rompa en silencio.
- **Primer administrador on-premise:** la organización inicial se crea al arrancar (día 9), pero el registro público solo crea usuarios `USER`. Falta una forma segura de crear el primer `ADMIN` de una instalación nueva (por ejemplo, un comando de consola o variables de un solo uso).
