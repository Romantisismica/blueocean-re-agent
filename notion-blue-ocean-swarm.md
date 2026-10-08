# 🌊 BlueOcean RE Agent — Documentación Completa del Enjambre Autónomo

> **Objetivo:** desplegar un enjambre autónomo de agentes enfocado en el rastreo diario de **océanos azules inmobiliarios en Sabaneta y Envigado** (Antioquia), para lanzar productos/servicios con **tarifas mensuales bajas** (SaaS B2B/B2C, proptech o micro-servicios).
>
> **Plataforma de orquestación:** OpenCode (u otra basada en archivos de contexto `soul.md` y `context.md`).
> **Fecha:** Octubre 2026 · **Versión:** 1.0.0

---

## 1. Arquitectura del Enjambre de Agentes

| Agente | Función principal | Herramientas / métodos |
| --- | --- | --- |
| **Orquestador (Core Agent)** | Sintetizar hallazgos, evaluar viabilidad de bajo fee mensual y consolidar informes finales. | Lectura de contextos, priorización de leads. |
| **Scout de Proyectos (Brave Agent)** | Descubrir proyectos sobre planos, fechas de lanzamiento y constructoras en Sabaneta/Envigado. | Brave Search API (búsquedas estructuradas diarias). |
| **Chatbot Interactor (Web Agent)** | Interactuar con chatbots o WhatsApps de constructoras si falta información técnica/comercial. | Scripting / Web navigation / LLM dialog generator. |
| **Social Listener Agent** | Detectar tendencias, dolores de compradores y nichos desatendidos en redes sociales/foros. | Scraping / API social media, keywords inmobiliarias. |

---

## 2. `soul.md` — Identidad y Directrices del Sistema

```markdown
# SOUL.MD - Agent Identity & Purpose

## Identity
Eres "BlueOcean RE Agent", un estratega analítico enfocado en la detección diaria de Océanos Azules en el sector inmobiliario de Colombia, especializado en el boom de **Sabaneta** y **Envigado** (Antioquia). Tu objetivo es encontrar nichos desatendidos para lanzar productos/servicios con **low monthly fees** (tarifas mensuales bajas en SaaS, corretaje recurrente o servicios proptech).

## Core Mission
1. Detectar lanzamientos sobre planos e hitos inmobiliarios en Sabaneta y Envigado.
2. Identificar vacíos en la oferta actual (ej. falta de proptechs para administración de rentas cortas, gestión de parqueaderos, coworking residencial, expat amenities).
3. Asegurar la adquisición continua de datos exactos: propuesta de valor, constructora, tipos de inmuebles, área, rango de precios y fecha exacta de lanzamiento.

## Execution Rules
- **Cero Suposiciones:** Si falta información relevante de un proyecto, activa la delegación hacia los agentes de escrutinio directo (Chatbots de constructoras / Social Listening).
- **Foco Geo-Específico:** Limita el filtrado prioritario a Sabaneta (Sabaneta Alta, Las Lomitas, Aves María, etc.) y Envigado (Zúñiga, Las Antillas, Señorial, El Esmeraldal, etc.).
- **Formato Output:** Cada hallazgo debe clasificarse como "Incierto", "Oportunidad Validada" u "Océano Azul Detectado".
```

---

## 3. `window_context.md` — Contexto Operativo Continuo

```markdown
# WINDOW_CONTEXT.MD - Operational Memory & Parameters

## Target Scope
- **Zona Geográfica:** Sabaneta y Envigado, Antioquia, Colombia.
- **Etapa Inmobiliaria:** Sobre planos, venta en pozo, pre-lanzamientos y proyectos en etapa cero.
- **Modelo de Negocio Requerido:** Soluciones con Fees Mensuales Bajos (SaaS B2B o B2C, administración micro-proptech, servicios por suscripción).

## Data Schema Required per Opportunity
- **Nombre del Proyecto:**
- **Constructora / Desarrollador:**
- **Ubicación Exacta / Sector:**
- **Fecha de Lanzamiento:**
- **Tipologías de Inmuebles:** (Áreas, habitaciones, parqueaderos)
- **Propuesta de Valor del Desarrollador:**
- **Brecha / Océano Azul Detectado:**
- **Estatus de Información:** [Completo | Incompleto - Requiere Interacción]

## Current Execution Stack
- Engine: OpenCode
- External Search API: Brave Search API
- Auxiliary Tools: Web Scraper / Automated Chat Agent
```

