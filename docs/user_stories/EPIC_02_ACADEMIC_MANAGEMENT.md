# Epic 2: 📚 Gestión Académica Avanzada

## Descripción

Sistema integral para la gestión de asignaturas, docentes y estudiantes, facilitando la administración académica y mejorando la experiencia educativa.

## Historias de Usuario

### HU-004: Creación y Configuración de Asignaturas

**Como** administrador académico  
**Quiero** crear y configurar asignaturas  
**Para** organizar la oferta académica de la institución

**Criterios de Aceptación:**

- [ ] Formulario completo con validación en tiempo real
- [ ] Campos obligatorios: código, nombre, créditos, horas teóricas/prácticas
- [ ] Asignación de programas académicos y semestres
- [ ] Configuración de requisitos y correquisitos
- [ ] Definición de competencias y resultados de aprendizaje
- [ ] Plantillas predefinidas para diferentes tipos de asignatura
- [ ] Vista previa de la ficha técnica

**Requisitos Técnicos:**

- Código único por asignatura
- Integración con el catálogo académico
- Historial de cambios

**Prioridad:** Alta  
**Story Points:** 8  
**Sprint:** 2  
**Dependencias:** HU-002

---

### HU-005: Dashboard Académico Docente

**Como** docente  
**Quiero** un panel de control centralizado  
**Para** gestionar eficientemente mis asignaturas

**Criterios de Aceptación:**

- [ ] Vista resumida de asignaturas activas
- [ ] Calendario de clases y eventos
- [ ] Indicadores clave (asistencia, calificaciones, pendientes)
- [ ] Accesos rápidos a funciones frecuentes
- [ ] Notificaciones importantes
- [ ] Personalización de widgets
- [ ] Vista móvil optimizada

**Requisitos de UX:**

- Carga rápida de datos
- Interfaz intuitiva
- Personalización por usuario

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 2  
**Dependencias:** HU-004

---

### HU-006: Gestión de Estudiantes por Asignatura

**Como** docente  
**Quiero** administrar estudiantes en mis asignaturas  
**Para** mantener actualizada la matrícula

**Criterios de Aceptación:**

- [ ] Listado de estudiantes matriculados
- [ ] Búsqueda y filtrado avanzado
- [ ] Inscripción/desinscripción de estudiantes
- [ ] Carga masiva desde archivo
- [ ] Historial académico por estudiante
- [ ] Comunicación directa con estudiantes
- [ ] Exportación de listados

**Requisitos de Seguridad:**

- Control de acceso basado en roles
- Registro de operaciones
- Validación de prerrequisitos

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 3  
**Dependencias:** HU-004
