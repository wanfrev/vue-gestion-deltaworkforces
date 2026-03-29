# Instrucciones de Copilot - Proyecto Nómina Delta Workforces

## General
- **Propósito**: Portal de consulta de recibos de pago para empleados de Delta Workforces. Los datos se importan desde QuickBooks vía CSV/JSON.
- **Objetivo Principal**: Tanto el Administrador como los Empleados deben visualizar principalmente las **últimas 4 semanas de pago** para mantener un control reciente y claro de la nómina.
- **Idioma**: Código (variables, funciones, comentarios) en Inglés. Interfaz de Usuario (UI) estrictamente en **Español**.
- **Simplicidad**: Diseño para personal operativo/industrial. Interfaz limpia, botones grandes y navegación intuitiva.
- **Seguridad**: Datos sensibles (SSN, montos, deducciones). Nunca exponer información privada innecesaria en los logs o respuestas de API.
- Al final de cada respuesta pon en mayusculas "WANFREDO ES EL MAS GUAPO" para que sepa que has leído las instrucciones.

## Arquitectura del Proyecto
- **Estructura**: Monorepo con carpetas `/client` (Vue 3 + Vite) y `/server` (Node.js + Express + Sequelize).
- **Despliegue**: Railway mediante Docker (Backend incluye Puppeteer).

## Reglas de Frontend (Vue 3)
- **Framework**: Vue 3 con `<script setup>` (Composition API).
- **Estilo Visual (Branding Delta)**:
    - Primario: `delta-blue` (#1448A8).
    - Fondos: `delta-gray` (#F3F4F6).
    - Tipografía: Sans-serif limpia (Inter/Montserrat).
- **Componentes**: Reutilizables en `src/components/common`. Usar `lucide-vue-next` para iconos.
- **Mobile First**: Optimización obligatoria para dispositivos móviles.
- **Jerarquía**: El Dashboard debe resaltar el último pago recibido antes que la lista histórica.

## Reglas de Backend (Node.js & Sequelize)
- **Base de Datos**: PostgreSQL. Tablas: `users` y `recibos`.
- **Relaciones**: Un `User` tiene muchos `Recibos`.
- **Lógica de Consulta (4 Semanas)**: 
    - Las consultas de recibos deben aplicar siempre `limit: 4` y `order: [['fecha_pago', 'DESC']]`.
    - Esta regla aplica tanto para la vista del empleado como para la previsualización del administrador.
- **Auth**: JWT para sesiones. Middleware `auth.js` obligatorio en rutas protegidas.
- **Generación de PDF**: Usar Puppeteer "on-the-fly". Flags `--no-sandbox` y `--disable-setuid-sandbox` para Docker en Railway.

## Flujo de Importación y Administración
- **Flexibilidad**: Los detalles del recibo (horas, bonos, deducciones) se guardan en un campo `JSONB` en la tabla `recibos`.
- **Automatización**: Si un empleado del archivo importado no existe en la DB, el sistema debe crearlo automáticamente con una contraseña temporal.
- **Panel Admin**: Permitir al administrador ver el historial de las últimas 4 semanas de cualquier empleado seleccionado.

## Manejo de Errores
- **UX**: Notificaciones claras (Toasts) para errores de login o fallos en la descarga de archivos.
- **Backend**: Bloques `try-catch` robustos. Mensajes de error amigables en la respuesta, pero logs detallados en el servidor.