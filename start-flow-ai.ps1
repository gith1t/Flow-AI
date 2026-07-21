[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$SkipInstall,
    [switch]$FreshWorkspace
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$BackendRequirements = Join-Path $BackendDir "requirements.txt"
$BackendVenvDir = Join-Path $BackendDir "venv"
$BackendPython = Join-Path $BackendVenvDir "Scripts\python.exe"
$LogDir = Join-Path $ProjectRoot ".flow-ai-logs"
$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$BackendLog = Join-Path $LogDir "backend-$RunId.out.log"
$BackendErrorLog = Join-Path $LogDir "backend-$RunId.err.log"
$FrontendLog = Join-Path $LogDir "frontend-$RunId.out.log"
$FrontendErrorLog = Join-Path $LogDir "frontend-$RunId.err.log"
$backendProcess = $null
$frontendProcess = $null
$scriptExitCode = 0

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Wait-ForPort {
    param(
        [string]$HostName,
        [int]$Port,
        [System.Diagnostics.Process]$Process,
        [string]$ServiceName,
        [string]$LogPath,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if ($null -ne $Process -and $Process.HasExited) {
            throw "$ServiceName stopped before port $Port became available. Check log: $LogPath"
        }

        $client = New-Object System.Net.Sockets.TcpClient
        try {
            $connection = $client.ConnectAsync($HostName, $Port)
            if ($connection.Wait(500) -and $client.Connected) {
                return
            }
        }
        finally {
            $client.Dispose()
        }
        Start-Sleep -Milliseconds 500
    }

    throw "$ServiceName did not open port $Port within $TimeoutSeconds seconds. Check log: $LogPath"
}

function Assert-PortAvailable {
    param(
        [int]$Port,
        [string]$ServiceName
    )

    $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
    if ($listeners.Count -eq 0) {
        return
    }

    $processDescriptions = foreach ($processId in ($listeners.OwningProcess | Sort-Object -Unique)) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($null -ne $process) {
            "$($process.ProcessName) (PID $processId)"
        }
        else {
            "PID $processId"
        }
    }

    throw "Cannot start ${ServiceName}: port $Port is already in use by $($processDescriptions -join ', '). Stop the existing local server, then run the launcher again."
}

function Reset-Workspace {
    param([string]$BaseUrl)

    Write-Step "Resetting workspace for a clean session"
    try {
        Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/workspace/reset" -TimeoutSec 30 | Out-Null
    }
    catch {
        throw "Could not reset the workspace. Check the backend log: $BackendErrorLog"
    }
    Write-Host "Workspace reset complete." -ForegroundColor Green
}

