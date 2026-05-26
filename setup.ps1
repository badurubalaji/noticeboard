<#
.SYNOPSIS
NoticeBoard one-click setup for Windows.

.DESCRIPTION
Installs Node.js (18+) and MongoDB Community if missing using winget, generates
strong random secrets, installs dependencies, builds the UI, and starts the
server. After it finishes, anyone on the same LAN can open the printed URL.

.EXAMPLE
.\setup.ps1
.\setup.ps1 --reset
.\setup.ps1 --no-seed
#>

[CmdletBinding()]
param(
  [Parameter(ValueFromRemainingArguments=$true)]
  [string[]]$Args
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Write-Step($m) { Write-Host "`n▸ $m" -ForegroundColor Cyan }
function Write-Ok($m)   { Write-Host "  ✔ $m" -ForegroundColor Green }
function Write-Warn($m) { Write-Host "  ! $m" -ForegroundColor Yellow }
function Write-Err($m)  { Write-Host "  ✕ $m" -ForegroundColor Red }

Write-Host ""
Write-Host "NoticeBoard — one-click setup (Windows)" -ForegroundColor White

# ---------- 1. Check / install Node.js ----------
Write-Step "Checking Node.js"

function Get-NodeMajor {
  try {
    $v = (node -v) 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $v) { return 0 }
    return [int]($v.TrimStart('v').Split('.')[0])
  } catch { return 0 }
}

$nodeMajor = Get-NodeMajor
if ($nodeMajor -ge 18) {
  Write-Ok "Node $(node -v)"
} else {
  if ($nodeMajor -gt 0) {
    Write-Warn "Node $(node -v) is too old (need 18+)."
  } else {
    Write-Warn "Node.js is not installed."
  }

  $hasWinget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $hasWinget) {
    Write-Err "winget is not available on this machine (needs Windows 10 1809+ or Windows 11)."
    Write-Host "  Install Node.js LTS manually from https://nodejs.org and re-run this script."
    exit 1
  }

  $answer = Read-Host "Install Node.js LTS via winget now? (y/N)"
  if ($answer -notmatch '^(y|yes)$') { Write-Err "Aborted."; exit 1 }

  Write-Host "  Running: winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements"
  winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) { Write-Err "Node install failed."; exit 1 }

  # Refresh PATH for this session so the freshly installed node.exe is visible.
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
              [System.Environment]::GetEnvironmentVariable("Path","User")

  $nodeMajor = Get-NodeMajor
  if ($nodeMajor -lt 18) {
    Write-Err "Node still not detected. Close this window, open a new PowerShell, and re-run setup.cmd."
    exit 1
  }
  Write-Ok "Node $(node -v) installed."
}

# ---------- 2. Check / install MongoDB ----------
Write-Step "Checking MongoDB"

function Test-Mongo {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $c.ReceiveTimeout = 1200; $c.SendTimeout = 1200
    $iar = $c.BeginConnect('127.0.0.1', 27017, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(1500, $false)
    if ($ok -and $c.Connected) { $c.EndConnect($iar); $c.Close(); return $true }
    $c.Close(); return $false
  } catch { return $false }
}

if (Test-Mongo) {
  Write-Ok "MongoDB is running on localhost:27017"
} else {
  Write-Warn "MongoDB is not reachable at localhost:27017"
  $hasWinget = Get-Command winget -ErrorAction SilentlyContinue
  if ($hasWinget) {
    $answer = Read-Host "Install MongoDB Community Server via winget now? (y/N)"
    if ($answer -match '^(y|yes)$') {
      winget install --id MongoDB.Server -e --silent --accept-source-agreements --accept-package-agreements
      if ($LASTEXITCODE -ne 0) {
        Write-Err "MongoDB install failed. Install manually from https://www.mongodb.com/try/download/community"
        exit 1
      }
      # winget installs the service, but it may need a moment to start
      Start-Sleep -Seconds 3
      try { Start-Service "MongoDB" -ErrorAction SilentlyContinue } catch {}
      Start-Sleep -Seconds 3
      if (-not (Test-Mongo)) {
        Write-Warn "MongoDB installed but not reachable yet."
        Write-Host "  Open Services (services.msc), make sure 'MongoDB Server (MongoDB)' is Running."
        Write-Host "  Then re-run setup.cmd."
        exit 1
      }
      Write-Ok "MongoDB installed and running."
    } else {
      Write-Err "Aborted. Install MongoDB and re-run."
      exit 1
    }
  } else {
    Write-Err "winget unavailable. Install MongoDB Community from https://www.mongodb.com/try/download/community"
    exit 1
  }
}

# ---------- 3. Hand off to setup.js ----------
Write-Step "Running cross-platform setup"
$nodeArgs = @("setup.js") + $Args
& node $nodeArgs
exit $LASTEXITCODE
