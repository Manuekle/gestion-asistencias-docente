# 🎓 Sistema de Gestión de Asistencias (FUP)

<div align="center">
  <img src="https://fup.edu.co/wp-content/uploads/brand-white.svg" alt="Logo FUP" width="150"/>
  <p>
    <strong>Proyecto de Grado para la Fundación Universitaria de Popayán</strong>
  </p>
  <p>
    Una solución moderna para automatizar el seguimiento de la asistencia estudiantil mediante roles, QR dinámicos y reportes en tiempo real.
  </p>
</div>

---

## 🎯 Objetivo del Proyecto

Digitalizar y automatizar el proceso de registro de asistencia en la FUP, eliminando el registro manual tradicional y proporcionando herramientas analíticas para el seguimiento académico estudiantil.

---

## ✨ Características Principales

### 👤 **Gestión por Roles**

- ✅ Sistema de autenticación y autorización con 3 niveles (Admin, Docente, Estudiante).
- ✅ Paneles de control personalizados para cada rol.
- ✅ Gestión segura de perfiles y credenciales.

### 📚 **Gestión Académica**

- ✅ Creación y administración de asignaturas.
- ✅ Inscripción de estudiantes.
- ✅ Programación y gestión de clases.
- ✅ Cronograma académico integrado.

### 📱 **Sistema QR Inteligente**

- ✅ Generación automática de códigos QR únicos por clase.
- ✅ Validación temporal para evitar fraudes.
- ✅ Regeneración dinámica para mayor seguridad.

### 📊 **Registro, Dashboard y Analíticas**

- ✅ Marcado automático de asistencia vía escaneo QR.
- ✅ Ajustes y registros manuales para casos especiales.
- ✅ Dashboard de cumplimiento (docentes al día vs. en mora).
- ✅ Porcentaje de bitácoras completadas y conteo de temas impartidos.
- ✅ Reportes estadísticos descargables (PDF, Excel) para docentes y administradores.

### 🔔 **Comunicaciones y Notificaciones**

- ✅ Envío de correos a cuentas institucionales y personales.
- ✅ Notificaciones masivas mediante WhatsApp Business.
- ✅ Plantillas personalizadas y programación de avisos.

### 🛠️ **Herramientas y Utilidades**

- ✅ Módulo de carga masiva de datos (CSV/Excel) con validación y rollback.
- ✅ Sistema de observaciones para clases canceladas o no impartidas.
- ✅ Integración con Outlook para sincronizar eventos académicos.

---

## 📚 Documentación Completa

Toda la documentación detallada del proyecto, incluyendo la visión, arquitectura, historias de usuario y especificaciones de la API, se encuentra centralizada en la carpeta `/docs`.

### **[➡️ Haz clic aquí para ver la Documentación Completa](./docs/README.md)**

---

## 📋 Estado del Desarrollo

### 🏁 **Fase 1: Análisis y Diseño** (100% ✅)

### 🎯 Funcionalidades Principales

#### 👨‍💻 Panel de Administración

- Gestión de usuarios (estudiantes, docentes, administradores)
- Configuración de asignaturas y programas académicos
- Reportes y analíticas avanzadas

#### 👨‍🏫 Panel Docente

- Control de asistencia mediante códigos QR
- Gestión de clases y horarios
- Generación de reportes de asistencia
- Dashboard con estadísticas en tiempo real

#### 👨‍🎓 Panel Estudiante

- Registro de asistencia mediante escaneo QR
- Consulta de historial de asistencias
- Visualización de estadísticas personales

### 📊 Estado del Proyecto

| Fase                       | Progreso | Estado         |
| -------------------------- | -------- | -------------- |
| **1. Planeación**          | 100%     | ✅ Completado  |
| **2. Desarrollo Backend**  | 85%      | 🚧 En progreso |
| **3. Desarrollo Frontend** | 75%      | 🚧 En progreso |
| **4. Testing**             | 30%      | 🔄 En progreso |
| **5. Despliegue**          | 0%       | ⏳ Pendiente   |

---

## ⚙️ Stack Tecnológico

| Categoría         | Tecnología / Herramienta                              |
| ----------------- | ----------------------------------------------------- |
| **Frontend**      | Next.js 14, React, TypeScript, Tailwind CSS           |
| **UI Components** | shadcn/ui                                             |
| **Backend**       | Next.js API Routes, Node.js                           |
| **Base de Datos** | MongoDB Atlas                                         |
| **ORM**           | Prisma ORM (importado como 'db' desde '@/lib/prisma') |
| **Autenticación** | NextAuth.js (JWT)                                     |
| **Formularios**   | Zod + React Hook Form                                 |
| **Deployment**    | Vercel                                                |
| **Testing**       | Jest, Cypress                                         |
| **CI/CD**         | GitHub Actions                                        |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Base de       │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   Datos         │
│                 │    │                 │    │   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   Business      │    │   Data Layer    │
│   shadcn/ui     │    │   Logic         │    │   Prisma ORM    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚦 Inicio Rápido

### **Prerrequisitos**

- Node.js (v18+)
- npm (v9+)
- Una cuenta de MongoDB Atlas

### **Instalación**

1. **Clonar el repositorio:**

    ```bash
    git clone https://github.com/Manuekle/edutrack.git
    cd gestion-asistencias-docente
    ```

2. **Instalar dependencias:**

    ```bash
    npm install
    ```

3. **Configurar variables de entorno:**
    Copia `.env.example` a `.env.local` y rellena las variables.

    ```bash
    cp .env.example .env.local
    ```

4. **Sincronizar la base de datos:**

    ```bash
    npx db (cliente Prisma centralizado) db push
    ```

5. **Ejecutar el proyecto:**

    ```bash
    npm run dev
    ```

    La aplicación estará disponible en `http://localhost:3000` por defecto, o en la URL configurada en `NEXTAUTH_URL`.

---

## 🤝 Contribución

Este es un proyecto académico, pero las sugerencias son bienvenidas.

1. Fork del repositorio.
2. Crear una nueva rama para tu feature (`git checkout -b feature/AmazingFeature`).
3. Realizar un commit con tus cambios (`git commit -m 'feat: Add some AmazingFeature'`).
4. Hacer push a la rama (`git push origin feature/AmazingFeature`).
5. Abrir un Pull Request.

---

## 📞 Soporte y Contacto

**Desarrollador Principal**: Manuel Esteban Erazo Medina  
**Email**: <manuel.erazo@estudiante.fup.edu.co>  
**Institución**: Fundación Universitaria de Popayán (FUP)  
**Proyecto**: Trabajo de Grado - Ingeniería de Sistemas

**Repositorio**: [Manuekle/gestion-asistencias-docente](https://github.com/Manuekle/edutrack)  
**Issues**: [Reportar un Bug o Solicitar una Feature](https://github.com/Manuekle/gestion-asistencias-docente/issues)

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

> **Nota**: Este es un proyecto académico desarrollado como trabajo de grado para la FUP.
