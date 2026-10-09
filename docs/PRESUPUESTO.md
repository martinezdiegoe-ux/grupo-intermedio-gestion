# Presupuesto del Grupo Intermedio

Disponible después de Proyectos. Todos los importes están expresados en pesos argentinos.

- Superadmin y admin: registran ingresos/egresos, adjuntan comprobantes y anulan con motivo.
- Instructores y líderes activos: consultan movimientos, comprobantes y exportan CSV.
- Personas sin sesión y cuentas inactivas: no tienen acceso a los fondos ni a comprobantes.

Cada movimiento registra fecha, categoría, motivo/concepto, importe, cuenta (efectivo, banco o billetera virtual), proyecto opcional, observaciones y responsable. Se pueden adjuntar JPG, PNG, WebP o PDF de hasta 10 MB. Los comprobantes son privados y se abren mediante un enlace de cinco minutos.

El saldo general incluye todos los movimientos vigentes. Los filtros por mes, tipo, cuenta y búsqueda sólo cambian la lista y su resumen; no cambian el saldo general. Los saldos por cuenta permiten conciliar con caja, banco y billetera. La exportación CSV conserva responsables y motivos de anulación de los registros seleccionados.

## Primer uso

1. Registrar el dinero existente como ingreso, categoría «Saldo inicial», en cada cuenta que corresponda.
2. Cargar ingresos con su motivo y egresos con el concepto del gasto; adjuntar el comprobante cuando exista.
3. Revisar saldos por cuenta contra el dinero real y exportar la selección mensual para rendir cuentas.

No se editan ni borran movimientos. Para corregir uno, anularlo con motivo y registrar el correcto. Una anulación queda visible al activar «Mostrar también anulados» y deja de afectar el saldo. El servidor fija el responsable y la fecha de carga; no pueden falsificarse desde el formulario.

Para trasladar dinero entre cuentas, cargar un egreso de origen y un ingreso de destino con el mismo importe y categoría «Movimiento». Esto conserva el saldo global. Los ingresos/egresos acumulados incluyen estos traslados internos; se deben tener en cuenta al preparar una rendición. Los importes aceptan coma o punto decimal y no separadores de miles.

## Base de datos

Migración nueva: `supabase/migrations/015_finance.sql`. No volver a ejecutar las migraciones iniciales. Incluye el libro financiero, permisos, función de anulación y almacenamiento privado. `016_bruno_superadmin.sql` sólo cambia el rol de la cuenta activa de Bruno Di Conza y se detiene si la identificación no es única. Bruno debe salir e ingresar nuevamente para actualizar su perfil de acceso.

Validación: compilación TypeScript/Vite; pruebas PostgreSQL en entorno aislado de permisos para administradores/instructores/inactivos/anon, importes y fechas, autor real, anulación única, saldo, comprobantes protegidos y migración idempotente; cálculos en centavos y escape de fórmulas en CSV.