---

## 4. Meta-Prompts para Agentes Especializados

### 4.1 Agent Prompt: Brave Search Scout

> **System Prompt:**
> Eres el Agente Scout de Búsqueda para el sector inmobiliario en Antioquia. Tu rol es usar **Brave Search API** diariamente ejecutando queries combinadas para detectar proyectos sobre planos en Sabaneta y Envigado.
>
> **Queries tipo:**
> - `site:lanzamientos "sobre planos" Sabaneta OR Envigado constructora`
> - `nuevo proyecto apartamentos sobre planos Envigado fecha lanzamiento`
> - `"pre-lanzamiento inmobiliario" Sabaneta 2026 OR 2027`
>
> **Salida requerida:** Transmite a la memoria del enjambre la lista de proyectos con propuesta de valor, constructora y tipologías. Si faltan datos de contacto o áreas, marca con `REQUIRES_CHATBOT_INTERACTION`.

### 4.2 Agent Prompt: Social Listener

> **System Prompt:**
> Eres el Agente de Social Listening especializado en el Valle de Aburrá. Tu función es monitorear Reddit, Twitter/X, foros locales y comentarios en Instagram/TikTok de constructoras en Antioquia.
> **Objetivo:** Detectar dolores recurrentes de compradores (parqueaderos, retrasos en entregas, cuotas de administración elevadas, mala conectividad, problemas con rentas cortas/Airbnb).
> **Salida requerida:** Informes semanales de "Dolores de Mercado Convertibles en Productos de Bajo Fee".

### 4.3 Agent Prompt: Chatbot Interactor

> **System Prompt:**
> Eres un agente conversacional encargado de recopilar datos faltantes de proyectos inmobiliarios.
> Cuando recibas un registro con `REQUIRES_CHATBOT_INTERACTION`:
> 1. Analiza el enlace del sitio web de la constructora.
> 2. Interactúa con el widget/chatbot de la web (o simula la conversación estructurada de asesoría).
> 3. Formula preguntas precisas:
>    - *"¿Cuál es la fecha estimada de entrega y el inicio de preventas?"*
>    - *"¿Qué tipologías de apartamentos tienen disponibles y cuáles son los metros cuadrados?"*
>    - *"¿El proyecto cuenta con licencia para rentas cortas o algún diferencial en zonas comunes?"*
> 4. Actualiza la ficha del proyecto en `window_context.md`.

---

## 5. Orquestación para OpenCode (`opencode.config.yml`)

```yaml
name: BlueOcean-RealEstate-Swarm
version: "1.0"

context_files:
  - soul.md
  - window_context.md

agents:
  orchestrator:
    role: "Sintetizador y Evaluador de Oportunidades"
    prompt_ref: "soul.md"

  brave_scout:
    role: "Buscador diario vía Brave Search API"
    tools:
      - name: brave_search
        api_key: "${BRAVE_SEARCH_API_KEY}"
    schedule: "0 8 * * *"

  social_listener:
    role: "Extractor de dolores e hilos de conversión"
    schedule: "0 12 * * *"

  chatbot_interactor:
    role: "Completador de datos de constructoras"
    trigger: "on_flag:REQUIRES_CHATBOT_INTERACTION"

workflow:
  step_1:
    agent: brave_scout
    action: "Ejecutar búsquedas de lanzamientos en Sabaneta y Envigado."
  step_2:
    agent: chatbot_interactor
    action: "Completar fichas de proyectos con vacíos de información."
  step_3:
    agent: social_listener
    action: "Cruzar proyectos encontrados con conversación social en la zona."
  step_4:
    agent: orchestrator
    action: "Generar reporte diario de Océanos Azules para productos de bajo fee."
```

---

## 6. `README.md` — Directrices de Eficiencia Operativa

