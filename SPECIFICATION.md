# Especificación oficial — Grupo Intermedio PWA

PWA mobile-first para aproximadamente 120 jóvenes de 12 a 18 años.

## Módulos obligatorios
- autenticación y roles;
- dashboard;
- jóvenes/perfiles;
- tutores;
- ficha médica restringida;
- asistencia (domingo, ensayo y eventos);
- offline + sincronización;
- semáforo configurable;
- seguimiento de alertas;
- cronograma mensual/trimestral/anual;
- proyectos y tareas;
- notificaciones push;
- panel admin;
- auditoría.

## Roles
superadmin, admin, leader, instructor.

## Seguridad
Supabase Auth, RLS, Storage privado, sin registro público, service_role nunca en frontend, soft delete para jóvenes.

## Stack
React + Vite + TypeScript + PWA.
Supabase para Auth/Postgres/Storage/Realtime/Edge Functions.
Firebase sólo para FCM.
GitHub para código.
Cloudflare Pages o Vercel para frontend.
