<#
run-project.ps1
Usage:
  PowerShell -ExecutionPolicy Bypass -File .\run-project.ps1        # start backend only
  PowerShell -ExecutionPolicy Bypass -File .\run-project.ps1 -StartPhp # also start PHP server for frontend

What it does:
 - Stops backend-related node processes (safely)
 - Installs backend npm dependencies
 - Starts the backend using `npm --prefix backend start` (detached)
 - Optionally starts a PHP built-in server for the `alumni/` folder on port 8000
 - Writes backend logs to `backend.log` in repo root

Note: Do NOT commit .env files. Use `backend/.env` for secrets.
#>

param(
    [switch]$StartPhp
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Repository root: $repoRoot"

function Stop-BackendProcesses {
    Write-Host 'Stopping backend-related node processes...'
    try {
        $procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction Stop | Where-Object { $_.CommandLine -match 'server\.js|--prefix backend|backend\\node_modules' }
    } catch {
        Write-Warning "Could not inspect node command lines: $($_.Exception.Message)"
        Write-Warning 'Falling back to stopping node processes listening on backend ports.'

        $ports = $basePort..($basePort + 9)
        $pids = netstat -ano | Select-String 'LISTENING' | ForEach-Object {
            if ($_.Line -match '^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$') {
                $port = [int]$matches[1]
                if ($ports -contains $port) { [int]$matches[2] }
            }
        } | Sort-Object -Unique

        foreach ($processId in $pids) {
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($proc -and $proc.ProcessName -eq 'node') {
                Write-Host "Killing node PID $processId listening on a backend port."
                Stop-Process -Id $processId -Force
            }
        }
        return
    }
    if (-not $procs) { Write-Host 'No backend-related node processes found.'; return }
    $procs | Select-Object ProcessId,CommandLine | ForEach-Object { Write-Host "Killing PID: $($_.ProcessId) - $($_.CommandLine)"; Stop-Process -Id $_.ProcessId -Force }
}

function Install-BackendDeps {
    Write-Host 'Installing backend dependencies (npm.cmd --prefix backend install)...'
    Push-Location $repoRoot
    try {
        $exit = & npm.cmd --prefix backend install
        if ($LASTEXITCODE -ne 0) { Write-Error "npm install exited with code $LASTEXITCODE" }
    } finally { Pop-Location }
}

function Start-Backend {
    Write-Host 'Starting backend (npm.cmd --prefix backend start)...'
    $log = Join-Path $repoRoot 'backend.log'

    # Start backend and redirect output to backend.log using cmd.exe so both stdout and stderr go to the same file
    $cmd = "npm.cmd --prefix backend start > `"$log`" 2>&1"
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'cmd.exe'
    $psi.Arguments = "/c $cmd"
    $psi.WorkingDirectory = $repoRoot
    $psi.CreateNoWindow = $true
    $psi.UseShellExecute = $false
    $proc = [System.Diagnostics.Process]::Start($psi)
    Start-Sleep -Seconds 1
    Write-Host "Backend started (PID $($proc.Id)). Logs: $log"
}

function Start-PhpFrontend {
    Write-Host 'Starting PHP built-in server for alumni/ on port 8000 (if php is available)...'
    $php = Get-Command php -ErrorAction SilentlyContinue
    if (-not $php) { Write-Warning 'PHP not found on PATH. Skipping PHP server.'; return $false }
    $alumniDir = Join-Path $repoRoot 'alumni'
    if (-not (Test-Path $alumniDir)) { Write-Warning "Folder $alumniDir not found. Skipping PHP server."; return $false }

    $log = Join-Path $repoRoot 'php-server.log'
    $cmd = "php -S 127.0.0.1:8000 -t `"$alumniDir`" > `"$log`" 2>&1"
    $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList "/c $cmd" -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru
    Write-Host "PHP server started (PID $($proc.Id)). Logs: $log"
    return $true
}

function Start-StaticFrontend {
    Write-Host 'Starting static BAUST frontend fallback on port 8000...'
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) { Write-Warning 'Node not found on PATH. Skipping static frontend.'; return }

    $serverScript = Join-Path $repoRoot 'scripts\static-server.js'
    if (-not (Test-Path $serverScript)) { Write-Warning "Static server script $serverScript not found. Skipping static frontend."; return }

    $log = Join-Path $repoRoot 'static-site.log'
    $cmd = "node scripts\static-server.js > `"$log`" 2>&1"
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'cmd.exe'
    $psi.Arguments = "/c $cmd"
    $psi.WorkingDirectory = $repoRoot
    $psi.CreateNoWindow = $true
    $psi.UseShellExecute = $false
    $proc = [System.Diagnostics.Process]::Start($psi)
    Start-Sleep -Seconds 1
    Write-Host "Static frontend started (PID $($proc.Id)). Logs: $log"
}

# Execute steps
Stop-BackendProcesses
Install-BackendDeps
Start-Backend
if ($StartPhp) {
    $phpStarted = Start-PhpFrontend
    if (-not $phpStarted) { Start-StaticFrontend }
}

Write-Host 'Run script finished. Use the logs to inspect output.'
Write-Host 'Backend URL: http://127.0.0.1:5000/ (or the port shown in backend.log if auto-restarted on another port)'
if ($StartPhp) { Write-Host 'Frontend URL: http://127.0.0.1:8000/' }