```markdown
# Real Estate Blue Ocean Swarm (Sabaneta & Envigado)

## 🎯 Propósito del Sistema
Enjambre autónomo de agentes enfocado en descubrir oportunidades de mercado ("Océanos Azules") en el boom inmobiliario de **Sabaneta** y **Envigado** (Antioquia), para el despliegue de productos PropTech/Servicios con **fees mensuales bajos**.

## ⚡ Protocolo Estricto de Ahorro de Tokens (Token Economy Rules)
1. **Zero Fluff Policy:** No incluyas saludos, introducciones, ni cortesías en las comunicaciones inter-agente.
2. **Structured Outputs Only:** Todas las transferencias deben ser en formatos planos estructurados (JSON denso o tablas Markdown reducidas).
3. **Context Truncation:** No leas archivos completos de contexto si solo necesitas un parámetro. Consulta el `MANIFEST.json` primero.
4. **Lazy Retrieval:** El agente `chatbot_interactor` solo se activa bajo `REQUIRES_CHATBOT_INTERACTION`.
5. **One-Shot Queries:** Maximiza parámetros específicos en Brave Search API para evitar iteraciones redundantes.

## 🏗️ Estructura del Proyecto
- `soul.md` → Identidad y reglas del sistema.
- `window_context.md` → Memoria operativa y registros actualizados.
- `MANIFEST.json` → Índice estático de contexto de bajo consumo de tokens.
- `README.md` → Instrucciones de diseño e higiene del enjambre.
```

---

## 7. `MANIFEST.json` — Manifiesto de Alto Rendimiento

```json
{
  "system_name": "RE_BlueOcean_Swarm",
  "version": "1.0.0",
  "token_budget_optimization": true,
  "target_geography": ["Sabaneta", "Envigado"],
  "target_stage": "Sobre Planos / Ventas en Pozo / Pre-Lanzamientos",
  "monetization_focus": "Low Monthly Fees (PropTech SaaS / Subscription / Micro-Services)",
  "agents_manifest": {
    "orchestrator": {
      "file": "soul.md",
      "trigger": "always_on",
      "max_context_tokens": 1000
    },
    "brave_scout": {
      "trigger": "cron_daily_0800",
      "search_engine": "Brave_Search_API",
      "search_terms": [
        "site:lanzamientos 'sobre planos' Sabaneta",
        "site:lanzamientos 'sobre planos' Envigado",
        "pre-lanzamiento apartamento Envigado 2026 OR 2027",
        "constructora nuevo proyecto Sabaneta"
      ]
    },
    "chatbot_interactor": {
      "trigger_flag": "REQUIRES_CHATBOT_INTERACTION",
      "execution_mode": "on_demand_lazy"
    },
    "social_listener": {
      "trigger": "cron_weekly",
      "target_platforms": ["Reddit", "Twitter/X", "Instagram Comments"]
    }
  },
  "data_contract_schema": [
    "id", "name", "developer", "zone", "launch_date",
    "typologies", "value_proposition", "detected_gap", "status"
  ]
}
```

---

## 8. Flujo de Ejecución Optimizado (Zero Token Waste)

```
[ Cron Task / Evento ]
          │
          ▼
1. Agente lee MANIFEST.json (~150 tokens)
          │
          ├──────► Búsqueda precisa con Brave Search API
          │
          ▼
2. Agente registra hallazgos usando Data Contract Schema
          │
          ├──────► ¿Información incompleta? ──► [ Flag: REQUIRES_CHATBOT_INTERACTION ]
          │                                                     │
          │                                                     ▼
          │                                       Chatbot Interactor se activa
          ▼
3. Orquestador lee solo deltas en window_context.md
          │
          ▼
4. Generación del informe diario de Océanos Azules
```

---

# PARTE II — Profundización de los 3 Océanos Azules

## 🟦 Océano Azul #1 — Operador de Renta Corta Event-Driven (DAVIarena / Ciudad Peldar)

**Hipótesis:** DAVIarena (17.200 personas por evento) y Ciudad Peldar generarán picos de demanda de alojamiento que la oferta hotelera local no cubre; los operadores de renta corta actuales son genéricos y no especializados en eventos.

### Business Model Canvas

