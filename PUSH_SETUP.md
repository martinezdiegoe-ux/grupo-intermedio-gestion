# Activar notificaciones push

El aviso siempre queda guardado en la app. El push al teléfono requiere estos pasos una sola vez:

1. En Supabase SQL Editor, ejecutá `supabase/migrations/014_push_devices_grants.sql`.
2. En una computadora con Node.js, ejecutá `node scripts/generate-vapid.mjs` y guardá los tres valores que imprime. **No subas la clave privada a GitHub**.
3. En Supabase → Edge Functions → Secrets, cargá `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` con esos valores.
4. Desplegá la función `supabase/functions/push/index.ts` con nombre **push**. Podés hacerlo desde Supabase → Edge Functions → Create function, pegando el contenido de ese archivo y desplegando. Con Supabase CLI: `npx supabase login`, luego `npx supabase functions deploy push --project-ref TU_PROJECT_REF`. El project ref está en la URL de tu proyecto Supabase. No desactives la verificación JWT de la función.
5. Subí los archivos de esta actualización a GitHub y esperá a que termine la publicación de GitHub Pages. Abrí la PWA actualizada en cada teléfono, iniciá sesión y tocá la campana → **Activar en este teléfono**. Aceptá el permiso del navegador. Cada instructor debe hacerlo en su propio dispositivo.
6. Desde el panel de admin, enviá un aviso de prueba a un instructor que ya lo activó. El panel informa cuántos dispositivos recibieron el push. Al tocar la notificación, se abre Avisos.

Si un destinatario todavía no activó el permiso, verá el aviso al entrar en la app, pero no recibirá push. El envío a todos los instructores incluye únicamente cuentas activas con rol `instructor`; Diego Carrizo y Natanael Blancato entrarán cuando tengan sus usuarios creados.
