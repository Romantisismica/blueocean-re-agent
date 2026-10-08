# BlueOcean RE Agent - Listener interactivo de Telegram
# Responde a ordenes y lenguaje natural. Long-polling continuo.
#
# Variables de entorno:
#   TELEGRAM_BOT_TOKEN (requerido)
#   BRAVE_API_KEY o BRAVE_SEARCH_API_KEY (para /scout)
#   LLM_API_URL, LLM_API_KEY, LLM_MODEL, LLM_SESSION_ID (opcional)
#   Por defecto usa OpenCode Go (https://opencode.ai/zen/go/v1).

$ErrorActionPreference = 'Stop'

$token      = $env:TELEGRAM_BOT_TOKEN
$brave      = if ($env:BRAVE_API_KEY) { $env:BRAVE_API_KEY } else { $env:BRAVE_SEARCH_API_KEY }
$llmUrl     = if ($env:LLM_API_URL) { $env:LLM_API_URL } else { 'https://opencode.ai/zen/go/v1/chat/completions' }
$llmKey     = if ($env:LLM_API_KEY) { $env:LLM_API_KEY } else { $env:OPENCODE_GO_API_KEY }
$llmModel   = if ($env:LLM_MODEL) { $env:LLM_MODEL } else { 'deepseek-v4-flash' }
$llmSession = if ($env:LLM_SESSION_ID) { $env:LLM_SESSION_ID } else { 'blueocean-re-agent-bot-001' }

$root    = Split-Path -Parent $PSScriptRoot
$apiBase = "https://api.telegram.org/bot$token"
$sbUrl   = $env:SUPABASE_URL
$sbKey   = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $token) { throw 'Falta TELEGRAM_BOT_TOKEN' }

# Cliente HTTP reutilizable para el LLM (decodifica UTF-8 correctamente)
Add-Type -AssemblyName System.Net.Http
$llmClient = $null
if ($llmKey) {
    $llmClient = New-Object System.Net.Http.HttpClient
    $llmClient.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $llmKey)
    $llmClient.DefaultRequestHeaders.Add('x-opencode-session', $llmSession)
    $llmClient.DefaultRequestHeaders.UserAgent.ParseAdd('blueocean-re-agent/1.0')
}

function Send-Telegram {
    param([long]$ChatId, [string]$Text)
    $payload = @{ chat_id = $ChatId; text = $Text; parse_mode = 'Markdown' } | ConvertTo-Json -Compress
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        Invoke-RestMethod -Uri "$apiBase/sendMessage" -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' | Out-Null
    } catch {
        $payload2 = @{ chat_id = $ChatId; text = $Text } | ConvertTo-Json -Compress
        try {
            $bytes2 = [System.Text.Encoding]::UTF8.GetBytes($payload2)
            Invoke-RestMethod -Uri "$apiBase/sendMessage" -Method Post -Body $bytes2 -ContentType 'application/json; charset=utf-8' | Out-Null
        } catch { }
    }
}

function Log-Supabase {
    param([string]$Table, [hashtable]$Row)
    if (-not $sbUrl -or -not $sbKey) { return }
    try {
        $json  = $Row | ConvertTo-Json -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        Invoke-RestMethod -Uri "$sbUrl/rest/v1/$Table" -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' -Headers @{ apikey = $sbKey; Authorization = "Bearer $sbKey"; Prefer = 'return=minimal' } | Out-Null
    } catch { }
}

function Get-ScoutSummary {
    $f = Join-Path $root 'data\scout_results.json'
    if (-not (Test-Path -LiteralPath $f)) { return $null }
    try { return (Get-Content -LiteralPath $f -Raw -Encoding UTF8 | ConvertFrom-Json) } catch { return $null }
}

function Invoke-Scout {
    $script = Join-Path $root 'agents\brave_scout.py'
    try {
        if ($brave) { $env:BRAVE_SEARCH_API_KEY = $brave }
        & python $script *> $null
        return $true
    } catch { return $false }
}

function Invoke-LLM {
    param([string]$UserText)
    if (-not $llmUrl -or -not $llmKey) { return $null }
    $soul = ''
    $soulPath = Join-Path $root 'soul.md'
    if (Test-Path -LiteralPath $soulPath) { $soul = Get-Content -LiteralPath $soulPath -Raw -Encoding UTF8 }
    $winctx = ''
    $winPath = Join-Path $root 'window_context.md'
    if (Test-Path -LiteralPath $winPath) { $winctx = Get-Content -LiteralPath $winPath -Raw -Encoding UTF8 }
    $sum = Get-ScoutSummary
    $ctx = if ($sum) {
        $names = ($sum.opportunities | Select-Object -First 15 | ForEach-Object { "$($_.name) [$($_.zone), Tier$($_.tier)]" }) -join '; '
        "Scout: $($sum.total_opportunities) oportunidades (Tier1=$($sum.tier_1_count), Tier2=$($sum.tier_2_count)). Muestra: $names"
    } else { 'Sin datos de scout.' }
    $system = "$soul`n`n$winctx`n`nContexto operativo actual: $ctx`n`nResponde en espanol, breve y accionable. Si un dato no esta en el contexto, marcalo como Incierto."
    $body = @{
        model      = $llmModel
        messages   = @(
            @{ role = 'system'; content = $system },
            @{ role = 'user'; content = $UserText }
        )
        max_tokens = 900
    } | ConvertTo-Json -Depth 5 -Compress
    try {
        $sc   = New-Object System.Net.Http.StringContent($body, [System.Text.Encoding]::UTF8, 'application/json')
        $resp = $llmClient.PostAsync($llmUrl, $sc).Result
        $bytes = $resp.Content.ReadAsByteArrayAsync().Result
        $json  = [System.Text.Encoding]::UTF8.GetString($bytes)
        $obj   = $json | ConvertFrom-Json
        $text  = $obj.choices[0].message.content
        if (-not $text) { $text = $obj.choices[0].message.reasoning_content }
        return $text
    } catch { return $null }
}

