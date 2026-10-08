import os
import json
import re
import requests
from datetime import datetime

# ---------------------------------------------------------------------------
# CONFIGURACIÓN
# ---------------------------------------------------------------------------
BRAVE_API_KEY = (
    os.getenv("BRAVE_SEARCH_API_KEY")
    or os.getenv("BRAVE_API_KEY")
    or ""
)
BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"

# Blacklist de portales agregadores que ensucian los resultados
EXCLUDED_DOMAINS = [
    "fincaraiz.com.co",
    "ciencuadras.com",
    "metrocuadrado.com",
    "properati.com.co",
    "lahaus.com",
    "mitula.com.co",
    "trovit.com.co",
    "trovit.com",
    "puntopropiedad.com",
    "estrenarvivienda.com",
    "conaltura.com",
    "espaciourbano.com",
]

# Títulos genéricos / índices a descartar
GENERIC_TITLE_PATTERNS = [
    r"^\d+\s+proyectos",
    r"proyectos de vivienda",
    r"apartamentos en",
    r"\binicio\b",
    r"\bportal\b",
    r"abrá sur",
    r"casas en venta",
    r"mejor oferta",
    r"proyectos sobre planos",
    r"^inmuebles",
    r"\bcomprar\b",
    r"\bblog\b",
    r"\bnoticias?\b",
    r"\bgu[íi]a\b",
    r"^inicio$",
]

# Rutas de artículo/blog que no son fichas de proyecto
EXCLUDED_URL_PATTERNS = [
    r"/blog/",
    r"/noticias/",
    r"/gu[íi]a",
    r"/articulo",
    r"/comprar",
]

# Guardrails geográficos
TIER_1_CORE = ["sabaneta", "envigado"]
TIER_2_LOOKALIKE = ["itagui", "itagüí", "la estrella", "caldas", "medellin", "medellín", "bello"]

# Queries con exclusión explícita de agregadores (-site:...)
SEARCH_QUERIES = [
    'constructora "lanzamiento" "sobre planos" Sabaneta '
    "-site:fincaraiz.com.co -site:ciencuadras.com -site:lahaus.com -site:metrocuadrado.com",
    'constructora "lanzamiento" "sobre planos" Envigado '
    "-site:fincaraiz.com.co -site:ciencuadras.com -site:lahaus.com -site:metrocuadrado.com",
    '"nuevo proyecto" "sala de ventas" apartamentos Sabaneta OR Envigado 2026 OR 2027 '
    "-site:fincaraiz.com.co -site:ciencuadras.com -site:properati.com.co",
]

# Rutas (agents/ -> raiz -> data/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "scout_results.json")


# ---------------------------------------------------------------------------
# FILTROS ANTI-BASURA
# ---------------------------------------------------------------------------
def is_aggregator_or_generic(url: str, title: str) -> bool:
    """Descarta si la URL es de un portal agregador, una ruta de blog o si el título es genérico."""
    low_url = url.lower()
    if any(domain in low_url for domain in EXCLUDED_DOMAINS):
        return True
    if any(re.search(p, low_url) for p in EXCLUDED_URL_PATTERNS):
        return True
    for pattern in GENERIC_TITLE_PATTERNS:
        if re.search(pattern, title.lower()):
            return True
    return False


def has_own_project_name(title: str) -> bool:
    """Exige un nombre propio de proyecto (no un listado)."""
    t = title.strip()
    if len(t) < 4:
        return False
    # Rechaza títulos que son solo ubicación/índice
    if re.fullmatch(r"(apartamentos?|proyectos?|casas?|vivienda).*", t.lower()):
        return False
    return True


def classify_location(text: str):
    text_lower = text.lower()
    for zone in TIER_1_CORE:
        if zone in text_lower:
            return 1, "CORE_TARGET", zone.capitalize()
    for zone in TIER_2_LOOKALIKE:
        if zone in text_lower:
            return 2, "LOOK_A_LIKE", zone.capitalize()
    return 2, "LOOK_A_LIKE", "Valle de Aburrá (General)"


