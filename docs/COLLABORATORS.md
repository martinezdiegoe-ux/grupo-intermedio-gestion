# Acceso de colaboradores

Las migraciones `20261102225848_collaborator_role.sql` y `20261102225855_collaborator_access.sql` definen el rol y la autorización. Ejecutar la primera por separado para confirmar el nuevo valor del enum antes de usarlo en la segunda.

| Área | Colaborador |
| --- | --- |
| Asistencia | Nombres y grupos; registrar asistencia en encuentros ya cargados |
| Cronograma | Lectura |
| Proyectos y tareas | Lectura |
| Notificaciones propias | Lectura y activación push en su dispositivo |
| Inicio con estadísticas, jóvenes y perfiles | Sin acceso |
| Datos personales, tutores, ficha médica y datos privados | Sin acceso |
| Seguimiento, presupuesto y administración | Sin acceso |
| Fotos y comprobantes | Sin acceso |
| Crear, modificar o eliminar eventos/proyectos/tareas | Sin acceso |

El rol tiene únicamente `attendance.write`. La función de permisos impide ampliar su alcance agregando otras cadenas al perfil. Las políticas restrictivas conservan las políticas de los demás roles, comprueban actividad de la cuenta y bloquean acceso directo a tablas, vistas y Storage. Las RPC públicas de padrón y responsables son SECURITY INVOKER; sus funciones internas devuelven solo nombres, identificadores y grupo después de validar el rol activo.

La RPC de asistencia existente también respeta RLS. Se revocó TRUNCATE para los roles cliente porque esa operación elude RLS.

Los avisos del administrador permiten elegir colaboradores, instructores o ambos. Las notificaciones push que abren `/alertas` llevan al colaborador a `/avisos`, sin consultar seguimiento de inasistencias.

## Validación

Compilación de producción y comprobaciones de rutas permitidas/prohibidas. En la base de datos se ejecutaron pruebas transaccionales con el rol authenticated y permisos adicionales simulados: registro/edición de asistencia y lectura autorizada, bloqueo de datos privados, edición y creación de eventos/proyectos, suplantación del autor de asistencia, modificación de usuarios, notificaciones ajenas, dispositivos de terceros e inactividad. Las pruebas revierten todos sus datos y cambios de perfil. El script reproducible está en `supabase/tests/collaborator_access.sql`.

Cada nueva cuenta se crea por Supabase Auth y se vincula a `app_users` con rol collaborator y únicamente attendance.write. No incluir correos ni credenciales personales en las migraciones.
