# Runs from install.cmd using Windows built-in PowerShell. No Node.js required.
$ErrorActionPreference = 'Stop'
$name = 'tabby-ssh-image-paste'
$package = Get-Content (Join-Path $PSScriptRoot 'package.json') -Raw | ConvertFrom-Json
if ($package.name -ne $name -or !(Test-Path (Join-Path $PSScriptRoot 'dist/index.js'))) {
    throw 'Extract the complete ZIP before running install.cmd'
}
$plugins = Join-Path $env:APPDATA 'tabby/plugins'
$local = Join-Path $plugins "local-plugins/$name"
$modules = Join-Path $plugins 'node_modules'
$backup = Join-Path $plugins ('backups/image-paste-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $modules, $backup | Out-Null
if (Test-Path $local) { Copy-Item $local (Join-Path $backup 'local-package') -Recurse }
New-Item -ItemType Directory -Force -Path $local | Out-Null
foreach ($file in @('package.json', 'LICENSE', 'README.md', 'CHANGELOG.md', 'dist')) {
    Copy-Item (Join-Path $PSScriptRoot $file) $local -Recurse -Force
}
foreach ($old in @('tabby-ssh-image-clipboard', $name)) {
    $target = Join-Path $modules $old
    if (Test-Path $target) { Move-Item $target (Join-Path $backup $old) }
}
try {
    New-Item -ItemType Junction -Path (Join-Path $modules $name) -Target $local | Out-Null
} catch {
    foreach ($old in @('tabby-ssh-image-clipboard', $name)) {
        $saved = Join-Path $backup $old
        if (Test-Path $saved) { Move-Item $saved (Join-Path $modules $old) }
    }
    throw
}
$manifest = Join-Path $plugins 'package.json'
$config = if (Test-Path $manifest) { Get-Content $manifest -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
if (!$config.dependencies) { $config | Add-Member dependencies ([pscustomobject]@{}) -Force }
$config.dependencies.PSObject.Properties.Remove('tabby-ssh-image-clipboard')
$config.dependencies | Add-Member $name "file:local-plugins/$name" -Force
$json = ConvertTo-Json $config -Depth 50
[System.IO.File]::WriteAllText("$manifest.tmp", $json + "`n", (New-Object System.Text.UTF8Encoding $false))
Move-Item "$manifest.tmp" $manifest -Force
Write-Host "Installed $name $($package.version). Backup: $backup"