| Bloque | Detalle |
| --- | --- |
| **Segmentos de clientes** | (1) Inversionistas/compradores de Fokus Ultra, Nature Bio/Aqua, Central Park, Murano, Acento. (2) Asistentes a eventos y turistas de conciertos. (3) Empresas que alojan staff en eventos. |
| **Propuesta de valor** | "Tu apartamento factura como hotel en cada evento." Precios dinámicos por calendario DAVIarena, check-in digital, housekeeping, marketing bilingüe, reportes de ocupación. |
| **Canales** | Salas de ventas de constructoras (partner), grupos de inversionistas, Instagram/TikTok, WhatsApp, Airbnb/Booking integrados. |
| **Relación con clientes** | Onboarding presencial 1:1, dashboard de ingresos, soporte WhatsApp, reporte mensual. |
| **Fuentes de ingreso** | 8-12% de ingresos por reserva + $50.000 COP/mes por unidad. Upsells: housekeeping, fotografía, staging, seguro. |
| **Recursos clave** | Software de PMS + pricing dinámico, red de housekeeping, contratos con edificios, calendario de eventos en tiempo real. |
| **Actividades clave** | Captación de propietarios, pricing por evento, gestión de huéspedes, limpieza, mantenimiento, cumplimiento normativo. |
| **Socios clave** | Constructoras (Fokus Ultra/GIRA, Capital, Umbral), administraciones PH, DAVIarena/BeatHub, plataformas OTA, cerrajería digital. |
| **Estructura de costos** | Desarrollo de software, comisiones OTA (~15%), housekeeping (~$60-90k COP/limpieza), marketing, soporte, cumplimiento. |

### Pricing

| Plan | Precio | Incluye |
| --- | --- | --- |
| **Starter** | $79.000 COP/mes + 10% por reserva | Listing, pricing básico, comunicación con huésped. |
| **Pro** | $149.000 COP/mes + 8% por reserva | Todo lo anterior + pricing dinámico por evento, housekeeping coordinado, fotografía. |
| **Elite (multi-unidad)** | $119.000 COP/mes por unidad (≥3 unidades) + 7% | Gerente dedicado, reportes, staging. |

**Unit economics objetivo:** 1 unidad operada = ~$150k COP/mes ingreso fijo + ~$1.2M COP/mes ingreso variable (20 noches × $180k × 8% ≈ $288k; con fee fijo total ≈ $438k/mes por unidad). Punto de equilibrio con 40-60 unidades.

### MVP (8-12 semanas)

1. **Semana 1-2:** Landing + WhatsApp para captar 10 propietarios en Fokus Ultra / Nature Aqua / Murano.
2. **Semana 3-6:** PMS no-code (Airtable + n8n/Make) + iCal sync a Airbnb/Booking + motor de pricing manual basado en calendario DAVIarena.
3. **Semana 7-10:** Onboarding 5 unidades piloto, contrato piloto, operación manual asistida.
4. **Semana 11-12:** Medir ocupación y ADR vs. mercado; decidir build propio vs. white-label (Guesty/Hostaway).

**Stack MVP:** Airtable + n8n/Make + WhatsApp Business + Guesty (white-label) + Google Calendar DAVIarena.

**Métricas de éxito:** ≥60% ocupación en semanas de evento, ADR 40% superior al mercado base, NPS propietario >8.

---

## 🟦 Océano Azul #2 — Marketplace P2P de Parqueaderos en Conjuntos Masivos

**Hipótesis:** Los nuevos proyectos masivos tienen sobredotación de parqueaderos (hasta 1:1 o más) y muchos propietarios inversionistas no tienen vehículo. El alquiler vecino-vecino dentro del conjunto está desatendido: los competidores atacan parqueaderos comerciales, no residenciales.

### Business Model Canvas

| Bloque | Detalle |
| --- | --- |
| **Segmentos de clientes** | (1) Propietarios con parqueaderos libres (inversionistas sin carro, residentes con 2+ cupos). (2) Residentes que necesitan cupo/segundo carro. (3) Visitantes. (4) Administraciones PH. |
| **Propuesta de valor** | "Convierte tu parqueadero vacío en ingreso recurrente sin mover un dedo." App con reserva, pago, control de acceso digital y verificación de placas (LPR). |
| **Canales** | Administraciones PH (convenio), asambleas, grupos de residentes, constructoras, QR en portería. |
| **Relación con clientes** | Autoservicio in-app, soporte chat, reporte mensual a la administración. |
| **Fuentes de ingreso** | 12-15% de comisión por transacción + $25.000 COP/mes opcional por reserva garantizada. Fee de integración LPR para conjuntos grandes. |
| **Recursos clave** | Software de reservas + pagos, integración con control de acceso/LPR, acuerdos con administraciones. |
| **Actividades clave** | Onboarding de conjuntos, verificación de cupos, soporte, cobros, conciliación. |
| **Socios clave** | Administraciones PH, PGS Colombia / AccessPark / Park 365 (integración LPR), pasarelas de pago (Wompi/Mercado Pago), constructoras. |
| **Estructura de costos** | Desarrollo de app, comisiones de pago (~2.5-3.5%), soporte, hardware LPR (opcional, costeado por el conjunto). |

