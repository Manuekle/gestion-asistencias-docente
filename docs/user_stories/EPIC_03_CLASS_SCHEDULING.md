# Epic 3: 🕐 Programación y Control de Clases

## Descripción

Sistema completo para la planificación, programación y control de clases, permitiendo una gestión eficiente del tiempo académico y facilitando la coordinación entre docentes y estudiantes.

## Historias de Usuario

### HU-007: Programación de Clases

**Como** docente  
**Quiero** programar mis clases  
**Para** organizar eficientemente mi calendario académico

**Criterios de Aceptación:**

- [ ] Creación de clases individuales o recurrentes
- [ ] Configuración de horarios, aulas y modalidad (presencial/virtual)
- [ ] Validación de disponibilidad de aulas y docentes
- [ ] Asignación de temas y objetivos de aprendizaje
- [ ] Configuración de políticas de asistencia
- [ ] Vista previa del calendario antes de guardar
- [ ] Notificaciones automáticas a estudiantes

**Requisitos Técnicos:**

- Integración con el sistema de aulas
- Validación de conflictos de horario
- Exportación a formatos estándar (iCal, Google Calendar)

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 3  
**Dependencias:** HU-004, HU-005

---

### HU-008: Control de Asistencia en Tiempo Real

**Como** docente  
**Quiero** gestionar la asistencia de mis clases  
**Para** mantener un registro preciso de participación

**Criterios de Aceptación:**

- [ ] Inicio/cierre de sesión de asistencia
- [ ] Registro manual de asistencia
- [ ] Escaneo de códigos QR para registro automático
- [ ] Control de retrasos y justificaciones
- [ ] Vista en tiempo real de asistencias/ausencias
- [ ] Exportación de reportes de asistencia
- [ ] Historial de cambios en registros

**Requisitos de UX:**

- Interfaz intuitiva para registro rápido
- Retroalimentación visual inmediata
- Modo fuera de línea con sincronización posterior

**Prioridad:** Alta  
**Story Points:** 8  
**Sprint:** 3  
**Dependencias:** HU-007

---

### HU-009: Visualización de Cronograma Académico

**Criterios de Aceptación:**

- [ ] Vista semanal/mensual de clases programadas
- [ ] Filtros por asignatura, docente o tipo de clase
- [ ] Indicadores de estado (pasada, en curso, próxima)
- [ ] Detalles de cada clase con un clic
- [ ] Sincronización con calendarios externos
- [ ] Notificaciones de próximas clases
- [ ] Vista móvil optimizada

**Requisitos Técnicos:**

- API para integración con otras plataformas
- Sincronización bidireccional con Google/Outlook
- Soporte para modo fuera de línea

**Prioridad:** Media  
**Story Points:** 8  
**Sprint:** 4  
**Dependencias:** HU-007
