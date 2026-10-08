# BlueOcean RE Agent - Alerta diaria 7:00 AM
# Requiere variables de entorno:
#   $env:BRAVE_API_KEY
#   $env:TELEGRAM_BOT_TOKEN
# Opcional: $env:TELEGRAM_CHAT_ID (si no se define, intenta obtenerlo de getUpdates)

param()

$braveToken     = $env:BRAVE_API_KEY
$telegramToken  = $env:TELEGRAM_BOT_TOKEN
$chatId         = $env:TELEGRAM_CHAT_ID

function Send-TelegramMessage {
    param([string]$Text, [string]$ChatId, [string]$Token)
    $body = @{
        chat_id    = $ChatId
        text       = $Text
        parse_mode = 'Markdown'
    } | ConvertTo-Json -Compress
    $uri = "https://api.telegram.org/bot$Token/sendMessage"
    Invoke-RestMethod -Uri $uri -Method Post -Body $body -ContentType 'application/json' | Out-Null
}

function Search-Brave {
    param([string]$Query, [string]$Token)
    $encoded = [System.Uri]::EscapeDataString($Query)
    $uri = "https://api.search.brave.com/res/v1/web/search?q=$encoded&count=5&country=ALL"
    $headers = @{
        'Accept'               = 'application/json'
        'X-Subscription-Token' = $Token
    }
    try {
        $res = Invoke-RestMethod -Uri $uri -Headers $headers -ErrorAction Stop
        return $res.web.results
    } catch {
        return @()
    }
}

# Validaciones
if (-not $braveToken)     { throw 'Falta la variable de entorno BRAVE_API_KEY' }
if (-not $telegramToken)  { throw 'Falta la variable de entorno TELEGRAM_BOT_TOKEN' }

# Descubrir chat_id si no está configurado
if (-not $chatId) {
    try {
        $updates = Invoke-RestMethod -Uri "https://api.telegram.org/bot$telegramToken/getUpdates" -Method Get
        if ($updates.result.Count -gt 0) {
            $chatId = $updates.result[-1].message.chat.id
        }
    } catch { }
}

if (-not $chatId) {
    throw 'No se pudo determinar el chat_id. Envía un mensaje a @bienesraicesantioquia_bot o define $env:TELEGRAM_CHAT_ID.'
}

# Búsquedas diarias - monitoreo de los 3 Océanos Azules
$niches = @(
    [pscustomobject]@{
        Label   = '🟦 #1 Renta Corta Event-Driven (DAVIarena / Ciudad Peldar)'
        Queries = @(
            'renta corta Airbnb DAVIarena Sabaneta operador administracion',
            'apartamentos renta corta Envigado inversionistas 2026',
            'Ciudad Peldar Envigado alojamiento eventos'
        )
    },
    [pscustomobject]@{
        Label   = '🟦 #2 Marketplace P2P de Parqueaderos'
        Queries = @(
            'alquiler parqueaderos conjuntos residenciales Sabaneta Envigado',
            'parqueaderos inteligentes proptech Colombia administracion',
            'parking compartido edificios residenciales Antioquia'
        )
    },
    [pscustomobject]@{
        Label   = '🟦 #3 Concierge SaaS Expats / Nómadas'
        Queries = @(
            'expats nomadas digitales vivienda Envigado Sabaneta servicios',
            'concierge amenities edificios residenciales proptech Colombia',
            'apartamentos amoblados expats Envigado Sabaneta'
        )
    }
)

$lines = @(
    "🌊 *Alerta diaria BlueOcean RE Agent*",
    "📅 $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    "📍 Sabaneta / Envigado · 3 Océanos Azules",
    ""
)

foreach ($niche in $niches) {
    $lines += "*$($niche.Label)*"
    $seen = @{}
    foreach ($q in $niche.Queries) {
        $results = Search-Brave -Query $q -Token $braveToken | Select-Object -First 2
        foreach ($r in $results) {
            if ($seen.ContainsKey($r.url)) { continue }
            $seen[$r.url] = $true
            $title = $r.title -replace '\*', ''
            $lines += "• [$title]($($r.url))"
        }
    }
    if ($seen.Count -eq 0) {
        $lines += '• Sin resultados o error en la búsqueda.'
    }
    $lines += ""
}

$lines += "_Fuente: Brave Search + Telegram Bot_"
$message = $lines -join "`n"

# Enviar
Send-TelegramMessage -Text $message -ChatId $chatId -Token $telegramToken
Write-Host "Alerta enviada a chat_id $chatId"

# Registrar en Supabase (histórico de alertas)
if ($env:SUPABASE_URL -and $env:SUPABASE_SERVICE_ROLE_KEY) {
    try {
        $row = @{ chat_id = "$chatId"; niche = '3-oceanos-azules'; message = $message } | ConvertTo-Json -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($row)
        Invoke-RestMethod -Uri "$($env:SUPABASE_URL)/rest/v1/alerts" -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' -Headers @{ apikey = $env:SUPABASE_SERVICE_ROLE_KEY; Authorization = "Bearer $($env:SUPABASE_SERVICE_ROLE_KEY)"; Prefer = 'return=minimal' } | Out-Null
        Write-Host 'Alerta registrada en Supabase.'
    } catch {
        Write-Host "No se pudo registrar en Supabase: $_"
    }
}