### Pricing

| Plan | Precio | Dirigido a |
| --- | --- | --- |
| **Free** | 0 | Conjuntos <50 unidades; 15% por transacción. |
| **Conjunto** | $180.000 COP/mes | Hasta 200 unidades; 12% por transacción. |
| **Enterprise** | $450.000 COP/mes | >500 unidades; 10% por transacción + integración LPR. |
| **Propietario** | Gratis para publicar | Solo paga al rentar. |

**Unit economics objetivo:** Conjunto de 900 aptos (Nature Bio) con 15% de cupos subutilizados (≈140 cupos) × $150k COP/mes promedio × 12% ≈ $2.5M COP/mes por conjunto. Punto de equilibrio con 8-12 conjuntos.

### MVP (6-10 semanas)

1. **Semana 1-2:** Validación con 3 administraciones PH de Nature Bio, Nature Aqua, Murano, Acento.
2. **Semana 3-5:** MVP web + app con gestión de cupos, reservas por hora/día/mes, pago con Wompi, QR de acceso manual (portería confirma).
3. **Semana 6-8:** Piloto en 1 conjunto con 20 cupos; medir transacciones y fricción.
4. **Semana 9-10:** Integrar lectura de placas con un socio (AccessPark/PGS) o mantener QR.

**Stack MVP:** Web app (Next.js) + Supabase + Wompi + WhatsApp (notificaciones) + QR.

**Métricas de éxito:** ≥30% de cupos subutilizados activados, ≥1 transacción/cupo/mes, retención de conjunto >90%.

---

## 🟦 Océano Azul #3 — Concierge SaaS para Expats / Nómadas en Edificios Nuevos

**Hipótesis:** Los edificios nuevos (RIO, Nature Bio/Aqua, Murano, Acento) ya incluyen amenities tipo hotel (gym, coworking, spa, pet spa, piscina), pero no existe una capa digital unificada ni servicios en inglés para el creciente mercado expat/nómada de Envigado y Sabaneta.

### Business Model Canvas

| Bloque | Detalle |
| --- | --- |
| **Segmentos de clientes** | (1) Administraciones PH de edificios nuevos. (2) Residentes expats/nómadas. (3) Propietarios que arriendan amoblado a extranjeros. (4) Constructoras (valor agregado de venta). |
| **Propuesta de valor** | "La app de edificio para residentes internacionales." Reserva de amenities, concierge bilingüe, housekeeping, delivery, tours, comunidad y guía local. |
| **Canales** | Convenios con administraciones PH, constructoras (como diferenciador), grupos expat, Airbnb amoblados. |
| **Relación con clientes** | Onboarding del conjunto, comunidad in-app, soporte bilingüe, reporte de uso a la administración. |
| **Fuentes de ingreso** | $20.000-35.000 COP/unidad/mes pagado por la administración; comisión por servicios (tours, limpieza, gym, coworking); patrocinios locales. |
| **Recursos clave** | App white-label, contenido bilingüe, red de proveedores locales, integración con administración. |
| **Actividades clave** | Onboarding PH, curaduría de servicios, soporte, contenido, alianzas locales. |
| **Socios clave** | Administraciones PH, tour operators, gimnasios, restaurantes, housekeeping, constructoras, Colombia Move, grupos expat. |
| **Estructura de costos** | Software, contenido/traducción, soporte bilingüe, comisiones de proveedores. |

### Pricing

| Plan | Precio | Dirigido a |
| --- | --- | --- |
| **Building Basic** | $20.000 COP/unidad/mes | Reserva de amenities + directorio bilingüe. |
| **Building Pro** | $35.000 COP/unidad/mes | + concierge, servicios (limpieza, tours), comunidad. |
| **Partner Constructora** | $12.000 COP/unidad/mes (preventa) | Embebido como beneficio de compra. |
| **Servicios** | 15-20% comisión | Tours, limpieza, gym, coworking. |

**Unit economics objetivo:** Edificio de 400 unidades × $35.000 COP × 40% adopción ≈ $5.6M COP/mes por conjunto. Punto de equilibrio con 4-6 conjuntos.

### MVP (8-12 semanas)

