Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = "C:\Users\Hitesh\Desktop\backend-backup-20260409-221612.zip"
if (-not (Test-Path -LiteralPath $zip)) {
  Write-Host "FAIL: Zip not found: $zip"
  exit 1
}

$fi = Get-Item -LiteralPath $zip
$z = [IO.Compression.ZipFile]::OpenRead($zip)
$entries = @($z.Entries)
$z.Dispose()

$names = $entries | ForEach-Object { $_.FullName.Replace("\", "/") }
$files = $entries | Where-Object { -not $_.FullName.EndsWith("/") }

Write-Host "=== Zip summary ==="
Write-Host "Path: $zip"
Write-Host "Disk: $($fi.Length) bytes ($([math]::Round($fi.Length/1024,2)) KB)"
Write-Host "Total entries: $($entries.Count) | File entries: $($files.Count)"
Write-Host ""

function Has-Any([string[]] $patterns) {
  foreach ($p in $patterns) {
    $hit = $names | Where-Object { $_ -like $p }
    if ($hit) { return $hit }
  }
  return @()
}

# Critical for Node EB (typical)
$critical = @(
  @{ Label = "package.json"; Patterns = @("package.json", "*/package.json", "backend/package.json") },
  @{ Label = "server.js (or app entry)"; Patterns = @("server.js", "*/server.js", "backend/server.js") },
  @{ Label = ".ebextensions (any)"; Patterns = @(".ebextensions/*", "*/.ebextensions/*", "backend/.ebextensions/*") },
  @{ Label = "Procfile (optional but common)"; Patterns = @("Procfile", "*/Procfile", "backend/Procfile") }
)

Write-Host "=== Critical paths (pattern match) ==="
$allOk = $true
foreach ($c in $critical) {
  $hit = Has-Any $c.Patterns
  if ($hit.Count -gt 0) {
    Write-Host "[OK] $($c.Label):"
    $hit | Select-Object -First 5 | ForEach-Object { Write-Host "     $_" }
    if ($hit.Count -gt 5) { Write-Host "     ... ($($hit.Count) total)" }
  } else {
    Write-Host "[WARN] $($c.Label): NOT FOUND"
    if ($c.Label -notmatch "optional") { $allOk = $false }
  }
}
Write-Host ""

# Procfile marked optional for allOk
if (-not (Has-Any @("Procfile", "*/Procfile", "backend/Procfile")).Count) {
  Write-Host "(Procfile missing is OK if EB Node platform uses package.json start script only.)"
  Write-Host ""
}

# Bad: node_modules in zip (huge) - warn only
$nm = $names | Where-Object { $_ -match "(^|/)node_modules(/|$)" }
if ($nm.Count -gt 0) {
  Write-Host "=== NOTE: node_modules present ($($nm.Count) paths) - large deploy bundle ==="
} else {
  Write-Host "=== OK: no node_modules paths in zip (EB will npm install if configured) ==="
}
Write-Host ""

# Bad: dumps
$bad = $names | Where-Object { $_ -match "\.(dump|sql)$" -and $_ -notmatch "/migrations/" }
if ($bad.Count -gt 0) {
  Write-Host "=== WARN: non-migration .sql/.dump in zip (may be unnecessary) ==="
  $bad | ForEach-Object { Write-Host "     $_" }
} else {
  Write-Host "=== OK: no stray root-level .sql/.dump (excluding path heuristic) ==="
}
Write-Host ""

# Top-level layout
$roots = $names | ForEach-Object {
  $x = $_
  if ($x -match "^([^/]+)/") { $matches[1] } elseif ($x -notmatch "/") { "." } else { "?" }
} | Sort-Object -Unique
Write-Host "=== Top-level path prefixes (first segment) ==="
$roots | ForEach-Object { Write-Host "     $_" }
Write-Host ""

# EB expects: either flat (server.js at root of zip) OR single folder - both work if EB app root matches
$flatServer = $names -contains "server.js"
$nestedServer = ($names | Where-Object { $_ -match "(^|/)backend/server\.js$" }).Count -gt 0
Write-Host "=== Layout ==="
if ($flatServer) { Write-Host "Looks FLAT (server.js at zip root) - typical EB source bundle." }
elseif ($nestedServer) { Write-Host "Looks NESTED (backend/server.js) - set EB application root to 'backend' OR use -ElasticBeanstalk zip without outer folder." }
else { Write-Host "WARN: server.js not found at common paths."; $allOk = $false }
Write-Host ""

if ($allOk) {
  Write-Host "RESULT: Ready for review - critical app + .ebextensions found. Confirm EB console app root matches zip layout."
  exit 0
} else {
  Write-Host "RESULT: Fix missing critical files before deploy."
  exit 2
}
