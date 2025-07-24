# 5. Gestión del Proyecto

## 📈 Control de Avances

### Sprint Actual: 6

| Historia                                       | Estado        | Avance | Completado | Fecha      |
| ---------------------------------------------- | ------------- | ------ | ---------- | ---------- |
| **Sprint 1**                                   |               |        |            |            |
| HU-001: Registro Masivo de Usuarios            | ✅ Completado | 100%   | Sprint 1   | 2025-05-20 |
| HU-002: Autenticación Segura Multi-Factor      | ✅ Completado | 100%   | Sprint 1   | 2025-05-22 |
| **Sprint 2**                                   |               |        |            |            |
| HU-003: Gestión Avanzada de Perfiles           | ✅ Completado | 100%   | Sprint 2   | 2025-05-28 |
| HU-004: Creación Inteligente de Asignaturas    | ✅ Completado | 100%   | Sprint 2   | 2025-06-02 |
| **Sprint 3**                                   |               |        |            |            |
| HU-005: Dashboard Académico Unificado          | ✅ Completado | 100%   | Sprint 3   | 2025-06-05 |
| HU-006: Gestión Inteligente de Estudiantes     | ✅ Completado | 100%   | Sprint 3   | 2025-06-07 |
| HU-007: Programación Avanzada de Clases        | ✅ Completado | 100%   | Sprint 3   | 2025-06-08 |
| HU-008: Control Dinámico de Clases             | ✅ Completado | 100%   | Sprint 3   | 2025-06-09 |
| **Sprint 4**                                   |               |        |            |            |
| HU-009: Cronograma Académico Integral          | ✅ Completado | 100%   | Sprint 4   | 2025-06-10 |
| HU-010: Generación QR Avanzada                 | ✅ Completado | 100%   | Sprint 4   | 2025-06-10 |
| HU-011: Validación QR Robusta                  | ✅ Completado | 100%   | Sprint 4   | 2025-06-10 |
| HU-012: Interfaz QR Optimizada                 | ✅ Completado | 100%   | Sprint 4   | 2025-06-10 |
| **Sprint 5**                                   |               |        |            |            |
| HU-013: Registro Automático via QR             | ✅ Completado | 100%   | Sprint 5   | 2025-06-11 |
| HU-014: Dashboard de Asistencia en Tiempo Real | ✅ Completado | 100%   | Sprint 5   | 2025-06-11 |
| HU-015: Gestión Manual de Asistencias          | ✅ Completado | 100%   | Sprint 5   | 2025-06-11 |

### Próximos Sprints

- **Sprint 6 (Próximo)**:
  - HU-016: Reportes de Asistencia por Estudiante (0%)
  - HU-017: Estadísticas de Asistencia por Asignatura (0%)
  - HU-018: Exportación de Datos (0%)
- **Sprint 7**:
  - HU-019: Notificaciones Automáticas (0%)
  - HU-020: Comunicación Interna (0%)
- **Sprint 8**:
  - HU-021: Configuración del Sistema (0%)
  - HU-022: Panel de Administración Avanzado (0%)

## 📝 Planificación

### Matriz de Trazabilidad

| Epic | Historia | Prioridad | Sprint | Dependencies   |
| ---- | -------- | --------- | ------ | -------------- |
| 1    | HU-001   | Alta      | 1      | -              |
| 1    | HU-002   | Alta      | 1      | HU-001         |
| 1    | HU-003   | Media     | 2      | HU-002         |
| 2    | HU-004   | Alta      | 2      | HU-002         |
| 2    | HU-005   | Alta      | 2      | HU-004         |
| 2    | HU-006   | Alta      | 3      | HU-004, HU-005 |
| 3    | HU-007   | Alta      | 3      | HU-004         |
| 3    | HU-008   | Alta      | 3      | HU-007         |
| 3    | HU-009   | Media     | 4      | HU-007, HU-008 |
| 4    | HU-010   | Alta      | 4      | HU-008         |
| 4    | HU-011   | Alta      | 4      | HU-010         |
| 4    | HU-012   | Media     | 4      | HU-010, HU-011 |
| 5    | HU-013   | Alta      | 5      | HU-011         |
| 5    | HU-014   | Alta      | 5      | HU-013         |
| 5    | HU-015   | Media     | 5      | HU-013, HU-014 |
| 6    | HU-016   | Alta      | 6      | HU-014, HU-015 |
| 6    | HU-017   | Media     | 6      | HU-013         |
| 6    | HU-018   | Media     | 6      | HU-016         |
| 7    | HU-019   | Media     | 7      | HU-006         |
| 7    | HU-020   | Baja      | 7      | HU-019         |
| 8    | HU-021   | Media     | 8      | HU-002         |
| 8    | HU-022   | Baja      | 8      | HU-021         |

