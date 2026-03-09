# Auraklak - Plataforma Full-Stack para Artistas

Red social técnica para la gestión y exposición de obras de arte, con un sistema de administración centralizado y moderación de contenido.

## Stack Tecnológico
* **Frontend:** Next.js (React) con animaciones avanzadas.
* **Backend & DB:** Supabase (PostgreSQL).
* **Autenticación:** Supabase Auth (Manejo de sesiones y roles).
* **Almacenamiento:** Supabase Storage para gestión de medios.

##  Arquitectura de Seguridad y Roles
Este proyecto fue diseñado con una mentalidad de **Seguridad por Diseño**:
* **RBAC (Role-Based Access Control):** Diferenciación estricta entre perfiles de Artista, Espectador y Administrador.
* **Panel Administrativo:** Interfaz privada para la aprobación, rechazo y edición de contenido exclusivo.
* **Integración con Supabase:** Gestión de políticas de seguridad para proteger la integridad de la base de datos.

##  Módulos Principales
* **Feed Interactivo:** Sistema de reacciones y visualización de obras en tiempo real.
* **Panel de Control:** Herramientas CRUD completas para la gestión de la comunidad.
* **Carpanta (Sub-rama):** Versión experimental con enfoque en UX tipo revista digital.
