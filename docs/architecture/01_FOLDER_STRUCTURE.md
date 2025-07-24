# Arquitectura de Carpetas (Detallada)

```
sistema-asistencias/
├── app/                                # Código fuente de la aplicación Next.js
│   ├── api/                            # Endpoints de la API (Backend)
│   ├── dashboard/                      # Vistas protegidas del dashboard
│   │   ├── admin/                      # Páginas del panel de Administrador
│   │   ├── docente/                    # Páginas del panel de Docente
│   │   ├── estudiante/                 # Páginas del panel de Estudiante
│   ├── emails/                         # Plantillas de correo transaccional (React Email)
│   ├── (auth_pages)/                   # Agrupación de rutas públicas de autenticación
│   ├── globals.css                     # Estilos globales
│   ├── layout.tsx                      # Layout principal de la aplicación
│   └── page.tsx                        # Página de inicio (Landing page)
├── components/                         # Componentes reutilizables de React
├── lib/                                # Librerías, helpers y utilidades
│   ├── auth.ts                         # Configuración de NextAuth
│   ├── prisma.ts                       # Cliente Prisma exportado como 'db' (importar SIEMPRE como { db } from '@/lib/prisma')
├── prisma/                             # Configuración de la base de datos con Prisma
│   └── schema.prisma                   # Esquema de la base de datos
└── public/                             # Archivos estáticos (imágenes, fuentes, etc.)
```
