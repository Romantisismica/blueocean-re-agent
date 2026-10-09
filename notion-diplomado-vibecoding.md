# 🎓 Diplomado Vibecoding — Proyecto Final
# Construye un Enjambre de Agentes que detecta "Océanos Azules" Inmobiliarios

> **Curso:** Diplomado Vibecoding.
> **Sesión de referencia integrada:** *"Monetiza tus aplicaciones y servicios"* — Carolina Uribe Velasco
> (modelos de cobro, guardrails, seguridad y tarifario 2026).
>
> **Objetivo del proyecto:** que construyas **exactamente este mini programa**, paso a paso, hasta
> tenerlo funcionando igual que aquí. No hay variaciones ni ejercicios abiertos: replicas la misma
> solución, entendiendo cada pieza.
>
> **Sin credenciales.** Donde haga falta un dato real verás un marcador `<TU_...>`. Tú creas tus
> propias cuentas gratuitas.
>
> **Nivel:** principiante con curiosidad. No se asume experiencia previa en programación.

---

## 📑 Índice

- [Antes de empezar](#antes-de-empezar)
- [Módulo 0 — Los conceptos que necesitas](#módulo-0--los-conceptos-que-necesitas)
- [Módulo 1 — Arquitectura: cómo encaja todo](#módulo-1--arquitectura-cómo-encaja-todo)
- [Módulo 2 — Prepara tu entorno](#módulo-2--prepara-tu-entorno)
- [Módulo 3 — El cerebro del enjambre](#módulo-3--el-cerebro-del-enjambre)
- [Módulo 4 — El Scout: buscar en la web](#módulo-4--el-scout-buscar-en-la-web)
- [Módulo 5 — El Bot: interfaz humano-máquina](#módulo-5--el-bot-interfaz-humano-máquina)
- [Módulo 6 — El Cron: automatización](#módulo-6--el-cron-automatización)
- [Módulo 7 — La Memoria: base de datos](#módulo-7--la-memoria-base-de-datos)
- [Módulo 8 — La Vitrina: dashboard en tiempo real](#módulo-8--la-vitrina-dashboard-en-tiempo-real)
- [Módulo 9 — Los Conectores: MCPs](#módulo-9--los-conectores-mcps)
- [Módulo 10 — Prompts y secuencias](#módulo-10--prompts-y-secuencias)
- [Módulo 11 — Guardrails y seguridad (Triple Check + Kill Switch)](#módulo-11--guardrails-y-seguridad-triple-check--kill-switch)
- [Módulo 12 — Monetización del mini programa (Sesión 15)](#módulo-12--monetización-del-mini-programa-sesión-15)
- [Módulo 13 — Bugs reales y sus lecciones](#módulo-13--bugs-reales-y-sus-lecciones)
- [Anexo A — Glosario](#anexo-a--glosario)
- [Anexo B — Checklist de entrega](#anexo-b--checklist-de-entrega)

---

## Antes de empezar

### ¿Qué es "vibecoding"?

**Vibecoding** es programar *conversando* con un agente de IA: tú describes lo que quieres, la IA
escribe y ejecuta el código, y tú diriges, corriges y decides. Como dice la sesión del diplomado:
*"el dinero no está en el martillo, está en saber dónde golpear"* — el valor está en la
**arquitectura del flujo**, no en teclear código.

### ¿Qué vas a construir?

Un **enjambre de agentes** (varios programas que colaboran) que:

1. **Busca** proyectos inmobiliarios nuevos en Sabaneta y Envigado (Colombia).
2. **Clasifica** cada hallazgo por prioridad (Tier 1 = zona foco, Tier 2 = zona parecida).
3. **Guarda** todo en una base de datos (histórico consultable).
4. **Te avisa** cada mañana por Telegram.
5. **Responde** en lenguaje natural cuando le escribes.
6. **Muestra** todo en un dashboard web en tiempo real.
7. **Protege su margen** con guardrails (Triple Check + Kill Switch) — lo que verás en el Módulo 11.

> 💡 Este proyecto es, en los términos de la Sesión 15, un **"Ecosistema Multi-Agente"** con
> **cronjob** y **enjambre de agentes**, exactamente el tipo de sistema que la sesión describe.

### Cómo leer este documento

Cada módulo tiene: 🎯 **Objetivo** · 🧠 **Concepto** · 🛠️ **Manos a la obra** · ✅ **Verificación**.
**No hay ejercicios:** replicas el mismo programa tal cual. Al terminar cada módulo, tu sistema
debe funcionar igual que el descrito.

> 💡 **Regla de oro:** nunca pegues una clave real en un documento compartido. Usa variables de
> entorno o un `.env` que **no** se sube a Git.

---

## Módulo 0 — Los conceptos que necesitas

### 🧠 Concepto: el mapa mental

```
TÚ (lenguaje natural)  →  AGENTE (IA)  →  HERRAMIENTAS  →  RESULTADO
     "busca proyectos"       piensa         busca, guarda     reporte
```

| Término | Significado |
| --- | --- |
| **LLM** | El "cerebro" de texto de la IA. |
| **Prompt** | La instrucción que le das al LLM. |
| **Agente** | Programa que usa un LLM + herramientas para un objetivo. |
| **API** | Una "puerta" para pedirle cosas a otro servicio. |
| **JSON** | Formato de datos en texto. |
| **MCP** | "Enchufe" estándar para conectar agentes a servicios. |
| **Cron** | Ejecución automática programada. |
| **Base de datos** | Lugar ordenado para guardar y consultar información. |
| **RLS** | Reglas de quién ve qué fila en la base de datos. |
| **Realtime** | El dashboard se actualiza solo, sin recargar. |
| **Deploy** | Publicar tu proyecto en internet. |
| **Guardrail** | Barrera técnica que protege tu margen y tu API. |

### Los 3 "Océanos Azules" del proyecto

Un **Océano Azul** es un nicho sin competencia. Aquí monitoreamos 3:

1. **Operador de Renta Corta Event-Driven** (alquilar caro en eventos).
2. **Marketplace P2P de Parqueaderos** (vecinos alquilan su parqueadero libre).
3. **Concierge SaaS para Expats / Nómadas** (app de servicios para residentes internacionales).

Cada uno se monetiza con **fee mensual bajo**, alineado con los modelos de la Sesión 15.

---

## Módulo 1 — Arquitectura: cómo encaja todo

### 🎯 Objetivo
Entender el plano completo antes de construir.

### 🛠️ Manos a la obra: el diagrama

```
   ┌────────────┐      ┌──────────────────┐      ┌──────────────────┐
   │  BRAVE     │◄─────│  SCOUT (Python)  │─────►│  BASE DE DATOS   │
   │  (búsqueda)│      │  clasifica Tier  │      │  (Supabase)      │
   └────────────┘      └──────────────────┘      └────────┬─────────┘
                                                          │ Realtime
   ┌────────────┐      ┌──────────────────┐               ▼
   │  TELEGRAM  │◄────►│  BOT (PowerShell)│      ┌──────────────────┐
   │  (usuario) │      │  NL + comandos   │      │  DASHBOARD       │
   └────────────┘      └──────────────────┘      │  (Vercel/Next.js)│
                                                 └──────────────────┘
        todo se dispara solo con el CRON (07:00)
```

### Las 6 piezas

| Pieza | Nombre en el proyecto | Qué hace |
| --- | --- | --- |
| Cerebro | `soul.md`, `window_context.md` | Le dicen al agente quién es y qué sabe. |
| Explorador | `agents/brave_scout.py` | Busca y clasifica oportunidades. |
| Mensajero | `bot/bot_listener.ps1` | Conversa contigo y avisa. |
| Reloj | Tarea programada | Ejecuta todo cada mañana. |
| Memoria | Supabase | Guarda el histórico. |
| Vitrina | `dashboard/` | Muestra todo en vivo. |

### ✅ Verificación
Puedes explicar con tus palabras qué hace cada pieza y cómo se conectan.

---

## Módulo 2 — Prepara tu entorno

### 🎯 Objetivo
Tener las herramientas instaladas y las cuentas creadas.

### 🛠️ Manos a la obra

**1. Instala las herramientas** (verifica con el comando de la derecha):

| Herramienta | Verificar con | Para qué |
| --- | --- | --- |
| Node.js | `node --version` | Dashboard y CLIs |
| Python | `python --version` | El scout |
| Git | `git --version` | Control de versiones |
| PowerShell | (viene en Windows) | Bot y tareas |

**2. Crea las cuentas** (todas con plan gratuito):

- **Brave Search API** → <https://brave.com/search/api/> → `<TU_BRAVE_KEY>`.
- **Telegram Bot** → habla con `@BotFather` → `/newbot` → `<TU_BOT_TOKEN>`.
- **Supabase** → <https://supabase.com> → `<TU_SUPABASE_URL>` y claves.
- **Vercel** → <https://vercel.com> → cuenta.
- **OpenCode Go** (opcional, lenguaje natural) → <https://opencode.ai>.

> 🔐 Guarda cada clave en un gestor de contraseñas. Nunca en un archivo compartido.

### ✅ Verificación
`node --version`, `python --version` y `git --version` muestran versiones.

---

## Módulo 3 — El cerebro del enjambre

### 🎯 Objetivo
Crear los archivos que definen la personalidad y la memoria del agente.

### 🧠 Concepto
En lugar de esconder las instrucciones en el código, las ponemos en **archivos de texto** que el
agente lee cada vez que actúa: fáciles de editar, compartidos entre agentes y económicos en tokens.

### 🛠️ Manos a la obra

**3.1 `soul.md` — la identidad**

```markdown
# SOUL.MD - Agent Identity & Purpose
## Identity
Eres "BlueOcean RE Agent", enfocado en detectar Océanos Azules en Sabaneta y Envigado.
## Guardrail de Clasificación Geográfica
- Tier 1 (Core): Sabaneta y Envigado.
- Tier 2 (Look-a-Like): Itagüí, La Estrella, Caldas, Medellín, Bello.
- Los proyectos Tier 2 NO se descartan: se marcan como LOOK_A_LIKE.
## Reglas
- Cero suposiciones: si falta un dato, marca "Incierto" y delega.
- Protege el margen: nunca llames a la IA sin validar antes (ver Módulo 11).
```

**3.2 `window_context.md` — la memoria operativa**
Contiene la zona objetivo, el formato de datos y el catálogo de los 3 Océanos Azules con tarifas.

**3.3 `MANIFEST.json` — el índice ligero**

```json
{
  "system_name": "RE_BlueOcean_Swarm",
  "version": "1.1.0",
  "geography_strategy": {
    "tier_1_core": ["Sabaneta", "Envigado"],
    "tier_2_lookalike": ["Itagüí", "La Estrella", "Caldas", "Medellín", "Bello"]
  }
}
```

### ✅ Verificación
El bot responde con el catálogo cuando preguntas por los 3 Océanos Azules.

---

## Módulo 4 — El Scout: buscar en la web

### 🎯 Objetivo
Construir el programa que descubre proyectos inmobiliarios.

### 🧠 Concepto
**Brave Search API** es una "puerta" a la que mandas una pregunta y te devuelve resultados en
**JSON**. El Scout la llama, filtra y clasifica.

### 🛠️ Manos a la obra

**4.1** Crea `agents/brave_scout.py`:

```python
import os, json, requests

BRAVE_KEY = os.getenv("BRAVE_SEARCH_API_KEY")   # <TU_BRAVE_KEY>
URL = "https://api.search.brave.com/res/v1/web/search"

TIER_1 = ["sabaneta", "envigado"]
TIER_2 = ["itagui", "itagüí", "la estrella", "caldas", "medellin", "medellín", "bello"]

def clasificar(texto):
    t = texto.lower()
    for z in TIER_1:
        if z in t: return 1, "CORE_TARGET", z.capitalize()
    for z in TIER_2:
        if z in t: return 2, "LOOK_A_LIKE", z.capitalize()
    return 2, "LOOK_A_LIKE", "Valle de Aburrá"

def buscar(query):
    headers = {"Accept": "application/json", "X-Subscription-Token": BRAVE_KEY}
    params  = {"q": query, "count": 10, "country": "ALL"}  # ojo: "CO" NO es válido
    r = requests.get(URL, headers=headers, params=params, timeout=10)
    return r.json().get("web", {}).get("results", [])

def main():
    queries = [
        'proyectos sobre planos Sabaneta OR Envigado constructora',
        'nuevo proyecto sobre planos Valle de Aburra 2026',
    ]
    oportunidades, vistos = [], set()
    for q in queries:
        for item in buscar(q):
            if item["url"] in vistos: continue
            vistos.add(item["url"])
            tier, tipo, zona = clasificar(item["title"] + " " + item.get("description",""))
            oportunidades.append({"name": item["title"], "zone": zona,
                                  "tier": tier, "opportunity_type": tipo,
                                  "url": item["url"]})
    with open("data/scout_results.json", "w", encoding="utf-8") as f:
        json.dump({"total": len(oportunidades), "opportunities": oportunidades}, f,
                  ensure_ascii=False, indent=2)
    print(f"Listo: {len(oportunidades)} oportunidades")

if __name__ == "__main__":
    main()
```

**4.2** Ejecútalo:

```powershell
$env:BRAVE_SEARCH_API_KEY = "<TU_BRAVE_KEY>"
python agents/brave_scout.py
```

### 🧠 Concepto: el síndrome del "portal agregador"

Los buscadores devuelven páginas índice de portales (Ciencuadras, Fincaraíz, La Haus,
Metrocuadrado) en lugar de la ficha de un proyecto concreto. Eso genera "falsos positivos"
genéricos y vacíos de información. El Scout v2 aplica **3 filtros**:

1. **Exclusión de dominios agregadores** (con `-site:` en la query + blacklist).
2. **Títulos basura** descartados por expresiones regulares.
3. **Nombre propio de proyecto obligatorio** (VÁLIDO: *Kosmos* | INVÁLIDO: *Apartamentos en Sabaneta*).

```python
EXCLUDED_DOMAINS = ["fincaraiz.com.co","ciencuadras.com","metrocuadrado.com",
                    "properati.com.co","lahaus.com","mitula.com.co","trovit.com.co"]
GENERIC_TITLE_PATTERNS = [r"^\d+\s+proyectos", r"proyectos de vivienda", r"apartamentos en",
                          r"\binicio\b", r"\bportal\b", r"^inmuebles", r"\bcomprar\b", r"\bblog\b"]

def is_aggregator_or_generic(url, title):
    if any(d in url.lower() for d in EXCLUDED_DOMAINS):
        return True
    return any(re.search(p, title.lower()) for p in GENERIC_TITLE_PATTERNS)
```

**Resultado real:** de 10 resultados (con portales) a **2 proyectos individuales** (ej.
`umbral.co/proyectos/kosmos/` y `marval.com.co`). Los listados tipo "179 Proyectos en Sabaneta"
desaparecen por completo.

### ⚠️ Lección clave
La API de Brave **no acepta `country="CO"`**. Debes usar `"ALL"`. Las APIs tienen reglas estrictas.

### ✅ Verificación
En `data/scout_results.json` solo aparecen fichas de proyectos/constructoras reales; ningún
listado genérico.

---

## Módulo 5 — El Bot: interfaz humano-máquina

### 🎯 Objetivo
Un bot de Telegram que te avisa y conversa contigo.

### 🧠 Concepto
El bot pregunta en bucle "¿hay mensajes nuevos?" (*long-polling*). Si es un **comando**
(`/status`), responde fijo. Si es **lenguaje natural**, se lo pasa a un **LLM**.

### 🛠️ Manos a la obra

**5.1** Crea el bot con `@BotFather` → `<TU_BOT_TOKEN>`.

**5.2** El bucle principal (`bot/bot_listener.ps1`):

```powershell
$token = "<TU_BOT_TOKEN>"
$api = "https://api.telegram.org/bot$token"
$offset = 0
while ($true) {
  $resp = Invoke-RestMethod -Uri "$api/getUpdates?timeout=30&offset=$offset"
  foreach ($u in $resp.result) {
    $offset = [int]$u.update_id + 1
    $reply = Handle-Message -Text $u.message.text
    Send-Telegram -ChatId $u.message.chat.id -Text $reply
  }
}
```

**5.3** Lenguaje natural con un LLM: cuando el mensaje no es comando, se envía el contexto
(`soul.md` + `window_context.md` + resumen del scout) y se devuelve la respuesta.

### ⚠️ Lección clave: el encoding
`Invoke-RestMethod` a veces decodifica mal los acentos. Solución: leer la respuesta como **bytes**
y decodificar en UTF-8:

```powershell
$bytes = $resp.Content.ReadAsByteArrayAsync().Result
$json  = [System.Text.Encoding]::UTF8.GetString($bytes)
```

### ✅ Verificación
Escribe al bot *"resume los 3 nichos"* → responde con la lista.

---

## Módulo 6 — El Cron: automatización

### 🎯 Objetivo
Que todo se ejecute solo cada mañana a las 07:00.

### 🧠 Concepto
Windows no tiene "cron" (de Linux), pero tiene el **Programador de tareas** (Task Scheduler):
"ejecuta este programa todos los días a esta hora".

### 🛠️ Manos a la obra

```powershell
$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"C:\ruta\run-daily.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At '07:00'
Register-ScheduledTask -TaskName 'BlueOceanRE-DailyAlert' `
  -Action $action -Trigger $trigger -Force
```

Ver:

```powershell
Get-ScheduledTask -TaskName 'BlueOceanRE-DailyAlert' | Get-ScheduledTaskInfo
schtasks /run /tn "BlueOceanRE-DailyAlert"
```

### ⚠️ Lección clave
Las tareas con disparador "al iniciar sesión" (`-AtLogOn`) requieren **permisos de administrador**.
Alternativa sin admin: un acceso directo en la carpeta **Inicio** (Startup).

### ✅ Verificación
La tarea aparece `Ready` con `NextRunTime` a las 07:00.

---

## Módulo 7 — La Memoria: base de datos

### 🎯 Objetivo
Guardar el histórico de oportunidades en una base de datos real.

### 🧠 Concepto
Una **base de datos** guarda datos en **tablas**. **Supabase** es Postgres en la nube con dos
superpoderes: **RLS** (seguridad por fila) y **Realtime** (avisa a los clientes cuando cambia algo).

### 🛠️ Manos a la obra

**7.1** Crea el proyecto en Supabase → `<TU_SUPABASE_URL>`, `<TU_ANON_KEY>`, `<TU_SERVICE_ROLE_KEY>`.

**7.2** Tablas del mini programa:

| Tabla | Guarda |
| --- | --- |
| `opportunities` | Cada proyecto/oportunidad (tier y estado). |
| `opportunity_history` | Un snapshot por corrida (histórico). |
| `scout_runs` | Cada ejecución del scout. |
| `alerts` | Cada alerta enviada. |
| `blue_oceans` | El catálogo de los 3 nichos. |
| `bot_events` | Las conversaciones con el bot. |

**7.3** Aplícalo con un script:

```powershell
$body = '{"query":"CREATE TABLE ..."}'
Invoke-RestMethod "https://api.supabase.com/v1/projects/<TU_REF>/database/query" `
  -Method Post -Headers @{ Authorization = "Bearer <TU_ACCESS_TOKEN>" } `
  -ContentType "application/json" -Body $body
```

### ⚠️ Lección clave
`ConvertTo-Json` de PowerShell 5.1 a veces envuelve strings largos en `{"value":...}`. Solución:
escapar el JSON a mano o usar una herramienta más moderna.

### ✅ Verificación
En el panel de Supabase (Table Editor) ves tus tablas con datos.

---

## Módulo 8 — La Vitrina: dashboard en tiempo real

### 🎯 Objetivo
Publicar un panel web que se actualiza solo.

### 🧠 Concepto
**Next.js** construye webs con React. **Realtime** refresca el panel al cambiar un dato.
**Vercel** publica tu web con un comando.

### 🛠️ Manos a la obra

**8.1** Conecta a Supabase (`dashboard/lib/supabaseClient.ts`):

```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**8.2** Suscríbete a los cambios (`dashboard/app/page.tsx`):

```ts
const channel = supabase.channel('realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' },
      () => cargarDatos())
  .subscribe((s) => setEnVivo(s === 'SUBSCRIBED'));
```

**8.3** Publica:

```powershell
cd dashboard
npm install
vercel link --yes
vercel env add NEXT_PUBLIC_SUPABASE_URL production --value "<TU_SUPABASE_URL>" --force --yes
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --type config --value "<TU_ANON_KEY>" --force --yes
vercel --prod --yes
```

### 🎨 Diseño: Glassmorphism 2.0 + 3D ligero + lenguaje humano

El dashboard no se deja "feo y técnico": se diseña con criterio y se explica solo.

**Estética (Glassmorphism 2.0 + 3D ligero):**
- **Paneles de vidrio:** `backdrop-filter: blur()` + borde `rgba(255,255,255,0.1)` + highlight interior (`inset 0 1px 0`). Base off-black (no negro puro).
- **3D ligero vía WebGL nativo:** un shader de aurora lenta (esmeralda/teal/azul) como fondo. **Sin three.js** (que pesa ~150 kB): se usa WebGL crudo, ~2 kB de código.
- **Tilt 3D en CSS:** `perspective() rotateX/rotateY` en hover, solo `transform` (GPU).
- **Rendimiento/accesibilidad:** DPR ≤ 1.5, pausa al ocultar la pestaña, estático en `prefers-reduced-motion`, fondo sólido en `prefers-reduced-transparency`.
- **Acento único** (esmeralda) y tipografía `Outfit` + `JetBrains Mono` (números en mono).

**Lenguaje humano (lo más importante):**

| Código interno | Se muestra como |
| --- | --- |
| `tier 1` | **Prioritario** (Sabaneta / Envigado) |
| `tier 2` | **Referencia** (zonas vecinas) |
| `DATA_COMPLETE` | **Info completa** |
| `REQUIRES_CHATBOT_INTERACTION` | **Falta verificar** |
| `scout_runs` | **Búsquedas realizadas** |

Regla: **cada métrica y cada estado lleva una ayuda de una frase**. Si algo no se entiende de un vistazo, se reescribe. Un panel que no se entiende es un panel que no sirve.

### ⚠️ Lección clave
Las variables `NEXT_PUBLIC_` se **exponen al navegador**. Solo va ahí la **anon key**, nunca la
**service_role**. La CLI de Vercel lo detecta y pide `--type config`.

### ✅ Verificación
Abres la URL de Vercel y ves KPIs y tabla. Al insertar una fila en Supabase, se actualiza solo.

### 🗂️ El catálogo (con imágenes reales)

En vez de un gráfico abstracto, el dashboard muestra un **catálogo visual** de cada proyecto:

- **Imagen de portada real:** el scout extrae el `og:image` de la web del proyecto (`fetch_og_image`) y lo guarda en la columna `image_url`. Si no hay imagen, se muestra un degradado con las iniciales.
- **Dos vistas:** catálogo (tarjetas) y tabla (para escanear rápido), con un botón para alternar.
- **Cada tarjeta explica:** nombre, constructora, zona, prioridad, estado de la información y descripción corta.
- **Migración 0002:** añade `image_url` y `description` a `opportunities` y actualiza la RPC de ingesta.

> Regla: si una sección no se entiende o no aporta, se **reemplaza** por algo que sí (aquí, el gráfico de barras pasó a ser un catálogo).

---

## Módulo 9 — Los Conectores: MCPs

### 🎯 Objetivo
Conectar tu agente (opencode) a Supabase y Vercel sin escribir integraciones.

### 🧠 Concepto
**MCP (Model Context Protocol)** es un "enchufe" estándar para que un agente use herramientas
externas. Configuras un servidor MCP y el agente obtiene herramientas listas.

### 🛠️ Manos a la obra

En `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?features=database,development",
      "enabled": true
    },
    "vercel": {
      "type": "remote",
      "url": "https://mcp.vercel.com",
      "enabled": true
    }
  }
}
```

**Autenticación (OAuth):** reinicia opencode y autoriza en el navegador. Luego `/mcp` para ver las
herramientas.

### ⚠️ Lección clave
Los MCP remotos responden `401` hasta que te autenticas. La autenticación es interactiva (OAuth).

### ✅ Verificación
`/mcp` muestra `list_projects`, `execute_sql`, `apply_migration`, etc.

---

## Módulo 10 — Prompts y secuencias

### 🎯 Objetivo
Saber qué pedirle a la IA y en qué orden.

### 🛠️ Manos a la obra

**10.1 Meta-prompts de los agentes**

| Agente | Prompt (resumen) |
| --- | --- |
| **Scout** | "Eres el Scout. Usa Brave API. Clasifica Tier 1/2. Nunca descartes Tier 2. Salida en JSON." |
| **Social Listener** | "Monitorea Reddit/X/foros. Detecta dolores de compradores. Informe semanal." |
| **Chatbot Interactor** | "Si falta un dato, pregúntalo: entrega, tipologías, licencia renta corta." |
| **Orchestrator** | "Clasifica en Incierto / Validada / Océano Azul. No inventes datos." |

**10.2 Prompts de ejemplo para el bot**

| Escribes | Obtienes |
| --- | --- |
| `resume los 3 océanos azules` | Lista con tarifas |
| `¿cuál es el estado del enjambre?` | KPIs del último scout |
| `ejecuta el scout` | Corre el rastreo y reporta |
| `busca proyectos en Envigado` | Filtra oportunidades |

**10.3 Secuencia de construcción (el orden importa)**

```
1. Identidad y contexto (soul, window_context, MANIFEST)
2. Scout y probarlo
3. Bot y probarlo
4. Cron
5. Base de datos
6. Dashboard
7. MCPs
8. Guardrails y monetización (Módulos 11 y 12)
```

### ✅ Verificación
Puedes explicar por qué el orden importa (cada pieza necesita la anterior).

---

## Módulo 11 — Guardrails y seguridad (Triple Check + Kill Switch)

> Basado directamente en la **Sesión 15**. Es la parte que **protege tu margen** antes de llamar a
> la IA. Sin esto, un abuso puede costarte miles de dólares en tokens.

### 🎯 Objetivo
Blindar el flujo del mini programa para que nadie abuse de tu API ni te genere costos inesperados.

### 🧠 Concepto: "Primero valida. Después procesa."

La regla del diplomado es simple: **nunca llames a la IA sin validar antes**. Se valida en este
orden:

```
1. Validar firma del pago   →  2. Consultar saldo   →  3. Limitar input   →  4. Llamar a la IA   →  Kill Switch
       (Crypto/HMAC)              (Supabase)             (Code, 500 chars)
```

### 🛠️ Manos a la obra: el "Triple Check" obligatorio

En el bot (antes de llamar al LLM) implementa estas tres barreras:

```powershell
# 1. CRÉDITOS — ¿el usuario tiene saldo?
if (user.credits > 0) { ... }

# 2. FIRMA — ¿el pago es real? (evita pagos falsos)
if (webhook.signature == valid) { ... }

# 3. SANITIZACIÓN — limita el input (evita inyección de prompts)
if (input.length < limit) { ... }   # límite recomendado: 500 caracteres
```

**Kill Switch automático:**

```powershell
# Si el consumo sube un 500% en una hora → detén el flujo
if (consumo_ultima_hora > consumo_promedio * 5) { Detener-Flujo }
```

### 🔒 Reglas de oro de la Sesión 15

- **"Si tu API Key aparece en el código que el navegador lee, ya no es tuya."**
  → La `service_role` nunca va al front. En el dashboard solo la `anon key`.
- **Caso de Terror — "La Hemorragia de Tokens" (Leo Martinez):** hardcodear secretos y no validar
  webhooks → factura de **$12,000 USD en OpenAI en una sola noche** por robo de API Keys.
- **Caso de Resiliencia — Kontigo (2025):** incidente de US$340,000 → comunicación inmediata y
  reembolso del 100%. **Lección:** la transparencia es el activo más valioso.

### 🛡️ Cláusulas de "Vibe-Seguridad" (para tus contratos)

- **Límite de Responsabilidad de API:** el cliente es responsable de los costos excedentes si no
  activa los *Hard Limits* recomendados.
- **Propiedad Intelectual del Flujo:** el cliente recibe licencia de uso; el desarrollador mantiene
  la propiedad del "Motor Agéntico" (salvo *Buyout* del 300%).
- **Garantía de Blindaje:** auditoría de firmas **HMAC/SHA256** y **sanitización de inputs** como
  estándar en todos los niveles.

### ✅ Verificación
El bot rechaza inputs de más de 500 caracteres, exige saldo > 0 y se detiene ante un pico de
consumo del 500% en una hora.

---

## Módulo 12 — Monetización del mini programa (Sesión 15)

> Este módulo conecta tu mini programa con la clase **"Monetiza tus aplicaciones y servicios"**.
> No cambias el código: decides **cómo cobrar** lo que ya construiste.

### 🎯 Objetivo
Elegir y justificar el modelo de cobro del enjambre, con precios que sostienen el margen.

### 🧠 Concepto: los modelos de cobro

| Tradicionales | Era IA |
| --- | --- |
| **SaaS:** pago recurrente por acceso | **Pago por uso / créditos:** cobro según consumo |
| **Licencia:** pago por uso o propiedad | **Arbitraje de inteligencia:** capturar valor con IA |
| **Freemium:** acceso básico y conversión | **Success Fee:** cobrar cuando se logra el resultado |

### 🛠️ Manos a la obra: elegir el modelo (4 preguntas)

```
1. ¿Qué resultado compra el cliente?   → Pago único (valor concentrado)
2. ¿Con qué frecuencia usa el producto? → Créditos (consumo variable)
3. ¿Cuál es el costo marginal de los tokens? → Suscripción (valor recurrente)
4. ¿Qué modelo protege el margen?       → Success fee (resultado verificable)
```

**Aplicado a los 3 Océanos Azules:**

| Nicho | Modelo | Precio |
| --- | --- | --- |
| Renta corta event-driven | Suscripción + % | $79–149k COP/unidad/mes + 8–12% |
| Marketplace de parqueaderos | Créditos / comisión | $180–450k COP/conjunto/mes + 10–15% |
| Concierge expat | Suscripción | $20–35k COP/unidad/mes + 15–20% |

### 💰 Diseñar el precio para convertir (Bueno → Mejor → Premium)

Ruta de conversión: **propuesta única para un dolor concreto → muestra el producto → explica el
beneficio con números → permite probar el valor → añade testimonios → una sola llamada a la acción.**

- Haz visible el precio desde el inicio.
- No regales consumo costoso por defecto: valida disposición de pago.
- Un precio premium es válido cuando el resultado lo justifica.
- La suscripción no es automática: úsala cuando el valor y el costo sean recurrentes.

### 🌍 Cobrar internacionalmente: Lemon Squeezy (Merchant of Record)

```
Cliente → Lemon Squeezy (MoR) → Producto
          · Gestiona impuestos globales (IVA/VAT)
          · Cumplimiento legal y financiero
```

Delegar la operación te permite concentrarte en el producto. Tu objetivo siempre es medir el
**MRR (ingreso mensual recurrente)** después de impuestos y comisiones.

### 📊 Justificación de precios: la Fórmula ROI

> En USA, un desarrollo tradicional de 3 meses cuesta **$60,000 USD**. Tú lo entregas en 2 semanas
> por **$15,000 USD**. **Ahorro neto: $45,000 USD + 2.5 meses de ventaja competitiva.**

### 🧾 Tarifario Global Vibecoding 2026 (referencia)

| Nivel | Latam (USD) | USA (USD) | Europa (EUR) |
| --- | --- | --- | --- |
| Vibecoder Junior | $30–50/hr | $80–120/hr | €60–90/hr |
| Vibecoder Senior | $80–150/hr | $200–450/hr | €150–350/hr |
| Arquitecto de IA | $180+/hr | $500+/hr | €400+/hr |
| Micro-Agente (MVP) | $800–2,000 | $3,000–7,000 | €2,500–6,000 |
| Ecosistema Multi-Agente | $3,500–8,000 | $15,000–40,000 | €12,000–35,000 |
| Enterprise AI Layer | $10,000+ | $50,000+ | €45,000+ |

> 💡 **Tu proyecto es un "Ecosistema Multi-Agente"**: el rango de referencia es $3,500–8,000 (Latam),
> $15,000–40,000 (USA), €12,000–35,000 (Europa).

### ✅ Verificación
Puedes responder, con la Sesión 15 en mano: *¿qué modelo de cobro usas y por qué protege el margen?*

---

## Módulo 13 — Bugs reales y sus lecciones

| Síntoma | Causa | Solución | Lección |
| --- | --- | --- | --- |
| `422 Invalid country` | Brave no acepta `CO` | Usar `ALL` | Lee la doc de la API |
| Acentos rotos (`OcÃ©ano`) | Encoding Latin-1 | Decodificar bytes en UTF-8 | El texto tiene encoding invisible |
| `{"value":...}` al enviar JSON | `ConvertTo-Json` PS 5.1 | Escapador manual | Conoce tu lenguaje |
| `Acceso denegado` al crear tarea | `-AtLogOn` requiere admin | Carpeta Startup | No todo necesita permisos altos |
| `public_prefix_requires_type` | `NEXT_PUBLIC_` con credencial | `--type config` | Las variables públicas son sensibles |
| MCP `401` | OAuth no completado | Reiniciar y autorizar | La auth es interactiva |
| Cron falla (`result=1`) | Falta `chat_id` | Escribir al bot una vez | Un sistema necesita su primer "hola" |

---

## Anexo A — Glosario

| Término | Significado |
| --- | --- |
| **Agente** | Programa que usa un LLM + herramientas para un objetivo. |
| **API** | Puerta que un servicio expone para pedirle datos o acciones. |
| **Cron** | Ejecución automática programada. |
| **Deploy** | Publicar en internet. |
| **Guardrail** | Barrera técnica que protege margen y API. |
| **JSON** | Formato de datos en texto. |
| **Kill Switch** | Apagado automático ante abuso o costo inesperado. |
| **LLM** | Modelo de lenguaje (el "cerebro" de texto). |
| **MCP** | Enchufe estándar para conectar agentes a servicios. |
| **MoR** | Merchant of Record (gestiona impuestos globales por ti). |
| **MRR** | Ingreso mensual recurrente. |
| **Prompt** | Instrucción para el LLM. |
| **Realtime** | Actualización en vivo sin recargar. |
| **RLS** | Seguridad por fila en la base de datos. |
| **Success Fee** | Cobrar cuando se logra el resultado. |
| **Tier** | Nivel de prioridad (1 = foco, 2 = parecido). |
| **Vibecoding** | Programar conversando con IA. |

---

## Anexo B — Checklist de entrega

- [ ] Entorno instalado y verificado (`node`, `python`, `git`).
- [ ] `soul.md`, `window_context.md`, `MANIFEST.json` creados.
- [ ] Scout funcionando y guardando `scout_results.json`.
- [ ] Bot respondiendo a comandos y lenguaje natural.
- [ ] Tarea programada a las 07:00.
- [ ] Base de datos con las 6 tablas y una vista.
- [ ] Dashboard publicado en Vercel con Realtime.
- [ ] MCPs configurados y autenticados.
- [ ] **Guardrails activos:** Triple Check (créditos, firma, sanitización) + Kill Switch.
- [ ] **Modelo de monetización definido** con precios que sostienen el margen.
- [ ] Documentación completa (este documento).
- [ ] `.gitignore` protegiendo los secretos.

---

*Documento del Diplomado Vibecoding · Proyecto: BlueOcean RE Agent · Sin credenciales reales, listo para importar/paste en Notion.*
