# Colaboradores: preparación del acceso limitado

Estado: frontend preparado; no activar usuarios ni fusionar hasta aplicar y verificar las reglas en el proyecto Supabase de esta app.

| Área | Colaborador |
| --- | --- |
| Asistencia | Ver nombres y grupos; registrar asistencia en encuentros existentes |
| Cronograma | Lectura |
| Proyectos y tareas | Lectura |
| Notificaciones propias | Lectura y activación push en su dispositivo |
| Inicio con estadísticas, jóvenes y perfiles | Sin acceso |
| Datos personales, tutores y ficha médica | Sin acceso |
| Seguimiento, presupuesto y administración | Sin acceso |
| Crear, modificar o eliminar eventos/proyectos/tareas | Sin acceso |

## Backend pendiente de aplicar sobre el esquema vigente

1. Inspeccionar tablas, vistas, funciones, políticas, permisos y Storage del proyecto real. No tomar este repositorio como inventario completo de las políticas en producción.
2. Crear el rol `collaborator`; usar exclusivamente `attendance.write` en sus permisos. La autorización debe consultar `app_users` y `active`, nunca metadata editable del usuario.
3. Denegar a colaboradores el acceso directo a datos personales, tutores, salud, alertas, finanzas, auditoría, directorio completo y fotos/comprobantes. Revisar también vistas y RPC que puedan eludir RLS.
4. Conceder lectura de eventos, proyectos y tareas; registro/actualización de asistencia exclusivamente para encuentros existentes, con `recorded_by=auth.uid()`. No conceder creación de eventos ni borrado de asistencia.
5. Crear `collaborator_attendance_roster()` con retorno limitado a `id,first_name,last_name,group_name` de jóvenes activos. Este acceso a la lista debe validar un colaborador activo sin abrir las tablas con datos personales. Conceder EXECUTE solo a authenticated; revocar PUBLIC y anon. Si requiere SECURITY DEFINER, usar una función interna en esquema no expuesto, con search_path fijo, y una entrada pública SECURITY INVOKER.
6. Crear `collaborator_project_people()` con solo `id,full_name` de responsables que figuran en proyectos/tareas visibles. Protegerlo con las mismas condiciones y sin exponer correos, teléfonos ni permisos.
7. Conceder solo lectura de notificaciones dirigidas a su cuenta/rol o avisos generales; gestionar únicamente su suscripción push. Revisar la función push para no permitir el envío a terceros.
8. Crear cuentas mediante Supabase Auth Admin o el panel oficial, vincular `app_users`, sin publicar contraseñas ni claves administrativas. Evitar acceso intermedio con roles más amplios.
9. Probar con sesión real de colaborador: permisos positivos y negativos por API, rutas directas, listados, escritura, Storage, vistas y RPC. Confirmar que los instructores y administradores mantienen su acceso.
10. Desplegar el frontend y verificarlo antes de habilitar las cuatro cuentas solicitadas.

## Validación local realizada

- `npm run build`.
- Comprobaciones de acceso a rutas permitidas/prohibidas, permisos de proyectos, cuenta inactiva y ausencia de sesión.

La verificación en Supabase y la creación de las cuentas siguen pendientes de acceso al proyecto.
