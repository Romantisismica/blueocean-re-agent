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
```
.
├── soul.md                  -> Identidad y reglas del sistema.
├── window_context.md        -> Memoria operativa y registros actualizados.
├── MANIFEST.json            -> Índice estático de contexto de bajo consumo de tokens.
├── README.md                -> Instrucciones de diseño e higiene del enjambre.
├── opencode.config.yml      -> Orquestación de agentes y workflows.
├── notion-blue-ocean-swarm.md -> Documentación completa (Canvas + Pricing + MVP).
├── send-alerts.ps1          -> Envío de la alerta diaria al bot (7:00 a.m.).
├── run-daily.ps1            -> Wrapper: ejecuta Scout + Alerta.
├── agents/
│   ├── brave_scout.py       -> Scout de proyectos (Brave API + tiering + Supabase).
│   └── prompts.md           -> Meta-prompts de los agentes.
├── bot/
│   ├── bot_listener.ps1     -> Listener de Telegram con lenguaje natural.
│   └── start-listener.ps1   -> Launcher con credenciales (OpenCode Go + Supabase).
├── supabase/
│   ├── migrations/0001_init.sql -> Tablas, histórico, vistas, Realtime, RLS.
│   └── seed.sql             -> Catálogo de los 3 Océanos Azules.
├── dashboard/               -> Next.js + Supabase Realtime (deploy en Vercel).
├── DEPLOY.md                -> Guía de deploy (Supabase + Vercel + MCPs).
└── data/
    └── scout_results.json   -> Salida estructurada del Scout.
```

## 🔧 Operación
- **Alerta diaria:** tarea `BlueOceanRE-DailyAlert` (7:00 a.m.) → `run-daily.ps1`.
- **Bot interactivo:** tarea `BlueOceanRE-BotListener` (al iniciar sesión) → `bot/bot_listener.ps1`.
- **Datos:** Supabase (`opportunities`, `scout_runs`, `alerts`, `bot_events`).
- **Dashboard:** `dashboard/` en Vercel, lectura en tiempo real (Supabase Realtime).
- **MCPs:** `supabase` y `vercel` configurados en `~/.config/opencode/opencode.json`.

## 🧠 Lenguaje natural
El bot responde a órdenes y prompts en **lenguaje natural libre** usando **OpenCode Go**
(`https://opencode.ai/zen/go/v1`, modelo `deepseek-v4-flash`), configurado en `bot/start-listener.ps1`.

Contexto que recibe el modelo por mensaje: `soul.md` + `window_context.md` + resumen del último scout.
Si no hay credencial, cae a enrutamiento por intenciones.

Comandos: `/start` `/help` `/status` `/scout` `/nichos` `/oportunidades` `/proyecto <nombre>`.
