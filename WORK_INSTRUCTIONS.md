# Instrucciones para Work

Este repositorio NO debe rehacerse desde cero.

## 1. Validar starter
- `npm install`
- `npm run build`
- corregir cualquier error de TypeScript o compatibilidad.

## 2. Supabase
- copiar `.env.example` a `.env.local`;
- cargar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY;
- ejecutar SQL en orden: 001, 002, 003, 004 y storage.sql;
- cambiar VITE_USE_MOCKS=false;
- crear primer superadmin de forma segura.

## 3. Completar CRUD real
Jóvenes, tutores, ficha médica, grupos, eventos, proyectos y tareas.

## 4. Asistencia
Selector de evento; cuatro estados; upsert; Realtime; funcionamiento simultáneo; cola IndexedDB y sincronización.

## 5. Semáforo
Usar alert_rules. No codificar reglas rígidas. Evitar alertas duplicadas y registrar followups.

## 6. Cronograma
Vistas mensual, trimestral y anual; filtros; alta/edición.

## 7. Proyectos
Tareas, múltiples responsables, pesos y porcentaje calculado.

## 8. Push
Firebase sólo para FCM. Registrar tokens en push_devices y completar Edge Function send-push.

## 9. Seguridad/pruebas
Testear RLS, roles, ficha médica, offline, concurrencia, responsive y errores.

## 10. Deploy
Conectar GitHub al hosting, configurar variables, desplegar y actualizar README.

### Reglas
- commits pequeños;
- no secretos en GitHub;
- no service_role en frontend;
- no SQL destructivo sin revisión;
- no sustituir Supabase;
- usar datos ficticios durante pruebas.
