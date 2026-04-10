# Backend zip helper - backup (small) vs Elastic Beanstalk-style bundle (larger).
#
# Default: excludes node_modules (SMALL zip). This is normal. It does NOT mean code is missing.
# Old EB zips are often MUCH larger because they included node_modules (dependencies).
#
# Elastic Beanstalk:
#   - Prefer flat zip root (no outer "backend" folder): .\backup-backend.ps1 -ElasticBeanstalk
#   - With -ElasticBeanstalk, tar.exe is used when available (Linux-friendly ZIP paths for EB).
#   - Alternative: backend\scripts\package-for-elastic-beanstalk.ps1 (always tar; fixed name on repo root).
#   - If your EB console "Root directory" is "backend", the default nested zip is also valid.
#
# Usage - small backup (default):
#   .\backup-backend.ps1
#
# Usage - EB-style layout (files at zip root; still no node_modules unless installed locally):
#   .\backup-backend.ps1 -ElasticBeanstalk
#
# Usage - include node_modules (run npm install in backend first if needed):
#   .\backup-backend.ps1 -ElasticBeanstalk -IncludeNodeModules
#
param(
  [switch] $IncludeNodeModules,
  [switch] $ElasticBeanstalk,
  [string] $OutPath = ""
)

$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"

if (-not (Test-Path -LiteralPath $Backend)) {
  Write-Error "backend folder not found: $Backend"
  exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$desktop = [Environment]::GetFolderPath("Desktop")

if ($OutPath) {
  $zipPath = $OutPath
} elseif ($ElasticBeanstalk) {
  $zipName = "eb-backend-elasticbeanstalk-$stamp.zip"
  $zipPath = Join-Path $desktop $zipName
} else {
  $zipName = "backend-backup-$stamp.zip"
  $zipPath = Join-Path $desktop $zipName
}

$tempParent = Join-Path $env:TEMP ("backend-zip-" + [guid]::NewGuid().ToString("N"))
$tempStaging = Join-Path $tempParent "staging"

try {
  New-Item -ItemType Directory -Path $tempStaging -Force | Out-Null

  $robocopyArgs = @(
    $Backend,
    $tempStaging,
    "/E",
    "/NFL", "/NDL", "/NJH", "/NJS"
  )
  if (-not $IncludeNodeModules) {
    $robocopyArgs += "/XD"
    $robocopyArgs += "node_modules"
  }
  $robocopyArgs += "/XD"
  $robocopyArgs += ".git"
  # Omit local DB dumps / one-off SQL backups (not in old EB bundle; they add ~30+ KB compressed).
  $robocopyArgs += "/XF"
  $robocopyArgs += "*.dump"
  $robocopyArgs += "detox_backup.sql"
  $robocopyArgs += "detox_full_backup.sql"

  & robocopy.exe @robocopyArgs | Out-Null
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE"
  }

  if (-not (Get-Command Compress-Archive -ErrorAction SilentlyContinue)) {
    throw "Compress-Archive not available (requires PowerShell 5+)"
  }

  if ($ElasticBeanstalk) {
    $items = Get-ChildItem -LiteralPath $tempStaging -Force
    if ($items.Count -eq 0) {
      throw "Staging folder is empty; nothing to zip."
    }
    $ebExt = Join-Path $tempStaging ".ebextensions\01-eb-deploy.config"
    if (-not (Test-Path -LiteralPath $ebExt)) {
      Write-Warning ".ebextensions\01-eb-deploy.config not found in staged copy; verify backend/.ebextensions before deploy."
    }
    $procfile = Join-Path $tempStaging "Procfile"
    if (-not (Test-Path -LiteralPath $procfile)) {
      Write-Warning "Procfile not found in staged copy; EB may not start the app correctly."
    }
    if (Test-Path -LiteralPath $zipPath) {
      Remove-Item -LiteralPath $zipPath -Force
    }
    $tar = Get-Command tar.exe -ErrorAction SilentlyContinue
    if ($tar) {
      Push-Location -LiteralPath $tempStaging
      try {
        & tar.exe -a -c -f $zipPath .
        if ($LASTEXITCODE -ne 0) {
          throw "tar zip failed (exit $LASTEXITCODE)"
        }
      } finally {
        Pop-Location
      }
    } else {
      Write-Warning "tar.exe not found; using Compress-Archive (ZIP may use backslashes; prefer Windows 10+ tar or backend\scripts\package-for-elastic-beanstalk.ps1)."
      Compress-Archive -Path ($items.FullName) -DestinationPath $zipPath -Force
    }
  } else {
    $tempWrap = Join-Path $tempParent "backend"
    New-Item -ItemType Directory -Path $tempWrap -Force | Out-Null
    & robocopy.exe $tempStaging $tempWrap /E /NFL /NDL /NJH /NJS | Out-Null
    if ($LASTEXITCODE -gt 7) {
      throw "robocopy wrap failed with exit code $LASTEXITCODE"
    }
    Compress-Archive -LiteralPath $tempWrap -DestinationPath $zipPath -Force
  }

  $sizeMb = [math]::Round((Get-Item -LiteralPath $zipPath).Length / 1MB, 2)
  Write-Host "Created: $zipPath ($sizeMb MB)"
  if (-not $IncludeNodeModules) {
    Write-Host "Note: node_modules was excluded - zip is smaller than a bundle that includes dependencies."
  }
}
finally {
  if (Test-Path -LiteralPath $tempParent) {
    Remove-Item -LiteralPath $tempParent -Recurse -Force -ErrorAction SilentlyContinue
  }
}
