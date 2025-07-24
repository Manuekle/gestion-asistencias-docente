# Epic 4: 📱 Sistema QR Inteligente y Seguro

## Descripción

Sistema avanzado de generación y validación de códigos QR para el registro de asistencia, garantizando seguridad, precisión y facilidad de uso en el proceso de marcación.

## Historias de Usuario

### HU-010: Generación de Códigos QR Seguros

**Como** docente  
**Quiero** generar códigos QR seguros  
**Para** controlar el acceso a mis clases

**Criterios de Aceptación:**

- [ ] Generación automática al iniciar la clase
- [ ] Códigos únicos con cifrado AES-256
- [ ] Tiempo de validez configurable (5-30 minutos)
- [ ] Regeneración manual con un clic
- [ ] Información visible: asignatura, hora, docente
- [ ] Códigos de respaldo generados automáticamente
- [ ] Integración con el sistema de registro de clases

**Requisitos de Seguridad:**

- Tokens JWT firmados
- Rotación de claves de cifrado
- Registro de auditoría de generación

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 4  
**Dependencias:** HU-007, HU-008

---

### HU-011: Validación de Códigos QR

**Como** sistema  
**Quiero** validar códigos QR escaneados  
**Para** garantizar la autenticidad de las asistencias

**Criterios de Aceptación:**

- [ ] Verificación de firma digital del código
- [ ] Validación de ventana temporal (timestamp)
- [ ] Comprobación de estudiante matriculado
- [ ] Prevención de reutilización de códigos
- [ ] Validación opcional por geolocalización
- [ ] Registro detallado de intentos de validación
- [ ] Notificaciones de intentos sospechosos

**Requisitos Técnicos:**

- API REST segura para validación
- Caché distribuido para verificación rápida
- Monitoreo en tiempo real de validaciones

**Prioridad:** Alta  
**Story Points:** 13  
**Sprint:** 4  
**Dependencias:** HU-010

---

### HU-012: Interfaz de Escaneo de Códigos

**Como** estudiante  
**Quiero** escanear códigos QR fácilmente  
**Para** registrar mi asistencia de forma rápida

**Criterios de Aceptación:**

- [ ] Lector de códigos QR en tiempo real
- [ ] Retroalimentación visual inmediata
- [ ] Funcionamiento en dispositivos móviles
- [ ] Modo de cámara optimizado para baja luz
- [ ] Historial de asistencias recientes
- [ ] Notificación de registro exitoso/fallido
- [ ] Soporte para códigos dañados o parciales

**Requisitos de UX:**

- Interfaz intuitiva con guía visual
- Tiempo de respuesta < 1 segundo
- Funcionalidad sin conexión con sincronización posterior

**Prioridad:** Media  
**Story Points:** 5  
**Sprint:** 4  
**Dependencias:** HU-010
