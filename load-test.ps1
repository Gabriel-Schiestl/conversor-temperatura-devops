# ============================================================
# load-test.ps1 — gerador de carga para demonstração de HPA
# Altere TARGET_IP para o IP externo do seu LoadBalancer
# Execute com: .\load-test.ps1
# ============================================================

# Set-ExecutionPolicy -Scope Process Bypass

$TARGET_IP   = "0.0.0.0"   # <-- substitua pelo IP do LoadBalancer
$TARGET_PORT = 32000
$CONCURRENCY = 50           # requisições paralelas por rodada
$INTERVAL_MS = 200          # intervalo entre rodadas (ms)

$ENDPOINTS = @(
    "/celsius/100/fahrenheit",
    "/celsius/0/fahrenheit",
    "/celsius/37/fahrenheit",
    "/fahrenheit/212/celsius",
    "/fahrenheit/32/celsius",
    "/fahrenheit/98/celsius"
)

$baseUrl = "http://${TARGET_IP}:${TARGET_PORT}"

Write-Host "Alvo: $baseUrl"
Write-Host "Concorrência: $CONCURRENCY req/rodada | intervalo: ${INTERVAL_MS}ms"
Write-Host "Pressione Ctrl+C para parar.`n"

$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(5)

$totalRequests = 0
$totalErrors   = 0
$startTime     = [DateTime]::Now

while ($true) {
    # Dispara todas as requisições da rodada em paralelo
    $tasks = 1..$CONCURRENCY | ForEach-Object {
        $path = $ENDPOINTS[(Get-Random -Maximum $ENDPOINTS.Length)]
        $client.GetAsync("$baseUrl$path")
    }

    [System.Threading.Tasks.Task]::WaitAll($tasks)

    foreach ($task in $tasks) {
        $totalRequests++
        if ($task.IsFaulted -or -not $task.Result.IsSuccessStatusCode) {
            $totalErrors++
        }
    }

    $elapsed = [math]::Round(([DateTime]::Now - $startTime).TotalSeconds, 1)
    $rps     = if ($elapsed -gt 0) { [math]::Round($totalRequests / $elapsed, 1) } else { 0 }

    Write-Host -NoNewline "`r[${elapsed}s] total: $totalRequests req | erros: $totalErrors | ~$rps req/s   "

    Start-Sleep -Milliseconds $INTERVAL_MS
}
