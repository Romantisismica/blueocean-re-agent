# 📘 Guía Completa — BlueOcean RE Agent
### Manual didáctico de implementación (de cero a producción)

> **Qué es:** un enjambre de agentes que detecta **Océanos Azules inmobiliarios** en Sabaneta y Envigado (Antioquia), guarda el histórico en Supabase, alerta por Telegram con **lenguaje natural** y muestra todo en un **dashboard en tiempo real** en Vercel.
>
> **Para quién:** alguien que quiera entender, reproducir o mantener el sistema paso a paso.
> **Cómo leerla:** cada sección tiene *Qué*, *Por qué*, *Cómo* (comandos reales) y *Verificación*.

---

## 0. Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Estructura de archivos](#2-estructura-de-archivos)
3. [Requisitos previos](#3-requisitos-previos)
4. [Paso a paso](#4-paso-a-paso)
   - 4.1 Identidad (`soul.md`)
   - 4.2 Contexto operativo (`window_context.md`)
   - 4.3 Manifiesto (`MANIFEST.json`)
   - 4.4 Scout de proyectos (Brave + tiering)
   - 4.5 Bot de Telegram con lenguaje natural
   - 4.6 Cronjob diario (Task Scheduler)
   - 4.7 Base de datos Supabase
   - 4.8 Dashboard Next.js + Vercel
   - 4.9 MCPs de opencode (Supabase + Vercel)
   - 4.10 Vercel AI Gateway
   - 4.11 Skills de Supabase
   - 4.12 Wiring del backend
5. [Prompts](#5-prompts)
6. [Secuencias y flujos](#6-secuencias-y-flujos)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Comandos de referencia](#8-comandos-de-referencia)
9. [Troubleshooting (bugs reales y sus fixes)](#9-troubleshooting)
10. [Seguridad](#10-seguridad)
11. [Costos](#11-costos)
12. [Roadmap](#12-roadmap)

---

## 1. Arquitectura general

### 1.1 Diagrama de sistema

```
                         ┌──────────────────────────────────────────────┐
                         │            WINDOWS (host local)               │
                         │                                              │
   ┌───────────┐         │  ┌────────────────┐    ┌──────────────────┐  │
   │  Brave    │◄────────┼──│ brave_scout.py │    │ send-alerts.ps1  │  │
   │  Search   │  HTTPS  │  │ (tiering 1/2)  │    │ (3 nichos)       │  │
   └───────────┘         │  └───────┬────────┘    └────────┬─────────┘  │
                         │          │ JSON + RPC           │            │
                         │          ▼                      │            │
                         │   data/scout_results.json       │            │
                         │                                 │            │
                         │  ┌──────────────────────────┐   │            │
   ┌───────────┐         │  │ bot_listener.ps1         │   │            │
   │ Telegram  │◄────────┼──│ long-poll + comandos +   │   │            │
   │  (bot)    │  HTTPS  │  │ lenguaje natural (LLM)   │   │            │
   └───────────┘         │  └───────┬──────────────────┘   │            │
                         │          │ bot_events            │            │
                         │          ▼                       ▼            │
                         │  ┌────────────────────────────────────────┐ │
                         │  │        Task Scheduler (Windows)         │ │
                         │  │  BlueOceanRE-DailyAlert  (07:00)        │ │
                         │  │  BlueOceanRE-BotListener (al iniciar)   │ │
                         │  └────────────────────────────────────────┘ │
                         └───────────────────────┬──────────────────────┘
                                                 │ service_role (REST/RPC)
                                                 ▼
                         ┌──────────────────────────────────────────────┐
                         │               SUPABASE (Postgres)             │
                         │  opportunities · opportunity_history ·       │
                         │  scout_runs · alerts · blue_oceans ·         │
                         │  bot_events · vistas v_kpis/v_por_zona       │
                         │  + Realtime publication                      │
                         └───────────────────────┬──────────────────────┘
                                                 │ anon key (RLS lectura)
                                                 ▼
                         ┌──────────────────────────────────────────────┐
                         │        VERCEL — Next.js Dashboard            │
                         │  KPIs · tabla · gráfico · Realtime           │
                         │  <TU-URL-VERCEL>   │
                         └──────────────────────────────────────────────┘
```

### 1.2 Componentes y responsabilidades

| Componente | Rol | Tecnología |
| --- | --- | --- |
| **Orquestador** | Sintetiza, clasifica (`Incierto` / `Oportunidad Validada` / `Océano Azul Detectado`) | `soul.md` + LLM |
| **Scout** | Descubre proyectos, clasifica Tier 1/2, escribe a Supabase | Python + Brave API |
| **Bot** | Alertas + lenguaje natural + órdenes | PowerShell + Telegram + OpenCode Go |
| **DB** | Histórico e informes | Supabase (Postgres) |
| **Dashboard** | Visualización en vivo | Next.js + Supabase Realtime (Vercel) |
| **MCPs** | Acceso de opencode a Supabase y Vercel | MCP remoto (OAuth) |

---

## 2. Estructura de archivos

```
Oportunidades de negocio/
├── soul.md                      # Identidad + guardrail Tier 1/Tier 2
├── window_context.md            # Memoria operativa + data schema
├── MANIFEST.json                # Índice de bajo consumo (v1.1.0)
├── README.md                    # Reglas de eficiencia + estructura
├── opencode.config.yml          # Orquestación declarativa
├── notion-blue-ocean-swarm.md   # Doc técnica (Partes I–III)
├── notion-guia-completa.md      # ESTA guía didáctica
├── DEPLOY.md                    # Guía de deploy
├── .env.example                 # Plantilla de credenciales backend
├── run-daily.ps1                # Wrapper: scout + alerta
├── send-alerts.ps1              # Alerta diaria (3 nichos) → Telegram + Supabase
├── agents/
│   ├── brave_scout.py           # Scout (Brave + tiering + ingest a Supabase)
│   └── prompts.md               # Meta-prompts
├── bot/
│   ├── bot_listener.ps1         # Listener Telegram (NL + comandos)
│   └── start-listener.ps1       # Launcher (credenciales)
├── supabase/
│   ├── migrations/0001_init.sql # Esquema + RPC + vistas + Realtime + RLS
│   ├── seed.sql                 # 3 Océanos Azules
│   └── apply.ps1                # Aplica migración/seed vía Management API
├── dashboard/                   # Next.js (deploy en Vercel)
│   ├── app/{layout,page}.tsx
│   ├── lib/supabaseClient.ts
│   └── package.json
└── data/
    └── scout_results.json       # Salida del scout
```

---

## 3. Requisitos previos

| Herramienta | Versión probada | Para qué |
| --- | --- | --- |
| Node.js | v24.18.0 | Vercel CLI, Next.js |
| npx | 11.16.0 | skills, supabase CLI |
| Vercel CLI | 62.4.0 | deploy + AI Gateway |
| Python | 3.13.5 (+ `requests`) | Scout |
| PowerShell | 5.1 | Scripts de bot/cron |
| Git | 2.37.3 | versionado |
| Cuenta Supabase | — | Base de datos |
| Cuenta Vercel | — | Dashboard |
| Bot Telegram | — | Alertas |

**Credenciales necesarias** (todas gratuitas salvo OpenCode Go):
- `BRAVE_SEARCH_API_KEY` (Brave Search API)
- `TELEGRAM_BOT_TOKEN` (BotFather)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN` (`sbp_...`, para la Management API)
- `LLM_API_KEY` (OpenCode Go)

---

## 4. Paso a paso

### 4.1 Identidad — `soul.md`

**Qué:** define quién es el agente y sus reglas.
**Por qué:** todos los agentes y el bot lo leen como contexto; ancla el comportamiento.

```markdown
# SOUL.MD - Agent Identity & Purpose
## Identity
Eres "BlueOcean RE Agent"... enfocado en Océanos Azules en Sabaneta y Envigado...
## Guardrail de Clasificación Geográfica (Tier & Look-a-Like Protocol)
- Tier 1 (Core Focus): Sabaneta y Envigado.
- Tier 2 (Look-a-Like): Itagüí, La Estrella, Caldas, Medellín, Bello.
- Los proyectos Tier 2 NO se descartan: se catalogan como LOOK_A_LIKE.
```

**Verificación:** el bot responde en español y clasifica hallazgos como `Incierto` / `Oportunidad Validada` / `Océano Azul Detectado`.

---

### 4.2 Contexto operativo — `window_context.md`

**Qué:** memoria viva (zona, etapa, modelo de negocio, schema, los 3 nichos).
**Por qué:** es lo que el bot inyecta al LLM para responder con datos reales.

Incluye el **Data Schema** por oportunidad (`id, name, developer, zone, tier, opportunity_type, launch_date, typologies, value_proposition, detected_gap, status`) y el **catálogo de los 3 Océanos Azules con fees**.

**Verificación:** pregunta al bot *"¿cuáles son los 3 océanos azules y su fee?"* → responde con los 3 y sus tarifas.

---

### 4.3 Manifiesto — `MANIFEST.json` (v1.1.0)

**Qué:** índice ultracompacto que los agentes leen antes que los Markdown grandes (ahorro de tokens).
**Por qué:** protocolo "Zero Token Waste".

```json
{
  "system_name": "RE_BlueOcean_Swarm",
  "version": "1.1.0",
  "geography_strategy": {
    "tier_1_core": ["Sabaneta", "Envigado"],
    "tier_2_lookalike": ["Itagüí", "La Estrella", "Caldas", "Medellín", "Bello"]
  },
  "data_contract_schema": ["id","name","developer","zone","tier","opportunity_type","launch_date","typologies","value_proposition","detected_gap","status"]
}
```

---

### 4.4 Scout de proyectos — `agents/brave_scout.py`

**Qué:** consulta Brave Search, clasifica por tier y hace upsert en Supabase.
**Por qué:** es la fuente de datos del sistema.

**Cómo:**

```powershell
$env:BRAVE_SEARCH_API_KEY = "BSA5_..."
python agents/brave_scout.py
```

**Lógica clave:**

```python
TIER_1_CORE = ["sabaneta", "envigado"]
TIER_2_LOOKALIKE = ["itagui","itagüí","la estrella","caldas","medellin","medellín","bello"]

def classify_location(text):
    for z in TIER_1_CORE:
        if z in text.lower(): return 1, "CORE_TARGET", z.capitalize()
    for z in TIER_2_LOOKALIKE:
        if z in text.lower(): return 2, "LOOK_A_LIKE", z.capitalize()
    return 2, "LOOK_A_LIKE", "Valle de Aburrá (General)"
```

Escribe `data/scout_results.json` y llama la RPC `ingest_scout_payload`.

**⚠️ Fix crítico:** Brave **no acepta `country="CO"`** (enum fijo). Usar `"ALL"`.

**Verificación:** en Supabase, `select * from v_kpis;` → `total_oportunidades > 0`.

---

### 4.5 Bot de Telegram con lenguaje natural

**Qué:** recibe órdenes y prompts libres; envía las alertas.
**Por qué:** interfaz humano-máquina del enjambre.

**Creación (BotFather):**
1. `/newbot` → nombre y `@username`.
2. Copia el **token** (`123456:AAF...`).

**Listener (`bot/bot_listener.ps1`)** — long-polling:

```powershell
while ($true) {
  $resp = Invoke-RestMethod -Uri "$apiBase/getUpdates?timeout=30&offset=$offset"
  foreach ($u in $resp.result) {
    $offset = [int]$u.update_id + 1
    Log-Supabase -Table 'bot_events' -Row @{ chat_id="$($u.message.chat.id)"; direction='in'; text=$u.message.text }
    $reply = Handle-Message -Text $u.message.text -ChatId $u.message.chat.id
    Send-Telegram -ChatId $u.message.chat.id -Text $reply
  }
}
```

**Comandos:** `/start /help /status /scout /nichos /oportunidades /proyecto <nombre>`.
**Lenguaje natural:** si `LLM_API_KEY` está presente, envía `soul.md` + `window_context.md` + resumen del scout al modelo.

**⚠️ Fix de encoding:** `Invoke-RestMethod` decodifica como Latin-1 cuando la API no manda `charset`. Se usa `HttpClient` y se lee el **byte array** en UTF-8:

```powershell
$sc = New-Object System.Net.Http.StringContent($body,[Text.Encoding]::UTF8,'application/json')
$resp = $llmClient.PostAsync($llmUrl,$sc).Result
$bytes = $resp.Content.ReadAsByteArrayAsync().Result
$json = [Text.Encoding]::UTF8.GetString($bytes)
```

**Verificación:** escribe al bot *"resume los 3 nichos con su fee"* → responde con emojis y tildes correctas.

---

### 4.6 Cronjob diario (Task Scheduler)

**Qué:** ejecuta scout + alerta a las 07:00; el listener al iniciar sesión.
**Por qué:** automatización sin servidor.

```powershell
$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -Command `"& { ... & 'run-daily.ps1' }`""
$trigger = New-ScheduledTaskTrigger -Daily -At '07:00'
$settings= New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive
Register-ScheduledTask -TaskName 'BlueOceanRE-DailyAlert' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
```

**Consultar:**

```powershell
Get-ScheduledTask -TaskName 'BlueOceanRE-DailyAlert' | Get-ScheduledTaskInfo
schtasks /run /tn "BlueOceanRE-DailyAlert"      # probar ahora
taskschd.msc                                     # interfaz gráfica
```

**⚠️ Fix:** los triggers `-AtLogOn` requieren admin (Acceso denegado). Alternativa sin admin: acceso directo en la carpeta **Startup**.

```powershell
$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'BlueOceanRE-BotListener.lnk'
$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut($lnk)
$sc.TargetPath='powershell.exe'
$sc.Arguments="-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$root\bot\start-listener.ps1`""
$sc.Save()
```

---

### 4.7 Base de datos Supabase

**Qué:** histórico + informes en Postgres con Realtime y RLS.
**Por qué:** fuente única de verdad consultable en vivo.

**Paso 1 — Crear proyecto** en <https://supabase.com/dashboard> (región `us-east-1`).

**Paso 2 — Aplicar esquema.** Opción CLI/Management API (idempotente):

```powershell
.\supabase\apply.ps1 -Ref <TU-PROYECTO> -Token sbp_...
```

El script lee `0001_init.sql` + `seed.sql`, los envía a
`POST https://api.supabase.com/v1/projects/{ref}/database/query` y devuelve las API keys.

**Contenido del esquema:**
- Tablas: `opportunities`, `opportunity_history`, `scout_runs`, `alerts`, `blue_oceans`, `bot_events`.
- RPC `ingest_scout_payload(jsonb)` → upsert + histórico, devuelve `run_id`.
- Vistas: `v_kpis`, `v_por_zona`, `v_por_dia`.
- Realtime: `alter publication supabase_realtime add table ...`.
- RLS: policy `lectura_publica` (SELECT para `anon`); escrituras con `service_role`.

**⚠️ Fix:** `ConvertTo-Json` de PowerShell 5.1 envuelve strings largos en `{"value":...}`. `apply.ps1` usa un **escapador JSON manual** para enviar el SQL correctamente.

**Verificación:**

```powershell
Invoke-RestMethod "$sbUrl/rest/v1/v_kpis?select=*" -Headers @{ apikey=$svc; Authorization="Bearer $svc" }
```

---

### 4.8 Dashboard Next.js + Vercel

**Qué:** panel en vivo (KPIs, tabla, gráfico, 3 nichos).
**Por qué:** hace visible el histórico y el estado del enjambre.

**Estructura:** `app/page.tsx` (client component) consulta Supabase y se suscribe a Realtime:

```ts
const channel = supabase.channel('realtime-blueocean')
  .on('postgres_changes', { event:'*', schema:'public', table:'opportunities' }, () => load())
  .on('postgres_changes', { event:'*', schema:'public', table:'scout_runs' }, () => load())
  .subscribe((s) => setLive(s === 'SUBSCRIBED'));
```

**Deploy:**

```powershell
cd dashboard
npm install
vercel link --yes                                   # crea el proyecto
vercel env add NEXT_PUBLIC_SUPABASE_URL production --value "https://xxx.supabase.co" --force --yes
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --type config --value "eyJ..." --force --yes
vercel --prod --yes
```

**⚠️ Fix:** con prefijo `NEXT_PUBLIC_`, el CLI exige `--type config` explícito (o renombrar + `--type secret`).

**Verificación:** `vercel curl https://<url>` → devuelve el HTML con `<title>BlueOcean RE · Dashboard</title>`.

---

### 4.9 MCPs de opencode (Supabase + Vercel)

**Qué:** dan a opencode acceso a Supabase (DB/funciones/branching) y Vercel.
**Por qué:** operar la infra desde el propio agente.

`~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching",
      "enabled": true
    },
    "vercel": { "type": "remote", "url": "https://mcp.vercel.com", "enabled": true }
  }
}
```

**Auth (OAuth):** reiniciar opencode (no hay hot-reload) → al primer uso se abre el flujo OAuth en el navegador → `/mcp` para verificar las tools (`list_projects`, `apply_migration`, `execute_sql`).

**Auth alternativa por token:**
```json
{ "mcp": { "supabase": { "type":"remote",
  "url":"https://mcp.supabase.com/mcp?features=database,development",
  "headers": { "Authorization": "Bearer {env:SUPABASE_ACCESS_TOKEN}" } } } }
```

---

### 4.10 Vercel AI Gateway

```powershell
npx vercel ai-gateway setup --agent opencode
```
- Provisiona una API key y añade el provider `vercel` a `opencode.json`.
- Respalda el archivo como `.bak`.
- Modelos con prefijo `vercel/<creator>/<model>`.

---

### 4.11 Skills de Supabase

```powershell
npx skills add supabase/agent-skills
```
Instala en `.agents/skills/`: `supabase` y `supabase-postgres-best-practices`.

---

### 4.12 Wiring del backend

**Env de usuario** (para scout/bot/cron):

```powershell
[Environment]::SetEnvironmentVariable('SUPABASE_URL','https://<TU-PROYECTO>.supabase.co','User')
[Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY','eyJ...','User')
```

**Orden de arranque:**
1. `run-daily.ps1` → scout (escribe `opportunities`/`scout_runs`) → `send-alerts.ps1` (Telegram + `alerts`).
2. `bot_listener.ps1` → long-poll → `bot_events`.

---

## 5. Prompts

### 5.1 Meta-prompts de agentes (`agents/prompts.md`)

**Scout:**
> Eres el Agente Scout... usa Brave Search API diariamente... Guardrail: Tier 1 = CORE_TARGET, Tier 2 = LOOK_A_LIKE. Nunca descartes Tier 2. Salida en `data/scout_results.json`; si faltan datos marca `REQUIRES_CHATBOT_INTERACTION`.

**Social Listener:**
> Monitorea Reddit, X, foros y comentarios de constructoras en Antioquia. Detecta dolores recurrentes. Informe semanal de "Dolores convertibles en productos de bajo fee".

**Chatbot Interactor:**
> Recopila datos faltantes cuando un registro tenga `REQUIRES_CHATBOT_INTERACTION`. Pregunta: fecha de entrega, tipologías/m², licencia para rentas cortas. Actualiza `window_context.md`.

**Orchestrator:**
> Lee `soul.md`, `MANIFEST.json` y deltas de `window_context.md`. Clasifica en `Incierto` / `Oportunidad Validada` / `Océano Azul Detectado`. No inventes: si falta evidencia → `Incierto`.

### 5.2 Prompts de ejemplo para el bot

| Prompt | Resultado esperado |
| --- | --- |
| `resume los 3 océanos azules con su fee` | Lista con emojis y tarifas |
| `¿cuál es el estado del enjambre?` | KPIs del último scout |
| `ejecuta el scout` | Corre el rastreo y reporta conteos |
| `busca proyectos en Envigado` | Consulta/filtra oportunidades |
| `¿qué es un océano azul aquí?` | Explica con el contexto del sistema |

### 5.3 Prompts de operación (usados para construir)

- "Profundiza en los 3 con Canvas + pricing + MVP"
- "Ajusta el bot para los 3 nichos"
- "Crea físicamente los archivos del enjambre"
- "El bot debe interactuar con lenguaje natural... hazlo con opencode go"
- "Ejecuta la migración y conecta el vercel"

---

## 6. Secuencias y flujos

### 6.1 Flujo diario (07:00)

```
run-daily.ps1
  ├─ python agents/brave_scout.py
  │     ├─ Brave Search (3 queries) → dedup por URL
  │     ├─ classify_location() → tier/opportunity_type
  │     ├─ check_data_completeness() → status
  │     ├─ data/scout_results.json
  │     └─ RPC ingest_scout_payload → Supabase
  └─ send-alerts.ps1
        ├─ 3 nichos × 3 queries → Telegram (Markdown)
        └─ INSERT alerts → Supabase
```

### 6.2 Interacción con el bot

```
Usuario → Telegram → getUpdates → Handle-Message
   ├─ comando (/status, /scout, ...) → respuesta directa
   └─ NL → Invoke-LLM (OpenCode Go) con soul.md + window_context.md + scout
        → sendMessage → Telegram
   └─ (ambos sentidos) → INSERT bot_events
```

### 6.3 Ingesta de datos

```
payload JSON → RPC ingest_scout_payload
   ├─ INSERT scout_runs (total, tier1, tier2)
   ├─ UPSERT opportunities (por external_id)
   └─ INSERT opportunity_history (snapshot por run)
```

### 6.4 Deploy

```
dashboard/ → vercel link → vercel env add (URL, ANON_KEY) → vercel --prod
   → Next.js build → Realtime subscribe → dashboard en vivo
```

---

## 7. Modelo de datos

```
opportunities (1) ───< opportunity_history (N)
      ▲
      │ external_id
scout_runs (1) ───< opportunity_history (N)
      │
      └── payload jsonb

alerts (N)         blue_oceans (3)      bot_events (N)
```

**Campos clave de `opportunities`:** `external_id`, `name`, `developer`, `zone`, `tier`, `opportunity_type`, `status`, `classification`, `first_seen_at`, `last_seen_at`.

**Vistas:** `v_kpis` (totales), `v_por_zona`, `v_por_dia`.

---

## 8. Comandos de referencia

```powershell
# Scout
$env:BRAVE_SEARCH_API_KEY="BSA5_..."; python agents/brave_scout.py

# Migración Supabase
.\supabase\apply.ps1 -Ref <TU-PROYECTO> -Token sbp_...

# Cron
Get-ScheduledTask -TaskName 'BlueOceanRE-DailyAlert' | Get-ScheduledTaskInfo
schtasks /run /tn "BlueOceanRE-DailyAlert"

# Bot listener
powershell -ExecutionPolicy Bypass -File bot\start-listener.ps1

# Dashboard
cd dashboard; npm run dev            # local
vercel --prod --yes                  # producción

# MCPs / skills
npx vercel ai-gateway setup --agent opencode
npx skills add supabase/agent-skills
```

---

## 9. Troubleshooting

| Síntoma | Causa | Fix |
| --- | --- | --- |
| `422 Unable to validate country` | Brave no acepta `CO` | Usar `country=ALL` |
| Acentos/emojis rotos (`OcÃ©ano`) | `Invoke-RestMethod` decodifica Latin-1 | `HttpClient` + `ReadAsByteArrayAsync()` + `UTF8.GetString()` |
| `{"query":{"value":...}}` | `ConvertTo-Json` PS 5.1 envuelve strings | Escapador JSON manual (`apply.ps1`) |
| `Acceso denegado` al crear tarea | Trigger `-AtLogOn` requiere admin | Acceso directo en carpeta Startup |
| `public_prefix_requires_type` | `NEXT_PUBLIC_` con valor tipo credencial | `--type config` explícito |
| MCP Supabase `401` | OAuth no completado | Reiniciar opencode y autorizar |
| Cron `LastTaskResult=1` | Falta `chat_id` (nadie escribió al bot) | Escribir al bot una vez |
| Dashboard sin datos | Env vars faltantes o RLS | Revisar `NEXT_PUBLIC_*` y policy `lectura_publica` |

---

## 10. Seguridad

- **Nunca** poner `service_role` en el front: solo en backend/bot.
- El dashboard usa `anon` con RLS de **solo lectura**.
- Los secrets viven en **env vars de usuario** y **Vercel env**, no en el repo.
- `.gitignore` recomendado (ver archivo creado):
  ```
  .env
  **/start-listener.ps1
  **/apply.ps1
  dashboard/.vercel
  dashboard/.env*
  ```
- Para dashboard privado: cambiar policies a `to authenticated` + Supabase Auth.

---

## 11. Costos

| Servicio | Plan | Costo |
| --- | --- | --- |
| Supabase | Free | $0 (500 MB, Realtime) |
| Vercel | Hobby | $0 |
| Brave Search API | Free tier | $0 (límite mensual) |
| Telegram Bot | — | $0 |
| OpenCode Go | Go | $10/mes (lenguaje natural del bot) |

---

## 12. Roadmap

1. **Social Listener** real (Reddit/X/IG) → `bot_events`/`alerts`.
2. **Chatbot Interactor** que complete fichas `REQUIRES_CHATBOT_INTERACTION`.
3. **Auth en el dashboard** (Supabase Auth) para hacerlo privado.
4. **Alertas push** por nicho (Tier 1 vs Tier 2).
5. **Modelo de scoring** de oportunidades (valorización + fee potencial).
6. **MCP Supabase** para que el agente aplique migraciones sin scripts.

---

*Guía generada por BlueOcean RE Agent · Listo para importar/paste en Notion.*
