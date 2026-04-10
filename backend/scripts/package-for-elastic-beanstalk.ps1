# Creates eb-backend-elasticbeanstalk.zip in the project root (parent of backend/).
# Upload that single zip to Elastic Beanstalk. Root of zip = backend app root (package.json at top level).

$ErrorActionPreference = "Stop"
$backendRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $backendRoot
$staging = Join-Path $env:TEMP ("eb-backend-staging-" + [Guid]::NewGuid().ToString("N"))
$zipPath = Join-Path $projectRoot "eb-backend-elasticbeanstalk.zip"

try {
  New-Item -ItemType Directory -Path $staging -Force | Out-Null
  robocopy $backendRoot $staging /E `
    /XD node_modules .git `
    /XF db.zip .env *.dump detox_backup.sql detox_full_backup.sql `
    /NFL /NDL /NJH /NJS
  $rc = $LASTEXITCODE
  if ($rc -ge 8) { throw "robocopy failed (exit $rc)" }

  $ebExt = Join-Path $staging ".ebextensions\01-eb-deploy.config"
  if (-not (Test-Path $ebExt)) {
    throw "Missing $ebExt - .ebextensions must be in the zip. Check backend/.ebextensions exists."
  }

  $procfile = Join-Path $staging "Procfile"
  if (-not (Test-Path $procfile)) {
    throw "Missing $procfile - EB needs Procfile (e.g. web: node server.js)."
  }

  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

  # Compress-Archive uses '\' in ZIP paths; Linux unzip on EB can fail.
  # Use tar -a (ZIP). Run from staging via Push-Location (works on Windows PowerShell 5.x).
  $tar = Get-Command tar.exe -ErrorAction SilentlyContinue
  if (-not $tar) {
    throw "tar.exe not found. Use Windows 10+ (built-in tar) or Git Bash zip."
  }
  Push-Location -LiteralPath $staging
  try {
    & tar.exe -a -c -f $zipPath .
    if ($LASTEXITCODE -ne 0) { throw "tar zip failed (exit $LASTEXITCODE)" }
  } finally {
    Pop-Location
  }

  $info = Get-Item $zipPath
  Write-Host "OK: $($info.FullName)"
  Write-Host "Size: $([math]::Round($info.Length / 1MB, 2)) MB"
} finally {
  if (Test-Path $staging) { Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue }
}
