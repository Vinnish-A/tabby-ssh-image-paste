@echo off
setlocal
set "TABBY_IMAGE_INSTALLER=%~f0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$lines=Get-Content -LiteralPath $env:TABBY_IMAGE_INSTALLER; $start=[Array]::IndexOf($lines,'# POWERSHELL_START'); try { & ([scriptblock]::Create(($lines[($start+1)..($lines.Length-1)] -join [Environment]::NewLine))) } catch { Write-Error $_; exit 1 }"
if errorlevel 1 (
  echo Installation failed. Your current Tabby window was not restarted.
  pause
  exit /b 1
)
echo Reopen Tabby to load the installed plugin.
pause
exit /b 0
# POWERSHELL_START
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repo = 'Vinnish-A/tabby-ssh-image-paste'
Write-Host 'Checking the published plugin version on GitHub...'
$package = Invoke-RestMethod -Uri "https://raw.githubusercontent.com/$repo/main/package.json" -TimeoutSec 30
$version = $package.version
if ($package.name -ne 'tabby-ssh-image-paste' -or $version -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid release metadata' }
$installedPath = Join-Path $env:APPDATA 'tabby/plugins/local-plugins/tabby-ssh-image-paste/package.json'
if (Test-Path $installedPath) {
    $installed = Get-Content $installedPath -Raw | ConvertFrom-Json
    if ([version]$installed.version -gt [version]$version) { throw 'GitHub returned an older version; keeping the installed plugin. Try again later.' }
}
$temp = Join-Path ([IO.Path]::GetTempPath()) ('tabby-image-install-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory $temp | Out-Null
try {
    Write-Host "Downloading version $version..."
    $zip = Join-Path $temp 'plugin.zip'
    Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/$repo/archive/refs/tags/v$version.zip" -OutFile $zip -TimeoutSec 120
    Expand-Archive -LiteralPath $zip -DestinationPath $temp
    $source = Join-Path $temp "tabby-ssh-image-paste-$version"
    $downloaded = Get-Content (Join-Path $source 'package.json') -Raw | ConvertFrom-Json
    if ($downloaded.name -ne 'tabby-ssh-image-paste' -or $downloaded.version -ne $version) { throw 'Downloaded version does not match' }
    & (Join-Path $source 'install.ps1')
} finally { Remove-Item -LiteralPath $temp -Recurse -Force }
