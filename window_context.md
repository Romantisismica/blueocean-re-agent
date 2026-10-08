# WINDOW_CONTEXT.MD - Operational Memory & Parameters

## Target Scope
- **Zona Geográfica (Tier 1 Core):** Sabaneta y Envigado, Antioquia, Colombia.
- **Zona Geográfica (Tier 2 Look-a-Like):** Itagüí, La Estrella, Caldas, Medellín, Bello.
- **Etapa Inmobiliaria:** Sobre planos, venta en pozo, pre-lanzamientos y proyectos en etapa cero.
- **Modelo de Negocio Requerido:** Soluciones con Fees Mensuales Bajos (SaaS B2B o B2C, administración micro-proptech, servicios por suscripción).

## Data Schema Required per Opportunity
- **id:**
- **Nombre del Proyecto:**
- **Constructora / Desarrollador:**
- **Ubicación Exacta / Sector:**
- **Tier:** [1 = Core | 2 = Look-a-Like]
- **opportunity_type:** [CORE_TARGET | LOOK_A_LIKE]
- **Fecha de Lanzamiento:**
- **Tipologías de Inmuebles:** (Áreas, habitaciones, parqueaderos)
- **Propuesta de Valor del Desarrollador:**
- **Brecha / Océano Azul Detectado:**
- **Estatus de Información:** [DATA_COMPLETE | REQUIRES_CHATBOT_INTERACTION]

## 3 Océanos Azules en Monitoreo (ver notion-blue-ocean-swarm.md)
1. Operador de Renta Corta Event-Driven (DAVIarena / Ciudad Peldar) — fee: $79-149k COP/unidad/mes + 8-12% por reserva.
2. Marketplace P2P de Parqueaderos en Conjuntos Masivos — fee: $180k-450k COP/conjunto/mes + 10-15% por transacción (propietario gratis).
3. Concierge SaaS para Expats / Nómadas Digitales — fee: $20-35k COP/unidad/mes + 15-20% por servicios.

## Monetización y Guardrails (Sesión 15 - Diplomado Vibecoding)
- **Modelos:** tradicionales (SaaS, Licencia, Freemium) vs. Era IA (Pago por uso/créditos, Arbitraje de inteligencia, Success Fee).
- **Elección:** pago único (valor concentrado), créditos (consumo variable), suscripción (valor recurrente), success fee (resultado verificable).
- **Guardrails:** Triple Check (créditos > 0, firma válida, input < 500 caracteres) + Kill Switch (consumo +500% en 1h).
- **Cobro internacional:** pasarela Merchant of Record (ej. Lemon Squeezy) para delegar impuestos (IVA/VAT) y medir MRR neto.
- **Seguridad:** nunca hardcodear API keys ni exponer `service_role`; auditar firmas HMAC/SHA256 y sanitizar inputs.

## Interfaz (Dashboard) — Stack y Dirección
- **Framework:** Next.js 14 (App Router) + Tailwind CSS v4 + `@phosphor-icons/react`.
- **Estética:** Glassmorphism 2.0 (paneles translúcidos `backdrop-filter` con bordes e highlight interior) + 3D ligero vía WebGL nativo (shader de aurora, sin librerías 3D pesadas) + tilt CSS en hover.
- **Performance/Accesibilidad:** DPR ≤ 1.5, pausa al ocultar pestaña, fallback estático en `prefers-reduced-motion`, fondo sólido en `prefers-reduced-transparency`.
- **Acento único:** esmeralda. Base off-black (no negro puro).
- **Copy humanizado:** ver regla en `soul.md` → Humanización de la Interfaz.
- **Deploy:** Vercel (Root Directory = `dashboard`).

## Current Execution Stack
- Engine: OpenCode
- External Search API: Brave Search API
- Auxiliary Tools: Web Scraper / Automated Chat Agent
- Bot: Telegram (@bienesraicesantioquia_bot)
- Scheduler: Windows Task Scheduler (`BlueOceanRE-DailyAlert`, `BlueOceanRE-BotListener`)

## Latest Scout Snapshot
> Actualizado automáticamente por `agents/brave_scout.py` → `data/scout_results.json`.
> Si este bloque está vacío, aún no ha corrido el Scout.