1. **Semana 1-2:** Entrevistas con administraciones de RIO, Nature Bio/Aqua, Murano; validar disposición a pagar.
2. **Semana 3-6:** App white-label (Glide/FlutterFlow) con reserva de amenities, directorio bilingüe, chat de comunidad.
3. **Semana 7-9:** Piloto en 1 edificio; agregar 3 servicios (limpieza, tour, delivery).
4. **Semana 10-12:** Medir adopción, NPS y uso de amenities; decidir app nativa.

**Stack MVP:** FlutterFlow/Glide + Supabase + WhatsApp Business API + traducción (DeepL) + pasarela de pago.

**Métricas de éxito:** ≥40% de unidades activas, ≥3 servicios usados/mes por usuario, NPS expat >40.

---

## 📊 Comparativo de los 3 Océanos Azules

| Criterio | #1 Renta Corta | #2 Parqueaderos | #3 Concierge Expat |
| --- | --- | --- | --- |
| **Time to MVP** | 8-12 semanas | 6-10 semanas | 8-12 semanas |
| **Inversión inicial estimada** | $8-15M COP | $6-12M COP | $8-15M COP |
| **Fee mensual al usuario** | $79-149k COP/unidad | $0-450k COP/conjunto | $20-35k COP/unidad |
| **Break-even** | 40-60 unidades | 8-12 conjuntos | 4-6 conjuntos |
| **Riesgo principal** | Dependencia calendario eventos | Convenio con administración PH | Adopción por administraciones tradicionales |
| **Ventaja defensiva** | Datos de pricing por evento | Efecto de red intra-conjunto | Comunidad y contenido bilingüe |

---

## 🕒 Ubicación del Cronjob (alerta diaria 7:00 a.m.)

El cronjob del bot de Telegram está registrado como **tarea programada de Windows** (equivalente a cron en Windows).

**Consultar / verificar desde la terminal:**

```powershell
Get-ScheduledTask -TaskName 'BlueOceanRE-DailyAlert' | Get-ScheduledTaskInfo
```

**Ver la configuración completa:**

```powershell
Get-ScheduledTask -TaskName 'BlueOceanRE-DailyAlert' | Format-List *
```

**Abrir la interfaz gráfica de Windows Task Scheduler:**

```powershell
taskschd.msc
```
Ruta en la interfaz: `Task Scheduler Library` → `BlueOceanRE-DailyAlert`.

**Ejecutar manualmente (prueba):**

```powershell
schtasks /run /tn "BlueOceanRE-DailyAlert"
```

**Ver el resultado de la última ejecución:**

```powershell
Get-ScheduledTaskInfo -TaskName 'BlueOceanRE-DailyAlert' | Select-Object LastRunTime, LastTaskResult, NextRunTime
```

> `LastTaskResult = 0` significa éxito. Otros valores indican error (ver tabla de códigos de Task Scheduler).

---

# PARTE III — Base de datos, Dashboard y MCPs (v1.2)

## 9. Base de datos Supabase — histórico e informes

**Proyecto:** creado en Supabase. Migración en `supabase/migrations/0001_init.sql` + seed en `supabase/seed.sql`.

### Tablas
| Tabla | Rol |
| --- | --- |
| `opportunities` | Catálogo vivo de proyectos/oportunidades (tier, zona, estado, gap). |
| `opportunity_history` | Snapshot JSON por corrida (histórico de cambios). |
| `scout_runs` | Cada ejecución del scout (total, tier1, tier2, payload). |
| `alerts` | Histórico de alertas enviadas por el bot. |
| `blue_oceans` | Catálogo de los 3 Océanos Azules con fees. |
| `bot_events` | Trazas bidireccionales de la conversación con el bot. |

### Función de ingesta
`public.ingest_scout_payload(payload jsonb)` → hace **upsert** por `external_id`, inserta en `scout_runs` e histórico, y devuelve el `run_id`.

### Vistas de informe
`v_kpis`, `v_por_zona`, `v_por_dia`.

### Tiempo real + seguridad
- `opportunities`, `scout_runs`, `alerts`, `bot_events` añadidas a la publicación `supabase_realtime`.
- RLS activo; policy `lectura_publica` (SELECT) para el dashboard con `anon`; escrituras con `service_role`.

## 10. Dashboard Next.js (`dashboard/`)

