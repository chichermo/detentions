# Proyecto Supabase compartido (Element)

Chill Outs, Detentions (Nablijven) y O2 usan **un solo** proyecto Supabase: el de Chill Outs.

## 1. Crear tablas (una vez)

1. Abre el [SQL Editor](https://supabase.com/dashboard) del proyecto **Chill Outs**.
2. Pega y ejecuta: [`supabase/shared_element_project.sql`](./supabase/shared_element_project.sql)
3. Verifica que existan:
   - `nablijven_students`, `nablijven_detentions`, `nablijven_calendar_day_settings`, …
   - `o2_incidenten`

## 2. Variables de entorno — Detentions (Vercel + local)

Usa **las mismas** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` que Chill Outs (no las del proyecto viejo `cdebshkod…`).

En Vercel → Detentions → Settings → Environment Variables → actualizar y redeploy.

Local (`.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO_CHILLOUTS.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_chillouts
```

## 3. Proyecto Supabase viejo de Detentions

Cuando la app funcione contra Chill Outs, puedes pausar/borrar el proyecto antiguo. No hace falta migrar datos (aún no hay uso real).

## 4. Prefijos

| App | Tablas |
|-----|--------|
| Chill Outs | `students`, `daily_records`, `users`, … |
| Detentions | `nablijven_*` (+ `app_settings` compartida, key `nablijven_calendar_days`) |
| O2 | `o2_incidenten` |

## 5. Código

Los `.from(...)` de Detentions apuntan a nombres en [`lib/tables.ts`](./lib/tables.ts).
