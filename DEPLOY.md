# Deploy — Base de datos + Dashboard en tiempo real

Arquitectura: **Scout (Python)** y **Bot (Telegram)** escriben en **Supabase**;
el **dashboard (Next.js)** lee y se actualiza en vivo vía **Supabase Realtime**;
todo se despliega en **Vercel**.

```
scout/bot ──► Supabase (Postgres + Realtime) ──► Vercel (Next.js dashboard)
                     ▲
              MCP supabase (opencode)
```

---

## Paso 1 — Crear el proyecto Supabase

1. Entra a <https://supabase.com/dashboard> → **New project**.
2. Elige región `us-east-1` o `sa-east-1` (latencia Colombia).
3. Guarda la contraseña de la base.

## Paso 2 — Crear el esquema

En **SQL Editor**, pega y ejecuta (en orden):

1. `supabase/migrations/0001_init.sql`  → tablas, histórico, vistas, Realtime, RLS.
2. `supabase/seed.sql`                 → catálogo de los 3 Océanos Azules.

> Alternativa con el MCP de Supabase autenticado: pide al agente
> "ejecuta esta migración en Supabase" y la aplica vía `apply_migration`.

## Paso 3 — Obtener credenciales

**Project Settings → API**:

| Credencial | Dónde | Uso |
|---|---|---|
| `SUPABASE_URL` | Project URL | scout, bot, dashboard |
| `SUPABASE_ANON_KEY` | anon public | dashboard (lectura) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | scout/bot (escritura) — **secreta** |

## Paso 4 — Configurar variables de entorno

**Backend** (scout/bot) — edita `bot/start-listener.ps1` y `run-daily.ps1`
(los bloques `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`), o define variables
de usuario:

```powershell
[Environment]::SetEnvironmentVariable('SUPABASE_URL','https://TU-PROYECTO.supabase.co','User')
[Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY','eyJ...','User')
```

**Dashboard** — crea `dashboard/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Prueba local:

```powershell
cd dashboard
npm install
npm run dev      # http://localhost:3000
```

## Paso 5 — Autenticar los MCPs en opencode

Los MCPs `supabase` y `vercel` ya están en `~/.config/opencode/opencode.json`.
Son remotos con OAuth: al reiniciar opencode, ejecuta el flujo de autenticación
que aparezca para cada uno (`/mcp` o el prompt de OAuth en el navegador).

> Reinicia opencode para que cargue el config editado (no se recarga en caliente).

El **Vercel AI Gateway** ya quedó configurado (provider `vercel` con API key
`vck_...`). Modelos disponibles con prefijo `vercel/<creator>/<model>`.

## Paso 6 — Desplegar el dashboard en Vercel

**Opción CLI** (recomendada):

```powershell
cd dashboard
vercel                       # primera vez: link/crear proyecto
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod                # deploy a producción
```

**Opción Git:** sube el repo, importa en Vercel y define **Root Directory = `dashboard`**,
luego agrega las dos variables de entorno.

> Para deploy desde la raíz del repo, crea `dashboard/vercel.json` con
> `{"buildCommand":"next build","framework":"nextjs"}` y configura el Root Directory.

## Paso 7 — Verificación

```powershell
# 1. Scout escribe en Supabase
$env:SUPABASE_URL='https://TU-PROYECTO.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='eyJ...'
python agents/brave_scout.py     # busca "[SUPABASE] Ingesta OK. run_id=..."

# 2. Alerta diaria
schtasks /run /tn "BlueOceanRE-DailyAlert"

# 3. Dashboard
# abre la URL de Vercel y verifica el badge "● Tiempo real activo"
```

## Modelo de seguridad

- El dashboard usa la **anon key** con RLS de **solo lectura** (`lectura_publica`).
- Las escrituras las hace el `service_role` (bypassa RLS), nunca el front.
- Si el dashboard debe ser privado: cambia las policies a `to authenticated` y
  activa Supabase Auth (magic link).

## Costos

- Supabase Free: 500 MB DB, Realtime incluido, 2 proyectos.
- Vercel Hobby: 1 proyecto, deploys ilimitados.
- OpenCode Go: $10–40/mes (ya en uso para el bot).
