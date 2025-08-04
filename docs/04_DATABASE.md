# Documentación de la Base de Datos

## Tablas Principales

### 1. Usuarios (User)

Almacena información de todos los usuarios del sistema.

| Atributo | Tipo | Requerido | Descripción |
|----------|------|-----------|-------------|
| id | ObjectId | Sí | ID único del usuario |
| name | String | No | Nombre completo |
| document | String | No | N° de documento |
| role | Enum | Sí | Rol: ADMIN, DOCENTE, ESTUDIANTE, COORDINADOR |
| isActive | Boolean | Sí | Estado de la cuenta |
| createdAt | DateTime | Sí | Fecha de creación |
| updatedAt | DateTime | Sí | Última actualización |

### 2. Asignaturas (Subject)

Materias del sistema académico.

| Atributo | Tipo | Requerido | Descripción |
|----------|------|-----------|-------------|
| id | ObjectId | Sí | ID único |
| name | String | Sí | Nombre |
| code | String | Sí | Código único |
| teacherId | ObjectId | Sí | ID del docente |
| studentIds | ObjectId[] | No | IDs de estudiantes |

### 3. Clases (Class)

Sesiones de clase programadas.

| Atributo | Tipo | Requerido | Descripción |
|----------|------|-----------|-------------|
| id | ObjectId | Sí | ID único |
| date | DateTime | Sí | Fecha de la clase |
| status | Enum | Sí | PROGRAMADA/REALIZADA/CANCELADA |
| subjectId | ObjectId | Sí | ID de la asignatura |

### 4. Asistencias (Attendance)

Registro de asistencia.

| Atributo | Tipo | Requerido | Descripción |
|----------|------|-----------|-------------|
| id | ObjectId | Sí | ID único |
| status | Enum | Sí | PRESENTE/AUSENTE/TARDANZA/JUSTIFICADO |
| studentId | ObjectId | Sí | ID del estudiante |
| classId | ObjectId | Sí | ID de la clase |

## Tablas de Soporte

### 5. Eventos (SubjectEvent)

Eventos de asignaturas.

| Atributo | Tipo | Requerido | Descripción |
|----------|------|-----------|-------------|
| id | ObjectId | Sí | ID único |
| title | String | Sí | Título |
| type | Enum | Sí | EXAMEN/TRABAJO/LIMITE/ANUNCIO/INFO |
| subjectId | ObjectId | Sí | ID de la asignatura |

### 6. Reportes (Report)

Reportes generados.

| Atributo | Tipo | Requerido | Descripción |
|----------|------|-----------|-------------|
| id | ObjectId | Sí | ID único |
| subjectId | ObjectId | Sí | ID de la asignatura |
| status | Enum | Sí | PENDIENTE/EN_PROCESO/COMPLETADO/FALLIDO |
| format | Enum | Sí | PDF/CSV |

### 7. Solicitudes de Desmatriculación (UnenrollRequest)

Solicitudes de retiro.

| Atributo | Tipo | Requerido | Descripción |
|----------|------|-----------|-------------|
| id | ObjectId | Sí | ID único |
| studentId | ObjectId | Sí | ID del estudiante |
| subjectId | ObjectId | Sí | ID de la asignatura |
| status | Enum | Sí | PENDIENTE/APROBADO/RECHAZADO |