def extract_developer(text: str) -> str:
    """Intenta extraer la constructora desde el título/snippet."""
    m = re.search(r"constructora\s+([A-Za-z0-9áéíóúñ&.\- ]{2,40})", text, re.IGNORECASE)
    if m:
        return m.group(0).strip().rstrip(".-")
    return "Por identificar"


def check_data_completeness(text: str) -> bool:
    has_area = bool(re.search(r"\b\d+\s*m2\b|\b\d+\s*metros\b", text, re.IGNORECASE))
    has_price = bool(re.search(r"\bmillones\b|\$\s*\d+", text, re.IGNORECASE))
    return has_area and has_price


# ---------------------------------------------------------------------------
# BRAVE
# ---------------------------------------------------------------------------
def search_brave_clean(query: str) -> list:
    headers = {"Accept": "application/json", "X-Subscription-Token": BRAVE_API_KEY}
    # NOTA: Brave NO acepta country="CO"; se usa "ALL".
    params = {"q": query, "count": 15, "country": "ALL", "search_lang": "es"}
    try:
        res = requests.get(BRAVE_SEARCH_URL, headers=headers, params=params, timeout=10)
        res.raise_for_status()
        return res.json().get("web", {}).get("results", [])
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Brave Search API: {e}")
        return []


# ---------------------------------------------------------------------------
# PROCESAMIENTO
# ---------------------------------------------------------------------------
def process_opportunities_v2() -> list:
    clean_opportunities = []
    seen_urls = set()
    counter = 1

    for q in SEARCH_QUERIES:
        print(f"[SCOUT] {q[:70]}...")
        for item in search_brave_clean(q):
            url = item.get("url", "")
            title = item.get("title", "").strip()
            snippet = item.get("description", "").strip()

            if not url or url in seen_urls:
                continue
            if is_aggregator_or_generic(url, title):
                continue
            if not has_own_project_name(title):
                continue

            seen_urls.add(url)
            full_txt = f"{title} {snippet}"
            tier, opp_type, zone = classify_location(full_txt)
            developer = extract_developer(full_txt)
            complete = check_data_completeness(full_txt)

            clean_opportunities.append({
                "id": f"RE-SCOUT-{counter:03d}",
                "name": title.split("-")[0].split("|")[0].strip(),
                "developer": developer,
                "zone": zone,
                "tier": tier,
                "opportunity_type": opp_type,
                "url": url,
                "launch_date": None,
                "typologies": None,
                "value_proposition": None,
                "snippet": snippet,
                "status": "DATA_COMPLETE" if (developer != "Por identificar" and complete)
                          else "REQUIRES_CHATBOT_INTERACTION",
                "detected_gap": "Se requiere validación de amenities y propuesta de valor de bajo fee.",
            })
            counter += 1

    return clean_opportunities


def push_to_supabase(payload: dict) -> bool:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        print("[AVISO] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados. Solo JSON local.")
        return False
    endpoint = f"{url.rstrip('/')}/rest/v1/rpc/ingest_scout_payload"
    try:
        r = requests.post(
            endpoint,
            headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"payload": payload},
            timeout=15,
        )
        r.raise_for_status()
        print(f"[SUPABASE] Ingesta OK. run_id={r.text.strip()}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Supabase: {e}")
        return False


if __name__ == "__main__":
    if not BRAVE_API_KEY:
        print("[AVISO] Configura BRAVE_SEARCH_API_KEY con tu API Key.")

    os.makedirs(DATA_DIR, exist_ok=True)
    results = process_opportunities_v2()

    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source": "brave_scout_v2",
        "total_opportunities": len(results),
        "tier_1_count": sum(1 for o in results if o["tier"] == 1),
        "tier_2_count": sum(1 for o in results if o["tier"] == 2),
        "opportunities": results,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    push_to_supabase(payload)

    print(f"\n✅ Rastreo limpio completado: {len(results)} proyectos individuales reales encontrados.")
    print(json.dumps({k: v for k, v in payload.items() if k != "opportunities"}, ensure_ascii=False, indent=2))
