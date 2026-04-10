# Full Elastic Beanstalk-style bundle (LARGE zip - includes node_modules).
#
# Use this when you want a zip similar in SIZE to an older "eb-backend-elasticbeanstalk*.zip"
# that was built with dependencies inside the archive.
#
# The SMALL script backup-backend.ps1 (default) only backs up SOURCE - that is normal and safe.
# AWS EB can still deploy from a small zip if the platform runs "npm install" on the server.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File "C:\CIC project\cic-digitl-detox-challenge-tracker\backup-backend-for-eb.ps1"
#
# Skip npm (only if backend\node_modules is already installed):
#   .\backup-backend-for-eb.ps1 -SkipNpmInstall
#
param(
  [switch] $SkipNpmInstall
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$MainScript = Join-Path $Root "backup-backend.ps1"

if (-not (Test-Path -LiteralPath $MainScript)) {
  Write-Error "backup-backend.ps1 not found next to this script."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm not found in PATH. Install Node.js, then run again."
  exit 1
}

if (-not $SkipNpmInstall) {
  Write-Host "Running npm install --omit=dev in backend (this may take a minute)..."
  Push-Location $Backend
  try {
    npm install --omit=dev
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

Write-Host "Creating EB-style zip with node_modules (large file)..."
& powershell.exe -ExecutionPolicy Bypass -File $MainScript -ElasticBeanstalk -IncludeNodeModules

Write-Host ""
Write-Host "Done. Compare this Desktop zip size to your old EB artifact."
Write-Host "Small source-only backups from backup-backend.ps1 will NOT match that size - that is expected."
