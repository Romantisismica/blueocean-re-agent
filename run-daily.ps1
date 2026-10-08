# run-daily.ps1 - Ejecuta el Scout estructurado y luego envía la alerta diaria.
# Programado por la tarea BlueOceanRE-DailyAlert a las 7:00 a.m.

$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot

# Credenciales Supabase (opcional): si están, el scout hace upsert + histórico.
# Editar aquí o definir como variables de entorno de usuario.
if (-not $env:SUPABASE_URL)              { $env:SUPABASE_URL = '' }
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) { $env:SUPABASE_SERVICE_ROLE_KEY = '' }

# 1. Scout estructurado (tiering) -> data/scout_results.json
$scout = Join-Path $root 'agents\brave_scout.py'
if ($env:BRAVE_API_KEY -and -not $env:BRAVE_SEARCH_API_KEY) {
    $env:BRAVE_SEARCH_API_KEY = $env:BRAVE_API_KEY
}
try {
    Write-Host '[1/2] Ejecutando scout estructurado...'
    & python $scout
} catch {
    Write-Host "[1/2] Scout falló: $_"
}

# 2. Alerta diaria a Telegram
try {
    Write-Host '[2/2] Enviando alerta diaria...'
    & (Join-Path $root 'send-alerts.ps1')
} catch {
    Write-Host "[2/2] Alerta falló: $_"
}