function Get-Help {
    @'
🌊 *BlueOcean RE Agent*
Comandos:
/status - Estado del enjambre
/scout - Ejecutar rastreo ahora
/nichos - Ver los 3 Océanos Azules
/oportunidades - Últimos hallazgos Tier 1
/proyecto <nombre> - Buscar un proyecto

También puedes escribirme en lenguaje natural.
'@
}

function Handle-Message {
    param([string]$Text, [long]$ChatId)
    $t  = $Text.Trim()
    $tl = $t.ToLower()

    if ($tl -eq '/start' -or $tl -eq '/help' -or $tl -eq 'ayuda') { return (Get-Help) }

    if ($tl -eq '/status' -or $tl -match '\bestado\b|\bstatus\b') {
        $sum = Get-ScoutSummary
        if ($sum) {
            return "📊 *Estado del enjambre*`nÚltimo scout: $($sum.generated_at)`nTotal: $($sum.total_opportunities)`n🟦 Tier 1: $($sum.tier_1_count)`n🔷 Tier 2: $($sum.tier_2_count)"
        }
        return '📊 Sin datos de scout aún. Envía /scout para generar.'
    }

    if ($tl -eq '/scout' -or $tl -match '\bscout\b|rastre') {
        Send-Telegram -ChatId $ChatId -Text '⏳ Ejecutando scout...'
        $ok  = Invoke-Scout
        $sum = Get-ScoutSummary
        if ($ok -and $sum) {
            return "✅ Scout completado: $($sum.total_opportunities) oportunidades (Tier1=$($sum.tier_1_count), Tier2=$($sum.tier_2_count))."
        }
        return '⚠️ No se pudo ejecutar el scout. Revisa BRAVE_API_KEY / Python.'
    }

    if ($tl -eq '/nichos' -or $tl -match 'nicho|océano|oceano') {
        return "🟦 *3 Océanos Azules*`n1. Renta corta event-driven (DAVIarena / Ciudad Peldar)`n2. Marketplace P2P de parqueaderos`n3. Concierge SaaS expats / nómadas"
    }

    if ($tl -eq '/oportunidades' -or $tl -match 'oportunidad|hallazgo') {
        $sum = Get-ScoutSummary
        if (-not $sum) { return 'Sin datos. Envía /scout.' }
        $t1 = $sum.opportunities | Where-Object { $_.tier -eq 1 } | Select-Object -First 8
        if (-not $t1) { return 'No hay hallazgos Tier 1 en el último scout.' }
        $lines = @('🟦 *Tier 1 (Core)*')
        foreach ($o in $t1) { $lines += "• $($o.name) — $($o.zone) [$($o.status)]" }
        return ($lines -join "`n")
    }

    if ($t -match '^/proyecto\s+(.+)$') {
        $q   = $Matches[1]
        $sum = Get-ScoutSummary
        if (-not $sum) { return 'Sin datos. Envía /scout.' }
        $hits = $sum.opportunities | Where-Object { $_.name -match [regex]::Escape($q) -or $_.zone -match [regex]::Escape($q) } | Select-Object -First 5
        if (-not $hits) { return "No encontré '$q' en el último scout." }
        $lines = @("🔎 Resultados para *$q*:")
        foreach ($o in $hits) { $lines += "• $($o.name) — $($o.zone) (Tier $($o.tier)) $($o.url)" }
        return ($lines -join "`n")
    }

    $llm = Invoke-LLM -UserText $t
    if ($llm) { return $llm }

    return "No entendí esa orden.`n`n$(Get-Help)"
}

$offset = 0
Write-Host 'Bot listener iniciado. Long-polling...'
while ($true) {
    try {
        $resp = Invoke-RestMethod -Uri "$apiBase/getUpdates?timeout=30&offset=$offset" -Method Get
        foreach ($u in $resp.result) {
            $offset = [int]$u.update_id + 1
            $msg = $u.message
            if (-not $msg -or -not $msg.text) { continue }
            Log-Supabase -Table 'bot_events' -Row @{ chat_id = "$($msg.chat.id)"; direction = 'in'; text = $msg.text }
            $reply = Handle-Message -Text $msg.text -ChatId $msg.chat.id
            Send-Telegram -ChatId $msg.chat.id -Text $reply
            Log-Supabase -Table 'bot_events' -Row @{ chat_id = "$($msg.chat.id)"; direction = 'out'; text = $reply }
        }
    } catch {
        Start-Sleep -Seconds 5
    }
}
