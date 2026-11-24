$ErrorActionPreference = 'Stop'
$root = (Resolve-Path $PSScriptRoot).Path
$prefix = 'http://127.0.0.1:8765/'
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
} catch {
    Write-Host '게임 실행 서버를 시작하지 못했습니다. 이미 실행 중인 게임 창이 있는지 확인하고 다시 시도해 주세요.' -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Start-Process ($prefix + 'index.html')
Write-Host 'PAW / ORBIT 실행 중입니다. 게임을 마치면 이 창에서 Ctrl+C를 누르세요.' -ForegroundColor Cyan
$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png' = 'image/png'
    '.jpg' = 'image/jpeg'
    '.svg' = 'image/svg+xml'
    '.mp3' = 'audio/mpeg'
    '.wav' = 'audio/wav'
}
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
            if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
            $path = [IO.Path]::GetFullPath((Join-Path $root $relative))
            if (-not $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) {
                $context.Response.StatusCode = 404
                $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
            } else {
                $extension = [IO.Path]::GetExtension($path).ToLowerInvariant()
                if ($mime.ContainsKey($extension)) { $context.Response.ContentType = $mime[$extension] }
                $bytes = [IO.File]::ReadAllBytes($path)
            }
            $context.Response.ContentLength64 = $bytes.Length
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $context.Response.StatusCode = 500
        } finally {
            $context.Response.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