| Elemento | Detalle |
| --- | --- |
| Stack | Next.js 14 (App Router) + `@supabase/supabase-js` |
| Datos | `v_kpis`, `opportunities`, `scout_runs`, `blue_oceans` |
| Tiempo real | `supabase.channel(...).on('postgres_changes', ...)` → refresco en vivo |
| UI | KPIs, gráfico de corridas, tabla filtrable por tier, tarjetas de los 3 nichos |
| Deploy | Vercel (Root Directory = `dashboard`) |

**Proyecto Vercel creado:** `romantisismicas-projects/dashboard`.

## 11. Vercel AI Gateway en OpenCode

```powershell
npx vercel ai-gateway setup --agent opencode
```

Efectos:
- Provisiona una **AI Gateway API key** (provider `vercel` en `opencode.json`).
- Añade el provider `vercel` a `~/.config/opencode/opencode.json`.
- Respalda el archivo como `.bak`.
- Modelos disponibles con prefijo `vercel/<creator>/<model>`.

Config resultante (extracto):

```json
{
  "provider": {
    "vercel": { "options": { "apiKey": "vck_..." } }
  }
}
```

## 12. MCPs de OpenCode (Supabase + Vercel)

Config en `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching",
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

### Auth de Supabase MCP (OAuth)
1. Reinicia opencode (el config no se recarga en caliente).
2. Al primer uso, opencode detecta el MCP remoto y **abre el flujo OAuth** en el navegador.
3. Autoriza con tu cuenta Supabase → el token queda guardado por opencode.
4. Verifica con `/mcp`: deben aparecer tools como `list_projects`, `apply_migration`, `execute_sql`, `list_tables`.

### Auth alternativa por token (sin OAuth)
```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?features=database,development",
      "headers": { "Authorization": "Bearer {env:SUPABASE_ACCESS_TOKEN}" }
    }
  }
}
```
(Genera el token en <https://supabase.com/dashboard/account/tokens>.)

### Auth de Vercel MCP
Igual patrón OAuth al primer uso (responde `401` hasta autenticar).

> Nota: `command` en MCP local es siempre array; los MCP remotos no necesitan `command`.

## 13. Skills instaladas

```powershell
npx skills add supabase/agent-skills
```
Instala en `.agents/skills/`:
- `supabase`
- `supabase-postgres-best-practices`

## 14. Flujo end-to-end

```
[Task 7:00 a.m.] run-daily.ps1
        │
        ├─► agents/brave_scout.py
        │      ├─ Brave Search (tiering Tier 1 / Tier 2)
        │      ├─ data/scout_results.json
        │      └─ RPC ingest_scout_payload ─► Supabase
        │
        └─► send-alerts.ps1 ─► Telegram ─► (log) alerts

[Bot listener] bot/bot_listener.ps1
        ├─ Telegram getUpdates (long-poll)
        ├─ comandos + NL (OpenCode Go deepseek-v4-flash)
        └─ (log) bot_events ─► Supabase

[Supabase Realtime] ─► dashboard Vercel ─► KPIs y tabla en vivo
```

## 15. Estado (completado)

| Item | Estado |
| --- | --- |
| Proyecto Supabase | ✅ `oportunidades_negocio` (ref `<TU-PROYECTO>`, us-east-1) |
| Migración + seed | ✅ aplicados vía `supabase/apply.ps1` |
| Datos | ✅ 10 oportunidades (Tier1=9, Tier2=1) + 3 océanos |
| MCPs (supabase, vercel) | ✅ configurados en opencode |
| Vercel AI Gateway | ✅ provider `vercel` + key |
| Skills Supabase | ✅ instaladas (`npx skills add supabase/agent-skills`) |
| Proyecto Vercel | ✅ `romantisismicas-projects/dashboard` |
| Env del dashboard | ✅ `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` (production + preview) |
| Deploy producción | ✅ <TU-URL-VERCEL> |
| Backend (scout/bot) | ✅ `SUPABASE_URL` + `SERVICE_ROLE_KEY` en env de usuario |
| Bot listener | ✅ activo con logging a Supabase |

**URLs:** Dashboard `<TU-URL-VERCEL>` · Supabase `https://<TU-PROYECTO>.supabase.co`

**Secrets:** no se documentan; viven en variables de entorno de usuario (backend) y en Vercel env (front).

**Reaplicar migración (idempotente):**
```powershell
.\supabase\apply.ps1 -Ref <TU-PROYECTO> -Token sbp_...
```

---

*Documento generado por BlueOcean RE Agent · Listo para importar/paste en Notion.*