function Stop-ProcessTree {
    param([System.Diagnostics.Process]$Process)

    if ($null -eq $Process) {
        return
    }

    try {
        if (-not $Process.HasExited) {
            $taskkill = Get-Command taskkill.exe -ErrorAction SilentlyContinue
            if ($null -ne $taskkill) {
                & $taskkill.Source /PID $Process.Id /T /F *> $null
            }
            else {
                Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
    catch {
        Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    }
}

try {
    if (-not (Test-Path $BackendDir -PathType Container)) {
        throw "Backend folder was not found: $BackendDir"
    }
    if (-not (Test-Path $FrontendDir -PathType Container)) {
        throw "Frontend folder was not found: $FrontendDir"
    }
    if (-not (Test-Path $BackendRequirements -PathType Leaf)) {
        throw "Backend requirements file was not found: $BackendRequirements"
    }

    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

    $pythonCommand = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($null -eq $pythonCommand) {
        $pythonCommand = Get-Command py.exe -ErrorAction SilentlyContinue
    }
    if ($null -eq $pythonCommand) {
        throw "Python was not found in PATH. Install Python 3.10+ and try again."
    }

    if (-not (Test-Path $BackendPython -PathType Leaf)) {
        if ($SkipInstall) {
            throw "Backend venv was not found. Run without -SkipInstall to create it automatically."
        }
        Write-Step "Creating backend virtual environment"
        & $pythonCommand.Source -m venv $BackendVenvDir
        if ($LASTEXITCODE -ne 0) {
            throw "Could not create backend venv."
        }
    }

    $dependencyProbe = & $BackendPython -c "import fastapi, uvicorn, pydantic, openai, dotenv, pypdf, multipart, docx" 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($SkipInstall) {
            throw "Backend dependencies are missing. Run without -SkipInstall to install them automatically."
        }
        Write-Step "Installing backend dependencies from backend\requirements.txt"
        & $BackendPython -m pip install -r $BackendRequirements
        if ($LASTEXITCODE -ne 0) {
            throw "Could not install backend dependencies."
        }
    }

    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($null -eq $npmCommand) {
        throw "npm was not found in PATH. Install Node.js 20.19+ and try again."
    }

    $frontendModules = Join-Path $FrontendDir "node_modules"
    if (-not (Test-Path $frontendModules -PathType Container)) {
        if ($SkipInstall) {
            throw "frontend\node_modules was not found. Run without -SkipInstall to install it automatically."
        }
        Write-Step "Installing frontend dependencies with npm install"
        Push-Location $FrontendDir
        try {
            & $npmCommand.Source install
            if ($LASTEXITCODE -ne 0) {
                throw "Could not install frontend dependencies."
            }
        }
        finally {
            Pop-Location
        }
    }

    Assert-PortAvailable -Port 8000 -ServiceName "FastAPI"
    Assert-PortAvailable -Port 5173 -ServiceName "Vite"

    Write-Step "Starting FastAPI at http://localhost:8000"
    $backendStartArgs = @{
        FilePath = $BackendPython
        WorkingDirectory = $BackendDir
        ArgumentList = @("-m", "uvicorn", "main:app", "--reload", "--port", "8000")
        RedirectStandardOutput = $BackendLog
        RedirectStandardError = $BackendErrorLog
        WindowStyle = "Hidden"
        PassThru = $true
    }
    $backendProcess = Start-Process @backendStartArgs
    Start-Sleep -Milliseconds 750
    if ($backendProcess.HasExited) {
        throw "FastAPI stopped immediately after launch. Check log: $BackendErrorLog"
    }
    Wait-ForPort -HostName "127.0.0.1" -Port 8000 -Process $backendProcess -ServiceName "FastAPI" -LogPath $BackendLog -TimeoutSeconds 60
    Write-Host "FastAPI is ready." -ForegroundColor Green

    if ($FreshWorkspace) {
        Reset-Workspace -BaseUrl "http://127.0.0.1:8000"
    }

    Write-Step "Starting Vite at http://localhost:5173"
    $frontendStartArgs = @{
        FilePath = $npmCommand.Source
        WorkingDirectory = $FrontendDir
        ArgumentList = @("run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort")
        RedirectStandardOutput = $FrontendLog
        RedirectStandardError = $FrontendErrorLog
        WindowStyle = "Hidden"
        PassThru = $true
    }
    $frontendProcess = Start-Process @frontendStartArgs
    Start-Sleep -Milliseconds 750
    if ($frontendProcess.HasExited) {
        throw "Vite stopped immediately after launch. Check log: $FrontendErrorLog"
    }
    Wait-ForPort -HostName "127.0.0.1" -Port 5173 -Process $frontendProcess -ServiceName "Vite" -LogPath $FrontendLog -TimeoutSeconds 60
    Write-Host "Vite is ready." -ForegroundColor Green

    if (-not $NoBrowser) {
        Start-Process "http://localhost:5173"
    }

    Write-Host "`nFlow-AI is running. Press Ctrl+C to stop backend and frontend." -ForegroundColor Green
    Write-Host "Backend logs:  $BackendLog / $BackendErrorLog" -ForegroundColor DarkGray
    Write-Host "Frontend logs: $FrontendLog / $FrontendErrorLog" -ForegroundColor DarkGray

    while ($true) {
        if ($backendProcess.HasExited) {
            throw "FastAPI stopped. Check log: $BackendLog"
        }
        if ($frontendProcess.HasExited) {
            throw "Vite stopped. Check log: $FrontendLog"
        }
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $scriptExitCode = 1
}
finally {
    Stop-ProcessTree -Process $frontendProcess
    Stop-ProcessTree -Process $backendProcess
}

if ($scriptExitCode -ne 0) {
    exit $scriptExitCode
}
