# 2. Especificación de la API (Sincronizada)

> **Convención técnica:** Todos los endpoints que interactúan con la base de datos deben importar el cliente Prisma como `db` desde `@/lib/prisma`. Nunca uses `prisma` directamente para evitar múltiples instancias y posibles errores en desarrollo.

Esta especificación refleja la estructura de endpoints actual del proyecto, agrupada por rol de usuario.

---

## 🔑 Endpoints de Autenticación y Perfil (Generales)

#### `POST /api/auth/register`

Registra un nuevo usuario.

#### `POST /api/auth/login` (manejado por NextAuth)

Inicia sesión y obtiene un token de sesión.

#### `POST /api/auth/forgot-password`

Inicia el proceso de recuperación de contraseña.

#### `POST /api/auth/verify-reset-token`

Verifica que el token de reseteo sea válido.

#### `POST /api/auth/reset-password`

Establece una nueva contraseña usando un token válido.

#### `GET /api/profile`

Obtiene los datos del perfil del usuario autenticado.

#### `PUT /api/profile`

Actualiza los datos del perfil del usuario autenticado.

#### `POST /api/profile/change-password`

Cambia la contraseña del usuario autenticado.

#### `GET /api/users`

Obtiene una lista de usuarios.

#### `POST /api/solicitudes/desmatricula`

Gestiona las solicitudes de desmatrícula.

---

## 👤 Endpoints de Administrador (`/api/admin`)

#### `GET /api/admin/asignaturas`

Obtiene el listado de asignaturas.

#### `GET, POST /api/admin/clases`

Obtiene o crea nuevas clases.

#### `GET /api/admin/docentes/[docenteId]/historico`

Obtiene el historial de clases de un docente específico.

#### `GET, POST /api/admin/matriculas`

Obtiene o crea nuevas matrículas (asociar estudiante a asignatura).

#### `GET /api/admin/users`

Obtiene una lista paginada de todos los usuarios.

#### `GET /api/admin/users/[userId]`

Obtiene los detalles de un usuario específico.

#### `POST /api/admin/users/bulk`

Crea múltiples usuarios a partir de un archivo CSV.

---

## 👨‍🏫 Endpoints de Docente (`/api/docente`)

#### `GET /api/docente/asignaturas`

Obtiene las asignaturas asignadas al docente.

#### `GET /api/docente/asignaturas/[id]`

Obtiene los detalles de una asignatura específica.

#### `GET, POST /api/docente/asignaturas/[id]/reportes`

- **GET**: Lista los reportes generados previamente para una asignatura.
- **POST**: Genera un nuevo reporte de asistencia.

#### `POST /api/docente/asistencia`

Registra o actualiza la asistencia de estudiantes.

#### `POST /api/docente/cargar-asignaturas`

Carga múltiples asignaturas desde un archivo.

#### `GET, POST /api/docente/clases`

Obtiene las clases del docente o crea una nueva.

#### `GET, PUT /api/docente/clases/[classId]`

Obtiene o actualiza los detalles de una clase específica.

#### `GET /api/docente/clases/[classId]/asistencia`

Obtiene el estado de asistencia de los estudiantes para una clase.

#### `POST /api/docente/clases/[classId]/generar-qr`

Genera un código QR para el registro de asistencia.

#### `GET /api/docente/dashboard`

Obtiene estadísticas y datos para el dashboard del docente.

#### `GET /api/docente/dashboard/live`

Obtiene datos en tiempo real para una clase activa.

#### `GET, POST /api/docente/eventos`

Gestiona eventos del calendario para el docente.

#### `GET, PUT, DELETE /api/docente/eventos/[id]`

Obtiene, actualiza o elimina un evento específico.

#### `GET /api/docente/matriculas`

Obtiene las matrículas relacionadas con el docente.

#### `POST /api/docente/perfil/firma`

Actualiza la firma digital del docente.

---

## 🎓 Endpoints de Estudiante (`/api/estudiante`)

#### `GET /api/estudiante/historial`

Obtiene el historial de asistencias del estudiante.

#### `GET /api/estudiante/reportes/asistencia`

Obtiene el reporte de asistencia personal del estudiante.

---

## 🔄 Endpoints Comunes

#### `GET, POST /api/asistencia`

Obtiene o registra asistencias.

#### `POST /api/asistencia/scan`

Registra la asistencia mediante escaneo de QR.