### Estimación de Esfuerzo

| Sprint | Story Points | Duración  | Historias                      |
| ------ | ------------ | --------- | ------------------------------ |
| 1      | 21           | 2 semanas | HU-001, HU-002                 |
| 2      | 26           | 2 semanas | HU-003, HU-004, HU-005         |
| 3      | 34           | 3 semanas | HU-006, HU-007, HU-008         |
| 4      | 29           | 3 semanas | HU-009, HU-010, HU-011, HU-012 |
| 5      | 29           | 3 semanas | HU-013, HU-014, HU-015         |
| 6      | 34           | 3 semanas | HU-016, HU-017, HU-018         |
| 7      | 21           | 2 semanas | HU-019, HU-020                 |
| 8      | 26           | 2 semanas | HU-021, HU-022                 |

**Total Estimado**: 220 Story Points (~20 semanas)

## 🎯 Requerimientos No Funcionales

### 🚀 Performance

- **Tiempo de respuesta**: < 2 segundos para operaciones críticas
- **Escalabilidad**: Soporte para 10,000+ usuarios concurrentes
- **Disponibilidad**: 99.5% uptime mínimo

### 🔒 Seguridad

- **Autenticación**: Multi-factor obligatorio para administradores
- **Autorización**: RBAC con permisos granulares
- **Encriptación**: HTTPS obligatorio, datos sensibles cifrados

### 🎨 Usabilidad

- **Responsive Design**: Soporte móvil completo
- **Accesibilidad**: Cumplimiento WCAG 2.1 AA
- **Internacionalización**: Soporte español/inglés

### 🔧 Compatibilidad

- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+
- **Móviles**: iOS 13+, Android 8+
- **Cámaras**: Compatibilidad con lectores QR nativos

## ⚠️ Riesgos y Mitigaciones

| Riesgo                        | Probabilidad | Impacto | Mitigación                                          |
| ----------------------------- | ------------ | ------- | --------------------------------------------------- |
| **Fraude en QR**              | Media        | Alto    | Tokens únicos, validación temporal, geolocalización |
| **Baja adopción docente**     | Alta         | Alto    | Capacitación, interfaz intuitiva, soporte técnico   |
| **Problemas de conectividad** | Alta         | Medio   | Modo offline, sincronización posterior              |
| **Escalabilidad**             | Baja         | Alto    | Arquitectura cloud-native, load balancing           |
| **Seguridad de datos**        | Baja         | Crítico | Cifrado, auditorías, cumplimiento GDPR              |

## 📊 Métricas de Éxito

### KPIs Técnicos

- **Tiempo de carga**: < 3 segundos primera visita
- **Error rate**: < 1% en operaciones críticas
- **Test coverage**: > 80% código base

### KPIs de Negocio

- **Adopción**: > 85% docentes usando el sistema
- **Satisfacción**: NPS > 8.0
- **Eficiencia**: 70% reducción tiempo registro asistencia

## 🗂️ Anexos

### Tecnologías y Herramientas

- **Project Management**: Notion + GitHub Projects
- **Design System**: Figma + shadcn/ui
- **Documentation**: GitBook + Storybook
- **API Testing**: Postman + Newman
- **Monitoring**: Sentry + Google Analytics
- **CI/CD**: GitHub Actions + Vercel

### Glosario de Términos

| Término       | Definición                                 |
| ------------- | ------------------------------------------ |
| **QR Token**  | Código único cifrado embebido en código QR |
| **Timestamp** | Marca temporal exacta de evento            |
| **RBAC**      | Role-Based Access Control                  |
| **JWT**       | JSON Web Token para autenticación          |
| **2FA**       | Two-Factor Authentication                  |
| **NPS**       | Net Promoter Score                         |
| **KPI**       | Key Performance Indicator                  |
| **DoD**       | Definition of Done                         |
| **WCAG**      | Web Content Accessibility Guidelines       |
