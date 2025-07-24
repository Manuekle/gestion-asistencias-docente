# Epic 5: ✅ Registro y Gestión de Asistencias

## Descripción

Sistema integral para el registro, seguimiento y gestión de asistencias, ofreciendo herramientas tanto para estudiantes como docentes con el fin de mantener un control preciso y confiable de la asistencia a clases.

## Historias de Usuario

### HU-013: Registro de Asistencia para Estudiantes

**Como** estudiante  
**Quiero** registrar mi asistencia de forma sencilla  
**Para** confirmar mi participación en la clase

**Criterios de Aceptación:**

- [ ] Escaneo de código QR de la clase
- [ ] Confirmación visual del registro exitoso
- [ ] Visualización de mi estado de asistencia
- [ ] Historial personal de asistencias
- [ ] Notificaciones de registro exitoso/fallido
- [ ] Funcionalidad sin conexión con sincronización posterior
- [ ] Soporte para diferentes dispositivos móviles

**Requisitos Técnicos:**

- API para registro de asistencias
- Almacenamiento local para modo offline
- Sincronización en segundo plano

**Prioridad:** Alta  
**Story Points:** 8  
**Sprint:** 5  
**Dependencias:** HU-010, HU-012

---

### HU-014: Panel de Control de Asistencias

**Como** docente  
**Quiero** gestionar las asistencias de mis clases  
**Para** mantener un registro preciso de participación

**Criterios de Aceptación:**

- [ ] Vista en tiempo real de asistencias/ausencias
- [ ] Filtros por fecha, estudiante o estado
- [ ] Indicadores visuales de estado (presente/ausente/justificado)
- [ ] Estadísticas de asistencia por clase
- [ ] Exportación de reportes en múltiples formatos
- [ ] Búsqueda rápida de estudiantes
- [ ] Vista móvil optimizada

**Requisitos de UX:**

- Actualización en tiempo real
- Interfaz intuitiva y responsiva
- Accesos rápidos a funciones comunes

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 5  
**Dependencias:** HU-008, HU-013

---

### HU-015: Gestión de Asistencias Manuales

... (contenido existente)

---

### HU-031: Sistema de Observación de Clases Canceladas

**Como** coordinador académico
**Quiero** registrar observaciones cuando una clase no se imparte o se cancela
**Para** llevar un control y justificar ausencias ante auditorías

**Criterios de Aceptación:**
- [ ] Formulario para detallar motivo de cancelación/ausencia
- [ ] Adjuntar evidencias (documentos, capturas)
- [ ] Flujo de aprobación/rechazo de observación
- [ ] Reporte exportable de observaciones

**Requisitos Técnicos:**
- Estado de observación: pendiente, aprobado, rechazado
- Notificaciones automáticas a los interesados

**Prioridad:** Alta  
**Story Points:** 5  
**Sprint:** 5  
**Dependencias:** HU-013, HU-014

**Como** docente  
**Quiero** realizar ajustes manuales en las asistencias  
**Para** corregir registros o manejar casos especiales

**Criterios de Aceptación:**

- [ ] Modificación individual de estados de asistencia
- [ ] Registro de justificaciones detalladas
- [ ] Historial de cambios con marca de tiempo y usuario
- [ ] Notificaciones automáticas a estudiantes afectados
- [ ] Diferenciación clara entre registros automáticos y manuales
- [ ] Aprobación requerida para ciertos cambios
- [ ] Reporte de modificaciones realizadas

**Requisitos de Seguridad:**

- Control de acceso basado en roles
- Registro de auditoría detallado
- Validación de permisos en tiempo real

**Prioridad:** Media  
**Story Points:** 8  
**Sprint:** 5  
**Dependencias:** HU-014
