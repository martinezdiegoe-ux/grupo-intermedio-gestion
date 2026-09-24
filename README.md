# Asamblea Cristiana — Grupo Intermedio PWA

Starter funcional v0.1.

## Incluye
- React + TypeScript + Vite;
- PWA;
- diseño oscuro/violeta similar al concepto aportado;
- login demo / Supabase;
- dashboard;
- jóvenes y perfil;
- asistencia;
- cola offline IndexedDB;
- cronograma;
- proyectos;
- alertas;
- admin;
- SQL completo inicial;
- RLS;
- Storage privado;
- guía para Work.

## Ejecutar
```bash
npm install
cp .env.example .env.local
npm run dev
```

Por defecto `VITE_USE_MOCKS=true`, así que se puede navegar sin Supabase.

## Conectar Supabase
Completar:
```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_USE_MOCKS=false
```
Ejecutar `supabase/migrations/001_schema.sql` a `004_seed.sql` en orden y luego `supabase/storage.sql`.

## Primer superadmin
Crear primero el usuario en Supabase Auth y después insertar su UUID en `app_users`. No guardar `service_role` en este proyecto.

## Deploy
Vite:
- comando de build: `npm run build`
- carpeta de salida: `dist`

Ver `WORK_INSTRUCTIONS.md` para que Work continúe la implementación.
